from prompt_toolkit import PromptSession, print_formatted_text
from prompt_toolkit.completion import FuzzyWordCompleter
from prompt_toolkit.formatted_text import HTML
from prompt_toolkit.shortcuts import print_container
from prompt_toolkit.widgets import Frame, TextArea
from pydantic import SecretStr

from app.cli.tui import (
    COLOR_GREY,
    UserCancelledError,
    cli_confirm,
    kb_cancel,
)
from app.cli.utils import (
    VERIFIED_ANTHROPIC_MODELS,
    VERIFIED_OPENAI_MODELS,
    VERIFIED_PROVIDERS,
    organize_models_and_providers,
)
from app.controller.agent import Agent
from app.core.config import OpenReplicaConfig
from app.core.config.condenser_config import NoOpCondenserConfig
from app.core.config.utils import OH_DEFAULT_AGENT
from app.memory.condenser.impl.llm_summarizing_condenser import (
    LLMSummarizingCondenserConfig,
)
from app.storage.data_models.settings import Settings
from app.storage.settings.file_settings_store import FileSettingsStore
from app.utils.llm import get_supported_llm_models


def display_settings(config: OpenReplicaConfig) -> None:
    llm_config = config.get_llm_config()
    advanced_llm_settings = True if llm_config.base_url else False

    # Prepare labels and values based on settings
    labels_and_values = []
    if not advanced_llm_settings:
        # Attempt to determine provider, fallback if not directly available
        provider = getattr(
            llm_config,
            'provider',
            llm_config.model.split('/')[0] if '/' in llm_config.model else 'Unknown',
        )
        labels_and_values.extend(
            [
                ('   LLM Provider', str(provider)),
                ('   LLM Model', str(llm_config.model)),
                ('   API Key', '********' if llm_config.api_key else 'Not Set'),
            ]
        )
    else:
        labels_and_values.extend(
            [
                ('   Custom Model', str(llm_config.model)),
                ('   Base URL', str(llm_config.base_url)),
                ('   API Key', '********' if llm_config.api_key else 'Not Set'),
            ]
        )

    # Common settings
    labels_and_values.extend(
        [
            ('   Agent', str(config.default_agent)),
            (
                '   Confirmation Mode',
                'Enabled' if config.security.confirmation_mode else 'Disabled',
            ),
            (
                '   Memory Condensation',
                'Enabled' if config.enable_default_condenser else 'Disabled',
            ),
        ]
    )

    # Calculate max widths for alignment
    # Ensure values are strings for len() calculation
    str_labels_and_values = [(label, str(value)) for label, value in labels_and_values]
    max_label_width = (
        max(len(label) for label, _ in str_labels_and_values)
        if str_labels_and_values
        else 0
    )

    # Construct the summary text with aligned columns
    settings_lines = [
        f'{label + ":":<{max_label_width + 1}} {value:<}'  # Changed value alignment to left (<)
        for label, value in str_labels_and_values
    ]
    settings_text = '\n'.join(settings_lines)

    container = Frame(
        TextArea(
            text=settings_text,
            read_only=True,
            style=COLOR_GREY,
            wrap_lines=True,
        ),
        title='Settings',
        style=f'fg:{COLOR_GREY}',
    )

    print_container(container)


async def get_validated_input(
    session: PromptSession,
    prompt_text: str,
    completer=None,
    validator=None,
    error_message: str = 'Input cannot be empty',
) -> str:
    session.completer = completer
    value = None

    while True:
        value = await session.prompt_async(prompt_text)

        if validator:
            is_valid = validator(value)
            if not is_valid:
                print_formatted_text('')
                print_formatted_text(HTML(f'<grey>{error_message}: {value}</grey>'))
                print_formatted_text('')
                continue
        elif not value:
            print_formatted_text('')
            print_formatted_text(HTML(f'<grey>{error_message}</grey>'))
            print_formatted_text('')
            continue

        break

    return value


def save_settings_confirmation() -> bool:
    return (
        cli_confirm(
            '\nSave new settings? (They will take effect after restart)',
            ['Yes, save', 'No, discard'],
        )
        == 0
    )


async def modify_llm_settings_basic(
    config: OpenReplicaConfig, settings_store: FileSettingsStore
) -> None:
    model_list = get_supported_llm_models(config)
    organized_models = organize_models_and_providers(model_list)

    provider_list = list(organized_models.keys())
    verified_providers = [p for p in VERIFIED_PROVIDERS if p in provider_list]
    provider_list = [p for p in provider_list if p not in verified_providers]
    provider_list = verified_providers + provider_list

    provider_completer = FuzzyWordCompleter(provider_list)
    session = PromptSession(key_bindings=kb_cancel())

    provider = None
    model = None
    api_key = None

    try:
        provider = await get_validated_input(
            session,
            '(Step 1/3) Select LLM Provider (TAB for options, CTRL-c to cancel): ',
            completer=provider_completer,
            validator=lambda x: x in organized_models,
            error_message='Invalid provider selected',
        )

        provider_models = organized_models[provider]['models']
        if provider == 'openai':
            provider_models = [
                m for m in provider_models if m not in VERIFIED_OPENAI_MODELS
            ]
            provider_models = VERIFIED_OPENAI_MODELS + provider_models
        if provider == 'anthropic':
            provider_models = [
                m for m in provider_models if m not in VERIFIED_ANTHROPIC_MODELS
            ]
            provider_models = VERIFIED_ANTHROPIC_MODELS + provider_models

        model_completer = FuzzyWordCompleter(provider_models)
        model = await get_validated_input(
            session,
            '(Step 2/3) Select LLM Model (TAB for options, CTRL-c to cancel): ',
            completer=model_completer,
            validator=lambda x: x in provider_models,
            error_message=f'Invalid model selected for provider {provider}',
        )

        api_key = await get_validated_input(
            session,
            '(Step 3/3) Enter API Key (CTRL-c to cancel): ',
            error_message='API Key cannot be empty',
        )

    except (
        UserCancelledError,
        KeyboardInterrupt,
        EOFError,
    ):
        return  # Return on exception

    # The try-except block above ensures we either have valid inputs or we've already returned
    # No need to check for None values here

    save_settings = save_settings_confirmation()

    if not save_settings:
        return

    llm_config = config.get_llm_config()
    llm_config.model = f'{provider}{organized_models[provider]["separator"]}{model}'
    llm_config.api_key = SecretStr(api_key)
    llm_config.base_url = None
    config.set_llm_config(llm_config)

    config.default_agent = OH_DEFAULT_AGENT
    config.enable_default_condenser = True

    agent_config = config.get_agent_config(config.default_agent)
    agent_config.condenser = LLMSummarizingCondenserConfig(
        llm_config=llm_config,
        type='llm',
    )
    config.set_agent_config(agent_config, config.default_agent)

    settings = await settings_store.load()
    if not settings:
        settings = Settings()

    settings.llm_model = f'{provider}{organized_models[provider]["separator"]}{model}'
    settings.llm_api_key = SecretStr(api_key)
    settings.llm_base_url = None
    settings.agent = OH_DEFAULT_AGENT
    settings.enable_default_condenser = True

    await settings_store.store(settings)


async def modify_llm_settings_advanced(
    config: OpenReplicaConfig, settings_store: FileSettingsStore
) -> None:
    session = PromptSession(key_bindings=kb_cancel())

    custom_model = None
    base_url = None
    api_key = None
    agent = None

    try:
        custom_model = await get_validated_input(
            session,
            '(Step 1/6) Custom Model (CTRL-c to cancel): ',
            error_message='Custom Model cannot be empty',
        )

        base_url = await get_validated_input(
            session,
            '(Step 2/6) Base URL (CTRL-c to cancel): ',
            error_message='Base URL cannot be empty',
        )

        api_key = await get_validated_input(
            session,
            '(Step 3/6) API Key (CTRL-c to cancel): ',
            error_message='API Key cannot be empty',
        )

        agent_list = Agent.list_agents()
        agent_completer = FuzzyWordCompleter(agent_list)
        agent = await get_validated_input(
            session,
            '(Step 4/6) Agent (TAB for options, CTRL-c to cancel): ',
            completer=agent_completer,
            validator=lambda x: x in agent_list,
            error_message='Invalid agent selected',
        )

        enable_confirmation_mode = (
            cli_confirm(
                question='(Step 5/6) Confirmation Mode (CTRL-c to cancel):',
                choices=['Enable', 'Disable'],
            )
            == 0
        )

        enable_memory_condensation = (
            cli_confirm(
                question='(Step 6/6) Memory Condensation (CTRL-c to cancel):',
                choices=['Enable', 'Disable'],
            )
            == 0
        )

    except (
        UserCancelledError,
        KeyboardInterrupt,
        EOFError,
    ):
        return  # Return on exception

    # The try-except block above ensures we either have valid inputs or we've already returned
    # No need to check for None values here

    save_settings = save_settings_confirmation()

    if not save_settings:
        return

    llm_config = config.get_llm_config()
    llm_config.model = custom_model
    llm_config.base_url = base_url
    llm_config.api_key = SecretStr(api_key)
    config.set_llm_config(llm_config)

    config.default_agent = agent

    config.security.confirmation_mode = enable_confirmation_mode

    agent_config = config.get_agent_config(config.default_agent)
    if enable_memory_condensation:
        agent_config.condenser = LLMSummarizingCondenserConfig(
            llm_config=llm_config,
            type='llm',
        )
    else:
        agent_config.condenser = NoOpCondenserConfig(type='noop')
    config.set_agent_config(agent_config)

    settings = await settings_store.load()
    if not settings:
        settings = Settings()

    settings.llm_model = custom_model
    settings.llm_api_key = SecretStr(api_key)
    settings.llm_base_url = base_url
    settings.agent = agent
    settings.confirmation_mode = enable_confirmation_mode
    settings.enable_default_condenser = enable_memory_condensation

    await settings_store.store(settings)
