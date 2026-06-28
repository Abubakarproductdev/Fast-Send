"""Attendee document model.

An Attendee is a guest who has scanned the QR code, submitted their phone
number and (optionally) a selfie.  The selfie is processed by the ML engine
(Phase 2) into a 512-D face embedding that drives per-person gallery
generation.

``GalleryPreference`` controls what the attendee sees in their personal
gallery once the trip ends.
"""

from datetime import datetime, timezone
from enum import StrEnum

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class GalleryPreference(StrEnum):
    """What subset of photos the attendee wants in their personal gallery."""

    MINE_ONLY = "mine_only"
    MINE_AND_NATURE = "mine_and_nature"
    ALL_PHOTOS = "all_photos"


class Attendee(Document):
    """A registered guest for a specific trip."""

    trip_id: PydanticObjectId
    phone_number: str
    name: str | None = None
    selfie_s3_url: str | None = None
    selfie_embedding: list[float] = Field(default_factory=list)
    gallery_preference: GalleryPreference = GalleryPreference.MINE_ONLY
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    class Settings:
        name = "attendees"
        indexes = [
            IndexModel([("trip_id", 1)]),
        ]
