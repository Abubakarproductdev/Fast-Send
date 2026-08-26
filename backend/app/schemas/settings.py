from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

UploadMode = Literal['wifi_only', 'wifi_and_cellular']


class OrganizerSettingsResponse(BaseModel):
    organizer_id: str
    sync_interval_hours: int
    upload_mode: UploadMode


class OrganizerSettingsUpdate(BaseModel):
    sync_interval_hours: int | None = Field(default=None, ge=1, le=24)
    upload_mode: UploadMode | None = None


class OrganizerProfileResponse(BaseModel):
    organizer_id: str
    firebase_uid: str
    email: str
    name: str
    photo_url: str | None
    created_at: datetime
    updated_at: datetime


class OrganizerProfileUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    photo_url: str | None = Field(default=None, max_length=2048)
