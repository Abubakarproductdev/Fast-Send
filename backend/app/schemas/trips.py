"""Pydantic schemas for trip and attendee endpoints.

These are HTTP-layer data transfer objects — they define what the API
accepts and returns.  They are intentionally separate from the Beanie
Document models in ``app.models`` so that internal storage details
(embedded matches, indexes, etc.) never leak into the public API contract.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.attendee import GalleryPreference


# ── Trip ──────────────────────────────────────────────────────────────


class TripCreate(BaseModel):
    """Body of ``POST /api/v1/trips``."""

    organizer_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        examples=["Abubakar"],
    )


class TripResponse(BaseModel):
    """Standard trip representation returned by most endpoints."""

    id: str
    organizer_name: str
    invite_code: str
    is_active: bool
    created_at: datetime
    registration_url: str


class TripDetail(TripResponse):
    """Extended trip info including aggregate counts.

    Used by the organizer dashboard to show how many attendees have
    registered and how many photos have been uploaded.
    """

    attendee_count: int
    media_count: int


# ── Attendee ──────────────────────────────────────────────────────────


class AttendeeRegister(BaseModel):
    """Form fields for ``POST /api/v1/trips/{trip_id}/register``.

    The selfie image is sent as a separate ``UploadFile`` part in the
    multipart request and is not part of this JSON schema.  It will be
    wired in during Phase 2 (ML engine).
    """

    phone_number: str = Field(
        ...,
        min_length=7,
        max_length=20,
        examples=["+923001234567"],
    )
    name: str | None = Field(
        default=None,
        max_length=100,
        examples=["Ahmed"],
    )
    gallery_preference: GalleryPreference = GalleryPreference.MINE_ONLY


class AttendeeResponse(BaseModel):
    """Attendee data returned after successful registration."""

    id: str
    trip_id: str
    phone_number: str
    name: str | None
    gallery_preference: GalleryPreference
    gallery_url: str
    created_at: datetime
