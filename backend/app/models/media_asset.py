"""MediaAsset document model with embedded match results.

The three-URL design reflects the upload pipeline described in the
architecture plan:

* ``proxy_s3_url``   — low-res proxy uploaded instantly over cellular
* ``high_res_s3_url`` — original HEIC/MOV uploaded over Wi-Fi later
* ``high_res_web_url`` — browser-safe JPEG/WebP derivative of the original

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
    proxy_s3_url: str | None = None
    high_res_s3_url: str | None = None
    high_res_web_url: str | None = None
    media_type: str  # "image" or "video"
    is_nature: bool = False
    status: AssetStatus = AssetStatus.PENDING_PROXY
    device_local_id: str | None = None
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
                partialFilterExpression={"device_local_id": {"$ne": None}},
            ),

            # Multikey index — Mongo indexes every element in the array,
            # so "find all assets where attendee X was matched" is fast.
            IndexModel([("matches.attendee_id", 1)]),
        ]
