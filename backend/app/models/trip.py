"""Trip document model.

A Trip is the top-level entity — one trip per event.  The ``invite_code``
field is the short, URL-safe token embedded in QR codes and registration
links.  It carries a unique index so two trips can never share a code;
the service layer retries generation on the rare collision.
"""

from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class Trip(Document):
    """A trip/event created by an organizer."""

    organizer_name: str
    invite_code: str
    is_active: bool = True
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
        ]
