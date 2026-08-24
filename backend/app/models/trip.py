"""Trip document model.

A Trip is the top-level entity — one trip per event.  The ``invite_code``
field is the short, URL-safe token embedded in QR codes and registration
links.  It carries a unique index so two trips can never share a code;
the service layer retries generation on the rare collision.
"""

from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class TripSettings(BaseModel):
    allow_guest_download_all: bool = False
    allow_nature_photos: bool = True
    require_selfie: bool = True
    gallery_locked: bool = False
    show_other_guests_faces: bool = True
    watermark_downloads: bool = False
    max_download_count: int | None = None
    album_expiry_days: int = 30

class Trip(Document):
    """A trip/event created by an organizer."""

    organizer_id: PydanticObjectId
    invite_code: str
    is_active: bool = True
    settings: TripSettings = Field(default_factory=TripSettings)
    last_reminder_at: datetime | None = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    class Settings:
        name = "trips"
        indexes = [
            IndexModel([("invite_code", 1)], unique=True),
            IndexModel([("organizer_id", 1)]),
        ]
