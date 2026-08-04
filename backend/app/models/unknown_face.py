"""UnknownFace document model.

Stores faces that were not confidently matched to any known Attendee.
This allows guests to later claim themselves, and provides a basis for
clustering unrecognized faces (e.g., "Unknown Person A").
"""

from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class UnknownFace(Document):
    """An unrecognized face found in a media asset."""

    trip_id: PydanticObjectId
    asset_id: PydanticObjectId
    embedding: list[float]
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    class Settings:
        name = "unknown_faces"
        indexes = [
            IndexModel([("trip_id", 1)]),
            IndexModel([("asset_id", 1)]),
        ]
