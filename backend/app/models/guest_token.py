import secrets
from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class GuestToken(Document):
    attendee_id: PydanticObjectId
    trip_id: PydanticObjectId
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime

    class Settings:
        name = "guest_tokens"
        indexes = [
            IndexModel([("token", 1)], unique=True),
            IndexModel([("attendee_id", 1)])
        ]
