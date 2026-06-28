import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    ForeignKey,
    BigInteger,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_name = Column(String, nullable=False)

    # Without this, there's no QR code / registration link to generate.
    invite_code = Column(String, unique=True, nullable=False, index=True)

    # Drives "End Trip": stops reminder notifications, locks further uploads, etc.
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Attendee(Base):
    __tablename__ = "attendees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String, nullable=False)

    # JSON-serialized 512-D float list. No pgvector needed at this scale —
    # cosine similarity is computed in Python during matching.
    selfie_embedding = Column(String, nullable=False)

    # Start with one combined string for V1 ('mine_only' / 'mine_and_nature' / 'all_photos').
    # Split into gallery_scope + media_filter later if you add more option combinations.
    gallery_preference = Column(String, nullable=False, default="mine_only")

    # whatsapp_opted_in = Column(Boolean, default=False)  # add this when you build Phase 7 (Twilio)


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)

    # The one change that actually matters: three URLs, not one.
    # A single `storage_url` can't represent "proxy is uploaded, original is still
    # sitting on the phone waiting for Wi-Fi" — which is the whole point of the design.
    proxy_s3_url = Column(String, nullable=True)
    high_res_s3_url = Column(String, nullable=True)
    high_res_web_url = Column(String, nullable=True)  # browser-safe JPEG/WebP derivative of the HEIC original

    media_type = Column(String, nullable=False)  # 'image' or 'video'
    is_nature = Column(Boolean, default=False)   # needed for the 'mine_and_nature' option
    processed = Column(Boolean, default=False)   # fine as a simple boolean for V1

    # PHAsset.localIdentifier from the mobile app — lets a re-upload/retry be a no-op
    # instead of creating a duplicate row. Nullable is fine; Postgres allows multiple
    # NULLs under a unique constraint.
    device_local_id = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("trip_id", "device_local_id", name="uq_trip_device_asset"),
    )


class Match(Base):
    __tablename__ = "matches"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    media_asset_id = Column(UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False)
    attendee_id = Column(UUID(as_uuid=True), ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False)
    confidence = Column(Float, nullable=False)