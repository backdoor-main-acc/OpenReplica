from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.integrations.service_types import ProviderType
from app.storage.data_models.conversation_metadata import ConversationTrigger
from app.storage.data_models.conversation_status import ConversationStatus


@dataclass
class ConversationInfo:
    """
    Information about a conversation. This combines conversation metadata with
    information on whether a conversation is currently running
    """

    conversation_id: str
    title: str
    last_updated_at: datetime | None = None
    status: ConversationStatus = ConversationStatus.STOPPED
    selected_repository: str | None = None
    selected_branch: str | None = None
    git_provider: ProviderType | None = None
    trigger: ConversationTrigger | None = None
    num_connections: int = 0
    url: str | None = None
    session_api_key: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
