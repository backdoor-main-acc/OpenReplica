from typing import Any

from litellm import BaseModel

from app.resolver.interfaces.issue import Issue


class ResolverOutput(BaseModel):
    # NOTE: User-specified
    issue: Issue
    issue_type: str
    instruction: str
    base_commit: str
    git_patch: str
    history: list[dict[str, Any]]
    metrics: dict[str, Any] | None
    success: bool
    comment_success: list[bool] | None
    result_explanation: str
    error: str | None
