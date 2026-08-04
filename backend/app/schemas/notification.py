from datetime import datetime
from pydantic import BaseModel, Field

class NotificationResponse(BaseModel):
    id: str
    trip_id: str | None = None
    type: str | None = None
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
