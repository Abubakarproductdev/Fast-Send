from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pymongo import IndexModel

class TripInsights(Document):
    trip_id: PydanticObjectId
    total_photos: int = 0
    total_size_bytes: int = 0
    unique_people_count: int = 0
    portrait_count: int = 0  # 1 face
    group_count: int = 0     # 2+ faces
    nature_count: int = 0    # 0 faces
    peak_hour: int | None = None  # 0-23
    last_updated: datetime

    class Settings:
        name = "trip_insights"
        indexes = [IndexModel([("trip_id", 1)], unique=True)]
