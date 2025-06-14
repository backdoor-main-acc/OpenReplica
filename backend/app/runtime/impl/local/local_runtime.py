"""This runtime runs the action_execution_server directly on the local machine without Docker."""

import os
import shutil
import subprocess
import sys
import tempfile
import threading
from typing import Callable

import httpx
import tenacity

import openhands
from app.core.config import OpenReplicaConfig
from app.core.exceptions import AgentRuntimeDisconnectedError
from app.core.logger import openreplica_logger as logger
from app.events import EventStream
from app.events.action import (
    Action,
)
from app.events.observation import (
    Observation,
)
from app.events.serialization import event_to_dict, observation_from_dict
from app.runtime.impl.action_execution.action_execution_client import (
    ActionExecutionClient,
)
from app.runtime.impl.docker.docker_runtime import (
    APP_PORT_RANGE_1,
    APP_PORT_RANGE_2,
    EXECUTION_SERVER_PORT_RANGE,
    VSCODE_PORT_RANGE,
)
from app.runtime.plugins import PluginRequirement
from app.runtime.utils import find_available_tcp_port
from app.runtime.utils.command import get_action_execution_server_startup_command
from app.utils.async_utils import call_sync_from_async
from app.utils.tenacity_stop import stop_if_should_exit


def get_user_info() -> tuple[int, str | None]:
    """Get user ID and username in a cross-platform way."""
    username = os.getenv('USER')
    if sys.platform == 'win32':
        # On Windows, we don't use user IDs the same way
        # Return a default value that won't cause issues
        return 1000, username
    else:
        # On Unix systems, use os.getuid()
        return os.getuid(), username


def check_dependencies(code_repo_path: str, poetry_venvs_path: str) -> None:
    ERROR_MESSAGE = 'Please follow the instructions in https://github.com/All-Hands-AI/OpenReplica/blob/main/Development.md to install OpenReplica.'
    if not os.path.exists(code_repo_path):
        raise ValueError(
            f'Code repo path {code_repo_path} does not exist. ' + ERROR_MESSAGE
        )
    if not os.path.exists(poetry_venvs_path):
        raise ValueError(
            f'Poetry venvs path {poetry_venvs_path} does not exist. ' + ERROR_MESSAGE
        )
    # Check jupyter is installed
    logger.debug('Checking dependencies: Jupyter')
    output = subprocess.check_output(
        'poetry run jupyter --version',
        shell=True,
        text=True,
        cwd=code_repo_path,
    )
    logger.debug(f'Jupyter output: {output}')
    if 'jupyter' not in output.lower():
        raise ValueError('Jupyter is not properly installed. ' + ERROR_MESSAGE)

    # Check libtmux is installed (skip on Windows)

    if sys.platform != 'win32':
        logger.debug('Checking dependencies: libtmux')
        import libtmux

        server = libtmux.Server()
        try:
            session = server.new_session(session_name='test-session')
        except Exception:
            raise ValueError('tmux is not properly installed or available on the path.')
        pane = session.attached_pane
        pane.send_keys('echo "test"')
        pane_output = '\n'.join(pane.cmd('capture-pane', '-p').stdout)
        session.kill_session()
        if 'test' not in pane_output:
            raise ValueError('libtmux is not properly installed. ' + ERROR_MESSAGE)

    # Skip browser environment check on Windows
    if sys.platform != 'win32':
        logger.debug('Checking dependencies: browser')
        from app.runtime.browser.browser_env import BrowserEnv

        browser = BrowserEnv()
        browser.close()
    else:
        logger.warning('Running on Windows - browser environment check skipped.')


class LocalRuntime(ActionExecutionClient):
    """This runtime will run the action_execution_server directly on the local machine.
    When receiving an event, it will send the event to the server via HTTP.

    Args:
        config (OpenReplicaConfig): The application configuration.
        event_stream (EventStream): The event stream to subscribe to.
        sid (str, optional): The session ID. Defaults to 'default'.
        plugins (list[PluginRequirement] | None, optional): list of plugin requirements. Defaults to None.
        env_vars (dict[str, str] | None, optional): Environment variables to set. Defaults to None.
    """

    def __init__(
        self,
        config: OpenReplicaConfig,
        event_stream: EventStream,
        sid: str = 'default',
        plugins: list[PluginRequirement] | None = None,
        env_vars: dict[str, str] | None = None,
        status_callback: Callable[[str, str, str], None] | None = None,
        attach_to_existing: bool = False,
        headless_mode: bool = True,
    ) -> None:
        self.is_windows = sys.platform == 'win32'
        if self.is_windows:
            logger.warning(
                'Running on Windows - some features that require tmux will be limited. '
                'For full functionality, please consider using WSL or Docker runtime.'
            )

        self.config = config
        self._user_id, self._username = get_user_info()

        if self.config.workspace_base is not None:
            logger.warning(
                f'Workspace base path is set to {self.config.workspace_base}. '
                'It will be used as the path for the agent to run in. '
                'Be careful, the agent can EDIT files in this directory!'
            )
            self.config.workspace_mount_path_in_sandbox = self.config.workspace_base
            self._temp_workspace = None
        else:
            # A temporary directory is created for the agent to run in
            # This is used for the local runtime only
            self._temp_workspace = tempfile.mkdtemp(
                prefix=f'openhands_workspace_{sid}',
            )
            self.config.workspace_mount_path_in_sandbox = self._temp_workspace

        logger.warning(
            'Initializing LocalRuntime. WARNING: NO SANDBOX IS USED. '
            'This is an experimental feature, please report issues to https://github.com/All-Hands-AI/OpenReplica/issues. '
            '`run_as_openhands` will be ignored since the current user will be used to launch the server. '
            'We highly recommend using a sandbox (eg. DockerRuntime) unless you '
            'are running in a controlled environment.\n'
            f'Temp workspace: {self._temp_workspace}. '
            f'User ID: {self._user_id}. '
            f'Username: {self._username}.'
        )

        if self.config.workspace_base is not None:
            logger.warning(
                f'Workspace base path is set to {self.config.workspace_base}. It will be used as the path for the agent to run in.'
            )
            self.config.workspace_mount_path_in_sandbox = self.config.workspace_base
        else:
            logger.warning(
                'Workspace base path is NOT set. Agent will run in a temporary directory.'
            )
            self._temp_workspace = tempfile.mkdtemp()
            self.config.workspace_mount_path_in_sandbox = self._temp_workspace

        self._host_port = -1
        self._vscode_port = -1
        self._app_ports: list[int] = []

        self.api_url = f'{self.config.sandbox.local_runtime_url}:{self._host_port}'
        self.status_callback = status_callback
        self.server_process: subprocess.Popen[str] | None = None
        self.action_semaphore = threading.Semaphore(1)  # Ensure one action at a time
        self._log_thread_exit_event = threading.Event()  # Add exit event

        # Update env vars
        if self.config.sandbox.runtime_startup_env_vars:
            os.environ.update(self.config.sandbox.runtime_startup_env_vars)

        # Initialize the action_execution_server
        super().__init__(
            config,
            event_stream,
            sid,
            plugins,
            env_vars,
            status_callback,
            attach_to_existing,
            headless_mode,
        )

        # If there is an API key in the environment we use this in requests to the runtime
        session_api_key = os.getenv('SESSION_API_KEY')
        if session_api_key:
            self.session.headers['X-Session-API-Key'] = session_api_key

    @property
    def action_execution_server_url(self) -> str:
        return self.api_url

    async def connect(self) -> None:
        """Start the action_execution_server on the local machine."""
        self.send_status_message('STATUS$STARTING_RUNTIME')

        self._host_port = self._find_available_port(EXECUTION_SERVER_PORT_RANGE)
        self._vscode_port = self._find_available_port(VSCODE_PORT_RANGE)
        self._app_ports = [
            self._find_available_port(APP_PORT_RANGE_1),
            self._find_available_port(APP_PORT_RANGE_2),
        ]
        self.api_url = f'{self.config.sandbox.local_runtime_url}:{self._host_port}'

        # Start the server process
        cmd = get_action_execution_server_startup_command(
            server_port=self._host_port,
            plugins=self.plugins,
            app_config=self.config,
            python_prefix=['poetry', 'run'],
            override_user_id=self._user_id,
            override_username=self._username,
        )

        self.log('debug', f'Starting server with command: {cmd}')
        env = os.environ.copy()
        # Get the code repo path
        code_repo_path = os.path.dirname(os.path.dirname(app.__file__))
        env['PYTHONPATH'] = os.pathsep.join([code_repo_path, env.get('PYTHONPATH', '')])
        env['OPENHANDS_REPO_PATH'] = code_repo_path
        env['LOCAL_RUNTIME_MODE'] = '1'
        env['VSCODE_PORT'] = str(self._vscode_port)

        # Derive environment paths using sys.executable
        interpreter_path = sys.executable
        python_bin_path = os.path.dirname(interpreter_path)
        env_root_path = os.path.dirname(python_bin_path)

        # Prepend the interpreter's bin directory to PATH for subprocesses
        env['PATH'] = f'{python_bin_path}{os.pathsep}{env.get("PATH", "")}'
        logger.debug(f'Updated PATH for subprocesses: {env["PATH"]}')

        # Check dependencies using the derived env_root_path
        check_dependencies(code_repo_path, env_root_path)
        self.server_process = subprocess.Popen(  # noqa: S603
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
            env=env,
            cwd=code_repo_path,  # Explicitly set the working directory
        )

        # Start a thread to read and log server output
        def log_output() -> None:
            if not self.server_process or not self.server_process.stdout:
                self.log('error', 'Server process or stdout not available for logging.')
                return

            try:
                # Read lines while the process is running and stdout is available
                while self.server_process.poll() is None:
                    if self._log_thread_exit_event.is_set():  # Check exit event
                        self.log('info', 'Log thread received exit signal.')
                        break  # Exit loop if signaled
                    line = self.server_process.stdout.readline()
                    if not line:
                        # Process might have exited between poll() and readline()
                        break
                    self.log('info', f'Server: {line.strip()}')

                # Capture any remaining output after the process exits OR if signaled
                if (
                    not self._log_thread_exit_event.is_set()
                ):  # Check again before reading remaining
                    self.log('info', 'Server process exited, reading remaining output.')
                    for line in self.server_process.stdout:
                        if (
                            self._log_thread_exit_event.is_set()
                        ):  # Check inside loop too
                            self.log(
                                'info',
                                'Log thread received exit signal while reading remaining output.',
                            )
                            break
                        self.log('info', f'Server (remaining): {line.strip()}')

            except Exception as e:
                # Log the error, but don't prevent the thread from potentially exiting
                self.log('error', f'Error reading server output: {e}')
            finally:
                self.log(
                    'info', 'Log output thread finished.'
                )  # Add log for thread exit

        self._log_thread = threading.Thread(target=log_output, daemon=True)
        self._log_thread.start()

        self.log('info', f'Waiting for server to become ready at {self.api_url}...')
        self.send_status_message('STATUS$WAITING_FOR_CLIENT')

        await call_sync_from_async(self._wait_until_alive)

        if not self.attach_to_existing:
            await call_sync_from_async(self.setup_initial_env)

        self.log(
            'debug',
            f'Server initialized with plugins: {[plugin.name for plugin in self.plugins]}',
        )
        if not self.attach_to_existing:
            self.send_status_message(' ')
        self._runtime_initialized = True

    def _find_available_port(
        self, port_range: tuple[int, int], max_attempts: int = 5
    ) -> int:
        port = port_range[1]
        for _ in range(max_attempts):
            port = find_available_tcp_port(port_range[0], port_range[1])
            return port
        return port

    @tenacity.retry(
        wait=tenacity.wait_exponential(min=1, max=10),
        stop=tenacity.stop_after_attempt(10) | stop_if_should_exit(),
        before_sleep=lambda retry_state: logger.debug(
            f'Waiting for server to be ready... (attempt {retry_state.attempt_number})'
        ),
    )
    def _wait_until_alive(self) -> bool:
        """Wait until the server is ready to accept requests."""
        if self.server_process and self.server_process.poll() is not None:
            raise RuntimeError('Server process died')

        try:
            response = self.session.get(f'{self.api_url}/alive')
            response.raise_for_status()
            return True
        except Exception as e:
            self.log('debug', f'Server not ready yet: {e}')
            raise

    async def execute_action(self, action: Action) -> Observation:
        """Execute an action by sending it to the server."""
        if not self.runtime_initialized:
            raise AgentRuntimeDisconnectedError('Runtime not initialized')

        if self.server_process is None or self.server_process.poll() is not None:
            raise AgentRuntimeDisconnectedError('Server process died')

        with self.action_semaphore:
            try:
                response = await call_sync_from_async(
                    lambda: self.session.post(
                        f'{self.api_url}/execute_action',
                        json={'action': event_to_dict(action)},
                    )
                )
                return observation_from_dict(response.json())
            except httpx.NetworkError:
                raise AgentRuntimeDisconnectedError('Server connection lost')

    def close(self) -> None:
        """Stop the server process."""
        self._log_thread_exit_event.set()  # Signal the log thread to exit

        if self.server_process:
            self.server_process.terminate()
            try:
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_process.kill()
            self.server_process = None
            self._log_thread.join(timeout=5)  # Add timeout to join

        if self._temp_workspace:
            shutil.rmtree(self._temp_workspace)

        super().close()

    @property
    def runtime_url(self) -> str:

        runtime_url = os.getenv('RUNTIME_URL')
        if runtime_url:
            return runtime_url



        #TODO: This could be removed if we had a straightforward variable containing the RUNTIME_URL in the K8 env.
        runtime_url_pattern = os.getenv('RUNTIME_URL_PATTERN')
        hostname = os.getenv('HOSTNAME')
        if runtime_url_pattern and hostname:
            runtime_id = hostname.split('-')[1]
            runtime_url = runtime_url_pattern.format(runtime_id=runtime_id)
            return runtime_url

        # Fallback to localhost
        return self.config.sandbox.local_runtime_url

    @property
    def vscode_url(self) -> str | None:
        token = super().get_vscode_token()
        if not token:
            return None
        vscode_url = f'{self.runtime_url}:{self._vscode_port}/?tkn={token}&folder={self.config.workspace_mount_path_in_sandbox}'
        return vscode_url

    @property
    def web_hosts(self) -> dict[str, int]:
        hosts: dict[str, int] = {}
        for port in self._app_ports:
            hosts[f'{self.runtime_url}:{port}'] = port
        return hosts
