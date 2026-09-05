"""Business logic for trip and attendee operations.

Every function in this module is a plain ``async`` coroutine that operates
on Beanie documents directly.  There are no HTTP objects, no request
parsing, and no response formatting — those concerns stay in the router
layer.

Raising ``TripNotFoundError`` or ``TripInactiveError`` is the service's
way of signalling a problem; the router decides which HTTP status code
that maps to.
"""

import asyncio
import secrets
from datetime import datetime, timezone

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from app.models.attendee import Attendee, GalleryPreference
from app.models.media_asset import MediaAsset
from app.models.trip import Trip, TripSettings
from app.models.guest_token import GuestToken
from app.models.notification import Notification
from app.models.trip_insights import TripInsights
from app.services.storage_service import azure_blob_service, StorageError


# ── Exceptions ────────────────────────────────────────────────────────


class TripNotFoundError(Exception):
    """Raised when a trip lookup returns no result."""


class TripInactiveError(Exception):
    """Raised when an operation requires an active trip but it has ended."""


class TripAlreadyActiveError(Exception):
    """Raised when an organizer tries to relive an already-live trip."""


class ActiveTripExistsError(Exception):
    """Raised when an organizer tries to create a trip but already has a live one."""


class TripOwnershipError(Exception):
    """Raised when an action targets another organizer's trip."""


# ── Trip operations ───────────────────────────────────────────────────


async def create_trip(
    organizer_id: PydanticObjectId,
    name: str = "Untitled trip",
    settings: TripSettings | None = None,
) -> Trip:
    """Create a new trip with a unique invite code.

    ``secrets.token_hex`` produces a clean uppercase hex string (only 0-9 A-F).
    This is safe in URLs, easy to read aloud, and renders cleanly in the QR code
    display. On the rare collision (caught by the unique index on ``invite_code``),
    we regenerate and retry up to three times.
    """
    # Restrict to only 1 active trip per organizer
    active_count = await Trip.find(
        Trip.organizer_id == organizer_id,
        Trip.is_active == True
    ).count()
    
    if active_count > 0:
        raise ActiveTripExistsError("You already have an active trip. Please end it before creating a new one.")

    max_retries = 3

    for attempt in range(max_retries):
        # token_hex(4) → 8-character hex string (e.g. "3a8f2b1c") → uppercase it
        invite_code = secrets.token_hex(4).upper()
        trip = Trip(
            organizer_id=organizer_id,
            name=name.strip() or "Untitled trip",
            invite_code=invite_code,
            settings=settings or TripSettings(),
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


async def get_trips_by_organizer(organizer_id: PydanticObjectId, limit: int = 6, skip: int = 0, search: str | None = None) -> list[Trip]:
    """Fetch trips created by a specific organizer, sorted newest first, with optional pagination and search."""
    query = Trip.find(Trip.organizer_id == organizer_id)
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query = query.find({"$or": [{"name": search_regex}, {"invite_code": search_regex}]})
    return await query.sort("-created_at").skip(skip).limit(limit).to_list()


async def end_trip(trip_id: PydanticObjectId) -> Trip:
    """Mark a trip as inactive.

    Idempotent — ending an already-ended trip is a harmless no-op.
    """
    trip = await get_trip(trip_id)
    trip.is_active = False
    trip.updated_at = datetime.now(timezone.utc)
    await trip.save()
    return trip


async def update_trip_settings(
    trip_id: PydanticObjectId,
    organizer_id: PydanticObjectId,
    patch: dict,
) -> Trip:
    """Update organizer-controlled guest privacy settings for one trip."""
    trip = await get_trip(trip_id)
    if trip.organizer_id != organizer_id:
        raise TripOwnershipError(f"Organizer does not own trip {trip_id}")

    for key, value in patch.items():
        if hasattr(trip.settings, key):
            setattr(trip.settings, key, value)

    # Preserve compatibility with the older boolean field.
    if "download_permission" in patch:
        trip.settings.allow_guest_download_all = patch["download_permission"] == "all"

    trip.updated_at = datetime.now(timezone.utc)
    await trip.save()
    return trip


async def relive_trip(trip_id: PydanticObjectId, organizer_id: PydanticObjectId) -> Trip:
    """Reopen an archived trip while preserving its guests and existing media."""
    trip = await get_trip(trip_id)
    if trip.organizer_id != organizer_id:
        raise TripOwnershipError(f"Organizer does not own trip {trip_id}")
    if trip.is_active:
        raise TripAlreadyActiveError(f"Trip {trip_id} is already active")

    now = datetime.now(timezone.utc)
    trip.is_active = True
    trip.last_reminder_at = now
    trip.relive_count += 1
    trip.updated_at = now
    await trip.save()
    return trip


async def delete_trip(trip_id: PydanticObjectId, organizer_id: PydanticObjectId) -> None:
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
    if trip.organizer_id != organizer_id:
        raise TripOwnershipError(f"Organizer does not own trip {trip_id}")

    # Freeze the trip before touching cloud data. A failed deletion can then
    # be retried safely without accepting new uploads during the retry window.
    trip.is_active = False
    trip.updated_at = datetime.now(timezone.utc)
    await trip.save()

    assets = await MediaAsset.find(MediaAsset.trip_id == trip.id).to_list()
    attendees = await Attendee.find(Attendee.trip_id == trip.id).to_list()
    expected_prefix = f"trip_{trip.id}/"
    selfie_prefix = f"selfies/{trip.id}/"
    blob_urls = {
        url
        for asset in assets
        for url in (asset.original_blob_url, asset.thumbnail_blob_url)
        if url
    }
    blob_urls.update(
        attendee.selfie_s3_url
        for attendee in attendees
        if attendee.selfie_s3_url
    )

    # Cloud deletion is deliberately completed before Mongo deletion. If any
    # Azure call fails, the parent and children remain for a safe retry.
    for blob_url in blob_urls:
        await asyncio.to_thread(
            azure_blob_service.delete_file,
            blob_url,
            (expected_prefix, selfie_prefix),
        )

    await GuestToken.find(GuestToken.trip_id == trip.id).delete()
    await Attendee.find(Attendee.trip_id == trip.id).delete()
    await MediaAsset.find(MediaAsset.trip_id == trip.id).delete()
    await TripInsights.find(TripInsights.trip_id == trip.id).delete()
    await Notification.find(Notification.trip_id == str(trip.id)).delete()
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


# ── MediaAsset operations ─────────────────────────────────────────────

import os
import uuid
import logging
import mimetypes
from app.models.media_asset import AssetStatus, EmbeddedMatch
from app.ml import FaceEngine, FaceProcessingError
logger = logging.getLogger(__name__)

async def upload_media(
    trip_id: PydanticObjectId,
    image_data: bytes,
    media_type: str,
    content_type: str,
    device_local_id: str | None = None,
    batch_id: str | None = None,
) -> MediaAsset:
    """Upload the original image to Azure Blob Storage and create a MediaAsset document."""
    trip = await get_trip(trip_id)

    if not trip.is_active:
        raise TripInactiveError(f"Trip {trip_id} has ended — cannot upload media")

    # Upload to Azure
    container_name = azure_blob_service.settings.azure_container_originals
    ext = mimetypes.guess_extension(content_type) or ".jpg"
    filename = f"trip_{trip_id}/{uuid.uuid4().hex}{ext}"
    
    try:
        # Run the synchronous Azure SDK call in a thread pool to avoid blocking the event loop
        blob_url = await asyncio.to_thread(
            azure_blob_service.upload_file,
            image_data, container_name, filename, content_type
        )
    except StorageError as e:
        logger.error(f"Failed to upload media to Azure: {e}")
        raise  # Re-raise StorageError so the global storage_error_handler returns a proper 503
        
    asset = MediaAsset(
        trip_id=trip.id,
        original_blob_url=blob_url,
        media_type=media_type,
        device_local_id=device_local_id,
        batch_id=batch_id,
        status=AssetStatus.PROCESSING,
    )
    
    try:
        await asset.insert()
    except DuplicateKeyError:
        # Idempotency constraint triggered
        # Return the existing asset instead of raising
        existing = await MediaAsset.find_one(
            MediaAsset.trip_id == trip_id,
            MediaAsset.device_local_id == device_local_id
        )
        if existing:
            return existing
        raise
        
    return asset


async def process_media_asset(
    asset_id: PydanticObjectId, 
    trip_id: PydanticObjectId,
    face_engine: FaceEngine,
) -> None:
    """Background task to extract faces and compute matches against attendees."""
    try:
        asset = await MediaAsset.get(asset_id)
        if not asset or not asset.original_blob_url:
            logger.error(f"Asset {asset_id} not found or missing original URL")
            return
            
        # Download the file bytes from Azure (run sync SDK in thread pool)
        try:
            image_data = await asyncio.to_thread(
                azure_blob_service.download_file, asset.original_blob_url
            )
        except StorageError as e:
            logger.error(f"Failed to download asset {asset_id} from Azure: {e}")
            asset.status = AssetStatus.FAILED
            await asset.save()
            return
            
        # Extract all faces
        try:
            face_data = face_engine.extract_multiple_embeddings(image_data)
        except FaceProcessingError as e:
            logger.error(f"Failed to process faces for asset {asset_id}: {e}")
            asset.status = AssetStatus.FAILED
            await asset.save()
            return

        raw_face_count = int(face_data.get("face_count", len(face_data["faces"])))
        asset.detected_face_count = raw_face_count
        asset.is_nature = raw_face_count == 0

        if raw_face_count == 0:
            # Valid image, just no faces (e.g. landscape)
            asset.is_nature = True
            asset.status = AssetStatus.PROCESSED
            await asset.save()
            return
            
        # Match against attendees
        attendees = await get_trip_attendees(trip_id)
        matches = []
        detected_faces = []
        
        # Base threshold based on image brightness
        brightness = face_data.get("brightness", 128.0)
        base_threshold = 0.45
        if brightness < 60: # Very dark, faces might be less clear
            base_threshold = 0.38
        elif brightness > 200: # Overexposed
            base_threshold = 0.40
            
        for face_info in face_data["faces"]:
            face_emb = face_info["embedding"]
            det_score = face_info["det_score"]
            detected_faces.append(face_emb)
            
            # Fine-tune threshold per face based on detection confidence
            match_threshold = base_threshold - (0.05 if det_score < 0.7 else 0.0)

            for attendee in attendees:
                if not attendee.selfie_embedding:
                    continue
                    
                score = FaceEngine.compute_similarity(face_emb, attendee.selfie_embedding)
                if score >= match_threshold:
                    matches.append(EmbeddedMatch(
                        attendee_id=attendee.id,
                        confidence=score,
                    ))
                    
        asset.matches = matches
        asset.detected_faces = detected_faces

        # ── Generate thumbnail ────────────────────────────────────────
        # We already have image_data in memory from the ML download step.
        # Generate a compressed 800px version for fast gallery display.
        # This runs AFTER ML so the original full-resolution is always
        # what InsightFace sees. A failure here is non-fatal: the gallery
        # will fall back to the original URL so guests still see their photos.
        try:
            from urllib.parse import urlparse
            parsed = urlparse(asset.original_blob_url)
            # Extract just the blob name (everything after the container segment)
            path_parts = parsed.path.lstrip("/").split("/", 1)
            original_blob_name = path_parts[1] if len(path_parts) > 1 else parsed.path.lstrip("/")

            thumb_url = await asyncio.to_thread(
                azure_blob_service.generate_and_upload_thumbnail,
                image_data,
                original_blob_name,
            )
            asset.thumbnail_blob_url = thumb_url
        except Exception as thumb_err:
            logger.warning(
                f"Thumbnail generation failed for asset {asset_id} (non-fatal): {thumb_err}"
            )
            # thumbnail_blob_url remains None; the API will fall back to original

        asset.status = AssetStatus.PROCESSED
        asset.updated_at = datetime.now(timezone.utc)
        await asset.save()
        
    except Exception as e:
        logger.exception(f"Unexpected error processing asset {asset_id}: {e}")
        # Try to mark as failed if possible
        asset = await MediaAsset.get(asset_id)
        if asset:
            asset.status = AssetStatus.FAILED
            await asset.save()
        raise
