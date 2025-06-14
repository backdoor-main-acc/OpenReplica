from __future__ import annotations

from abc import ABC, abstractmethod

import socketio

from app.core.config import OpenReplicaConfig
from app.events.action import MessageAction
from app.server.config.server_config import ServerConfig
from app.server.data_models.agent_loop_info import AgentLoopInfo
from app.server.monitoring import MonitoringListener
from app.server.session.conversation import ServerConversation
from app.storage.conversation.conversation_store import ConversationStore
from app.storage.data_models.settings import Settings
from app.storage.files import FileStore


class ConversationManager(ABC):
    """Abstract base class for managing conversations in OpenReplica.

    This class defines the interface for managing conversations, whether in standalone
    or clustered mode. It handles the lifecycle of conversations, including creation,
    attachment, detachment, and cleanup.
    """

    sio: socketio.AsyncServer
    config: OpenReplicaConfig
    file_store: FileStore
    conversation_store: ConversationStore

    @abstractmethod
    async def __aenter__(self):
        """Initialize the conversation manager."""

    @abstractmethod
    async def __aexit__(self, exc_type, exc_value, traceback):
        """Clean up the conversation manager."""

    @abstractmethod
    async def attach_to_conversation(
        self, sid: str, user_id: str | None = None
    ) -> ServerConversation | None:
        """Attach to an existing conversation or create a new one."""

    @abstractmethod
    async def detach_from_conversation(self, conversation: ServerConversation):
        """Detach from a conversation."""

    @abstractmethod
    async def join_conversation(
        self,
        sid: str,
        connection_id: str,
        settings: Settings,
        user_id: str | None,
    ) -> AgentLoopInfo | None:
        """Join a conversation and return its event stream."""

    async def is_agent_loop_running(self, sid: str) -> bool:
        """Check if an agent loop is running for the given session ID."""
        sids = await self.get_running_agent_loops(filter_to_sids={sid})
        return bool(sids)

    @abstractmethod
    async def get_running_agent_loops(
        self, user_id: str | None = None, filter_to_sids: set[str] | None = None
    ) -> set[str]:
        """Get all running agent loops, optionally filtered by user ID and session IDs."""

    @abstractmethod
    async def get_connections(
        self, user_id: str | None = None, filter_to_sids: set[str] | None = None
    ) -> dict[str, str]:
        """Get all connections, optionally filtered by user ID and session IDs."""

    @abstractmethod
    async def maybe_start_agent_loop(
        self,
        sid: str,
        settings: Settings,
        user_id: str | None,
        initial_user_msg: MessageAction | None = None,
        replay_json: str | None = None,
    ) -> AgentLoopInfo:
        """Start an event loop if one is not already running"""

    @abstractmethod
    async def send_to_event_stream(self, connection_id: str, data: dict):
        """Send data to an event stream."""

    @abstractmethod
    async def disconnect_from_session(self, connection_id: str):
        """Disconnect from a session."""

    @abstractmethod
    async def close_session(self, sid: str):
        """Close a session."""

    @abstractmethod
    async def get_agent_loop_info(
        self, user_id: str | None = None, filter_to_sids: set[str] | None = None
    ) -> list[AgentLoopInfo]:
        """Get the AgentLoopInfo for conversations."""

    @classmethod
    @abstractmethod
    def get_instance(
        cls,
        sio: socketio.AsyncServer,
        config: OpenReplicaConfig,
        file_store: FileStore,
        server_config: ServerConfig,
        monitoring_listener: MonitoringListener,
    ) -> ConversationManager:
        """Get a conversation manager instance"""
