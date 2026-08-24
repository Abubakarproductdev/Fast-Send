"""Organizer document model.

An Organizer is a user who registers in the mobile app via Firebase Auth.
They can create Trips. We sync their basic info here so we have a relational
anchor in MongoDB for their trips.
"""

from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from typing import Literal
from pymongo import IndexModel


class Organizer(Document):
    """A registered event organizer."""

    firebase_uid: str
    email: str
    name: str
    sync_interval_hours: int = Field(default=2, ge=1, le=24)
    upload_mode: Literal['wifi_only', 'wifi_and_cellular'] = 'wifi_only'
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    class Settings:
        name = "organizers"
        indexes = [
            IndexModel([("firebase_uid", 1)], unique=True),
            IndexModel([("email", 1)], unique=True),
        ]
