"""HTTP endpoints for trip and attendee management.

This module is a thin adapter between the HTTP world (path parameters,
status codes, JSON bodies) and the service layer that contains the
actual business logic.  Route handlers should stay short — if one grows
past ~15 lines, the logic probably belongs in ``app.services``.

Route ordering note
-------------------
FastAPI matches routes top-to-bottom.  ``/join/{invite_code}`` is defined
**before** ``/{trip_id}`` so that the literal path segment ``join`` is
matched first; otherwise FastAPI would try to parse ``"join"`` as a
``PydanticObjectId`` and return a 422.
"""

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.models.attendee import Attendee
from app.models.media_asset import MediaAsset
from app.schemas.trips import (
    AttendeeRegister,
    AttendeeResponse,
    TripCreate,
    TripDetail,
    TripResponse,
)
from app.ml import FaceEngine, FaceProcessingError, get_face_engine
from app.services import trip_service

router = APIRouter(prefix="/api/v1/trips", tags=["Trips"])


# ── Helpers ───────────────────────────────────────────────────────────


def _trip_to_response(trip) -> TripResponse:
    """Map a Trip document to the public API representation."""
    return TripResponse(
        id=str(trip.id),
        organizer_name=trip.organizer_name,
        invite_code=trip.invite_code,
        is_active=trip.is_active,
        created_at=trip.created_at,
        registration_url=f"/api/v1/trips/join/{trip.invite_code}",
    )


def _attendee_to_response(attendee) -> AttendeeResponse:
    """Map an Attendee document to the public API representation."""
    return AttendeeResponse(
        id=str(attendee.id),
        trip_id=str(attendee.trip_id),
        phone_number=attendee.phone_number,
        name=attendee.name,
        gallery_preference=attendee.gallery_preference,
        gallery_url=f"/gallery/{attendee.id}",
        created_at=attendee.created_at,
    )


# ── Trip endpoints ────────────────────────────────────────────────────


@router.post(
    "",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new trip",
)
async def create_trip(body: TripCreate):
    """Create a trip and generate a unique invite code for QR sharing."""
    trip = await trip_service.create_trip(body.organizer_name)
    return _trip_to_response(trip)


@router.get(
    "/join/{invite_code}",
    response_model=TripResponse,
    summary="Look up trip by invite code",
)
async def join_trip(invite_code: str):
    """Resolve an invite code (from a QR scan) to trip details.

    This is the entry point for the attendee registration flow — scan
    the QR, land here, then ``POST .../register`` with a selfie.
    """
    try:
        trip = await trip_service.get_trip_by_invite_code(invite_code)
    except trip_service.TripNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No trip found with invite code '{invite_code}'",
        )
    return _trip_to_response(trip)


@router.get(
    "/{trip_id}",
    response_model=TripDetail,
    summary="Get trip details",
)
async def get_trip(trip_id: PydanticObjectId):
    """Fetch full trip details including attendee and media counts."""
    try:
        trip = await trip_service.get_trip(trip_id)
    except trip_service.TripNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found",
        )

    attendee_count = await Attendee.find(
        Attendee.trip_id == trip.id,
    ).count()
    media_count = await MediaAsset.find(
        MediaAsset.trip_id == trip.id,
    ).count()

    response = _trip_to_response(trip)
    return TripDetail(
        **response.model_dump(),
        attendee_count=attendee_count,
        media_count=media_count,
    )


@router.post(
    "/{trip_id}/end",
    response_model=TripResponse,
    summary="End a trip",
)
async def end_trip(trip_id: PydanticObjectId):
    """Mark a trip as inactive — stops uploads and registration."""
    try:
        trip = await trip_service.end_trip(trip_id)
    except trip_service.TripNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found",
        )
    return _trip_to_response(trip)


@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a trip and all its data",
)
async def delete_trip(trip_id: PydanticObjectId):
    """Cascade-delete a trip, its attendees, and all media assets."""
    try:
        await trip_service.delete_trip(trip_id)
    except trip_service.TripNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found",
        )


# ── Attendee endpoints ───────────────────────────────────────────────


@router.post(
    "/{trip_id}/register",
    response_model=AttendeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register an attendee for a trip",
)
async def register_attendee(
    trip_id: PydanticObjectId,
    phone_number: str = Form(...),
    name: str | None = Form(None),
    gallery_preference: AttendeeRegister.model_fields["gallery_preference"].annotation = Form(...),
    selfie: UploadFile = File(...),
    face_engine: FaceEngine = Depends(get_face_engine),
):
    """Register a guest with their phone number, selfie, and gallery preference.

    The selfie is processed via the FaceEngine to extract a 512-D embedding.
    """
    try:
        image_data = await selfie.read()
        embedding = face_engine.extract_embedding(image_data)
        
        attendee = await trip_service.register_attendee(
            trip_id=trip_id,
            phone_number=phone_number,
            name=name,
            gallery_preference=gallery_preference,
            selfie_embedding=embedding,
        )
    except FaceProcessingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except trip_service.TripNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found",
        )
    except trip_service.TripInactiveError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This trip has ended — registration is closed",
        )
    return _attendee_to_response(attendee)


@router.get(
    "/{trip_id}/attendees",
    response_model=list[AttendeeResponse],
    summary="List all attendees for a trip",
)
async def list_attendees(trip_id: PydanticObjectId):
    """Return every registered attendee for the given trip."""
    try:
        attendees = await trip_service.get_trip_attendees(trip_id)
    except trip_service.TripNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found",
        )
    return [_attendee_to_response(a) for a in attendees]
