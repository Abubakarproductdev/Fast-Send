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
