from datetime import datetime, timezone
from beanie import Document
from pydantic import Field

class DeadLetter(Document):
    """Stores information about background tasks that failed repeatedly."""
    task_name: str
    task_id: str
    args: list = []
    kwargs: dict = {}
    error_message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "dead_letters"
