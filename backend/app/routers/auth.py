from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.models.organizer import Organizer
from app.schemas.settings import OrganizerSettingsResponse, OrganizerSettingsUpdate

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class SyncRequest(BaseModel):
    firebase_uid: str
    email: str
    name: Optional[str] = ""

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
            organizer.name = body.name
        await organizer.save()
    else:
        # Create new
        organizer = Organizer(
            firebase_uid=body.firebase_uid,
            email=body.email,
            name=body.name or "",
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
