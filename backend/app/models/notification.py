from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field
from pydantic.types import UUID4

class Notification(Document):
    """A notification shown to the user in the frontend Notification Tab."""
    
    trip_id: Optional[str] = None
    organizer_id: Optional[str] = None
    type: Optional[str] = None
    title: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "notifications"
