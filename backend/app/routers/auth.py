from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Optional

from app.models.organizer import Organizer

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
