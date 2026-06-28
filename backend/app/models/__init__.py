"""Beanie document models.

Import all Document subclasses here so they can be passed to
``beanie.init_beanie()`` as a single list.  This is the only place
that needs updating when a new collection is added.
"""

from app.models.attendee import Attendee, GalleryPreference
from app.models.media_asset import AssetStatus, EmbeddedMatch, MediaAsset
from app.models.trip import Trip

# Every Document subclass that Beanie needs to initialize.
ALL_MODELS = [Trip, Attendee, MediaAsset]

__all__ = [
    "ALL_MODELS",
    "AssetStatus",
    "Attendee",
    "EmbeddedMatch",
    "GalleryPreference",
    "MediaAsset",
    "Trip",
]
