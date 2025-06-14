import os

from app.utils.import_utils import get_impl


class ConversationValidator:
    """Storage for conversation metadata. May or may not support multiple users depending on the environment."""

    async def validate(
        self,
        conversation_id: str,
        cookies_str: str,
        authorization_header: str | None = None,
    ) -> str | None:
        return None


def create_conversation_validator() -> ConversationValidator:
    conversation_validator_cls = os.environ.get(
        'OPENHANDS_CONVERSATION_VALIDATOR_CLS',
        'app.storage.conversation.conversation_validator.ConversationValidator',
    )
    ConversationValidatorImpl = get_impl(
        ConversationValidator, conversation_validator_cls
    )
    return ConversationValidatorImpl()
