from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.models.organizer import Organizer
from app.schemas.settings import (
    OrganizerProfileResponse,
    OrganizerProfileUpdate,
    OrganizerSettingsResponse,
    OrganizerSettingsUpdate,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class SyncRequest(BaseModel):
    firebase_uid: str
    email: str
    name: Optional[str] = ""
    photo_url: Optional[str] = None

class SyncResponse(BaseModel):
    organizer_id: str
    message: str

@router.post(
    "/sync",
    response_model=SyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync Firebase user to MongoDB Organizer",
)
async def sync_organizer(body: SyncRequest):
    """
    Accepts a Firebase UID and basic profile info from the frontend.
    Creates an Organizer document if it doesn't exist, or updates it if it does.
    Returns the MongoDB _id to the frontend.
    """
    organizer = await Organizer.find_one(Organizer.firebase_uid == body.firebase_uid)
    
    if organizer:
        # Update existing
        organizer.email = body.email
        if body.name:
            organizer.name = body.name.strip()
        if body.photo_url is not None:
            organizer.photo_url = body.photo_url
        await organizer.save()
    else:
        # Create new
        organizer = Organizer(
            firebase_uid=body.firebase_uid,
            email=body.email,
            name=(body.name or "").strip(),
            photo_url=body.photo_url,
        )
        await organizer.insert()

    return SyncResponse(
        organizer_id=str(organizer.id),
        message="Sync successful"
    )


def _settings_response(organizer: Organizer) -> OrganizerSettingsResponse:
    return OrganizerSettingsResponse(
        organizer_id=str(organizer.id),
        sync_interval_hours=organizer.sync_interval_hours,
        upload_mode=organizer.upload_mode,
    )


def _profile_response(organizer: Organizer) -> OrganizerProfileResponse:
    return OrganizerProfileResponse(
        organizer_id=str(organizer.id),
        firebase_uid=organizer.firebase_uid,
        email=organizer.email,
        name=organizer.name,
        photo_url=organizer.photo_url,
        created_at=organizer.created_at,
        updated_at=organizer.updated_at,
    )


@router.get('/profile/{organizer_id}', response_model=OrganizerProfileResponse)
async def get_organizer_profile(organizer_id: PydanticObjectId):
    organizer = await Organizer.get(organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail='Organizer not found')
    return _profile_response(organizer)


@router.patch('/profile/{organizer_id}', response_model=OrganizerProfileResponse)
async def update_organizer_profile(
    organizer_id: PydanticObjectId,
    body: OrganizerProfileUpdate,
):
    organizer = await Organizer.get(organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail='Organizer not found')

    organizer.name = body.name.strip()
    if not organizer.name:
        raise HTTPException(status_code=422, detail='Display name cannot be empty')
    if body.photo_url is not None:
        organizer.photo_url = body.photo_url
    organizer.updated_at = datetime.now(timezone.utc)
    await organizer.save()
    return _profile_response(organizer)


@router.get('/settings/{organizer_id}', response_model=OrganizerSettingsResponse)
async def get_organizer_settings(organizer_id: PydanticObjectId):
    organizer = await Organizer.get(organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail='Organizer not found')
    return _settings_response(organizer)


@router.patch('/settings/{organizer_id}', response_model=OrganizerSettingsResponse)
async def update_organizer_settings(organizer_id: PydanticObjectId, body: OrganizerSettingsUpdate):
    organizer = await Organizer.get(organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail='Organizer not found')
    if body.sync_interval_hours is not None:
        organizer.sync_interval_hours = body.sync_interval_hours
    if body.upload_mode is not None:
        organizer.upload_mode = body.upload_mode
    organizer.updated_at = datetime.now(timezone.utc)
    await organizer.save()
    return _settings_response(organizer)
