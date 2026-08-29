"""MediaAsset document model with embedded match results.

The architecture plan defines a unified storage approach:
* ``original_blob_url`` — high-res original uploaded directly over Wi-Fi/Cellular

Face-match results are **embedded** as an array of ``EmbeddedMatch``
sub-documents rather than stored in a separate collection.  This fits
Mongo's strengths: the matching worker processes one asset at a time and
writes all matches together; gallery generation reads "all assets where
a given attendee was matched."  Both access patterns align with embedded
arrays, not cross-collection lookups.
"""

from datetime import datetime, timezone
from enum import StrEnum

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class AssetStatus(StrEnum):
    """Processing lifecycle of a media asset.

    Replaces the ``processed: bool`` from the original SQL schema.
    A single boolean cannot represent "failed," "awaiting high-res,"
    "derivative failed," etc.
    """

    PENDING_PROXY = "pending_proxy"
    PROXY_UPLOADED = "proxy_uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
    DERIVATIVE_FAILED = "derivative_failed"


class EmbeddedMatch(BaseModel):
    """A single face-match result, embedded inside the parent MediaAsset.

    This is a plain Pydantic model, *not* a Beanie Document — it lives as
    a sub-document in the ``matches`` array and has no ``_id`` or
    collection of its own.
    """

    attendee_id: PydanticObjectId
    confidence: float


class MediaAsset(Document):
    """A photo or video uploaded during a trip."""

    trip_id: PydanticObjectId
    original_blob_url: str | None = None
    thumbnail_blob_url: str | None = None  # 800px compressed version for gallery display
    media_type: str  # "image" or "video"
    file_size_bytes: int | None = None
    is_nature: bool = False
    status: AssetStatus = AssetStatus.PENDING_PROXY
    detected_faces: list[list[float]] = []
    # Number of faces detected before confidence filtering. This is separate
    # from detected_faces because the latter stores only usable embeddings.
    detected_face_count: int = 0
    device_local_id: str | None = None
    batch_id: str | None = None
    matches: list[EmbeddedMatch] = Field(default_factory=list)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    class Settings:
        name = "media_assets"
        indexes = [
            # "Get all assets for this trip" — the most common query.
            IndexModel([("trip_id", 1)]),

            # Idempotent uploads: same (trip, device_local_id) pair is a
            # no-op.  The partial filter allows multiple documents to have
            # device_local_id = None (uploads not from a mobile device).
            IndexModel(
                [("trip_id", 1), ("device_local_id", 1)],
                unique=True,
                partialFilterExpression={"device_local_id": {"$type": "string"}},
            ),

            # Multikey index — Mongo indexes every element in the array,
            # so "find all assets where attendee X was matched" is fast.
            IndexModel([("matches.attendee_id", 1)]),

            # Compound index for fast timestamp queries by trip (e.g. for reminders)
            IndexModel([("trip_id", 1), ("created_at", -1)]),
        ]


def get_detected_face_count(asset: MediaAsset) -> int:
    """Return the raw detected-face count, with compatibility for old assets."""
    count = getattr(asset, "detected_face_count", 0) or 0
    return count if count > 0 else len(asset.detected_faces)
