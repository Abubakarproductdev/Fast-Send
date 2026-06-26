import uuid
from sqlalchemy import Column, String, Boolean, Float, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base
class Trip(Base):
    __tablename__ = "trips"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_name = Column(String, nullable=False)

class Attendee(Base):
    __tablename__ = "attendees"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String, nullable=False)
    selfie_embedding = Column(String, nullable=False) # Storing 512-D vector as stringified JSON

class MediaAsset(Base):
    __tablename__ = "media_assets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    storage_url = Column(String, nullable=False)
    media_type = Column(String, nullable=False) # "image" or "video"
    processed = Column(Boolean, default=False)

class Match(Base):
    __tablename__ = "matches"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    media_asset_id = Column(UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False)
    attendee_id = Column(UUID(as_uuid=True), ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False)
    confidence = Column(Float, nullable=False)