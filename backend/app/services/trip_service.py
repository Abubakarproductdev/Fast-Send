"""Business logic for trip and attendee operations.

Every function in this module is a plain ``async`` coroutine that operates
on Beanie documents directly.  There are no HTTP objects, no request
parsing, and no response formatting — those concerns stay in the router
layer.

Raising ``TripNotFoundError`` or ``TripInactiveError`` is the service's
way of signalling a problem; the router decides which HTTP status code
that maps to.
"""

import secrets
from datetime import datetime, timezone

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from app.config import get_settings
from app.models.attendee import Attendee, GalleryPreference
from app.models.media_asset import MediaAsset
from app.models.trip import Trip


# ── Exceptions ────────────────────────────────────────────────────────


class TripNotFoundError(Exception):
    """Raised when a trip lookup returns no result."""


class TripInactiveError(Exception):
    """Raised when an operation requires an active trip but it has ended."""


# ── Trip operations ───────────────────────────────────────────────────


async def create_trip(organizer_name: str) -> Trip:
    """Create a new trip with a unique invite code.

    ``secrets.token_urlsafe`` produces a URL-safe base-64 string.  On the
    rare collision (caught by the unique index on ``invite_code``), we
    regenerate and retry up to three times.  The probability of even a
    single collision is negligible at any realistic scale, but the retry
    makes the function correct under all circumstances.
    """
    settings = get_settings()
    max_retries = 3

    for attempt in range(max_retries):
        invite_code = secrets.token_urlsafe(settings.invite_code_length)
        trip = Trip(
            organizer_name=organizer_name,
            invite_code=invite_code,
        )
        try:
            await trip.insert()
            return trip
        except DuplicateKeyError:
            if attempt == max_retries - 1:
                raise

    # Unreachable — the loop always returns or raises — but keeps the
    # type-checker happy.
    raise RuntimeError("Failed to generate a unique invite code")


async def get_trip(trip_id: PydanticObjectId) -> Trip:
    """Fetch a single trip by ``_id``, or raise ``TripNotFoundError``."""
    trip = await Trip.get(trip_id)
    if trip is None:
        raise TripNotFoundError(f"Trip {trip_id} not found")
    return trip


async def get_trip_by_invite_code(invite_code: str) -> Trip:
    """Fetch a trip by its invite code, or raise ``TripNotFoundError``.

    This is the entry point for the QR-scan → registration flow.
    """
    trip = await Trip.find_one(Trip.invite_code == invite_code)
    if trip is None:
        raise TripNotFoundError(f"No trip with invite code '{invite_code}'")
    return trip


async def end_trip(trip_id: PydanticObjectId) -> Trip:
    """Mark a trip as inactive.

    Idempotent — ending an already-ended trip is a harmless no-op.
    """
    trip = await get_trip(trip_id)
    trip.is_active = False
    trip.updated_at = datetime.now(timezone.utc)
    await trip.save()
    return trip


async def delete_trip(trip_id: PydanticObjectId) -> None:
    """Delete a trip and cascade-remove all related documents.

    MongoDB has no foreign keys, so cascade is manual.  Children are
    deleted **before** the parent so a crash mid-way never leaves a
    parent pointing at non-existent children.  The reverse (orphaned
    children with no parent) is the less dangerous failure mode and
    trivially cleaned up by a periodic sweep.

    No transaction is used — a bare ``mongod`` container (the likely
    local-dev setup) doesn't support them without replica-set config,
    and sequential deletes with no concurrent writers are safe for V1.
    """
    trip = await get_trip(trip_id)
    await Attendee.find(Attendee.trip_id == trip.id).delete()
    await MediaAsset.find(MediaAsset.trip_id == trip.id).delete()
    await trip.delete()


# ── Attendee operations ──────────────────────────────────────────────


async def register_attendee(
    trip_id: PydanticObjectId,
    phone_number: str,
    gallery_preference: GalleryPreference,
    selfie_embedding: list[float],
    name: str | None = None,
) -> Attendee:
    """Register a new attendee for a trip.

    Validates that the trip exists and is still active.
    """
    trip = await get_trip(trip_id)

    if not trip.is_active:
        raise TripInactiveError(
            f"Trip {trip_id} has ended — registration is closed"
        )

    attendee = Attendee(
        trip_id=trip.id,
        phone_number=phone_number,
        name=name,
        selfie_embedding=selfie_embedding,
        gallery_preference=gallery_preference,
    )
    await attendee.insert()
    return attendee


async def get_trip_attendees(trip_id: PydanticObjectId) -> list[Attendee]:
    """Return all attendees registered for a given trip.

    Validates that the trip exists first, so the caller gets a clear
    ``TripNotFoundError`` rather than an empty list for a bad ID.
    """
    await get_trip(trip_id)
    return await Attendee.find(Attendee.trip_id == trip_id).to_list()
