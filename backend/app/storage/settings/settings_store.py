from __future__ import annotations

from abc import ABC, abstractmethod

from app.core.config.openreplica_config import OpenReplicaConfig
from app.storage.data_models.settings import Settings


class SettingsStore(ABC):
    """Storage for ConversationInitData. May or may not support multiple users depending on the environment."""

    @abstractmethod
    async def load(self) -> Settings | None:
        """Load session init data."""

    @abstractmethod
    async def store(self, settings: Settings) -> None:
        """Store session init data."""

    @classmethod
    @abstractmethod
    async def get_instance(
        cls, config: OpenReplicaConfig, user_id: str | None
    ) -> SettingsStore:
        """Get a store for the user represented by the token given."""
