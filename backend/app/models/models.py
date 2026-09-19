"""SQLAlchemy ORM models for MausamSetu."""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class AdvisoryStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    sent = "sent"


class ApprovalAction(str, enum.Enum):
    approved = "approved"
    modified = "modified"
    rejected = "rejected"


class Language(str, enum.Enum):
    hi = "hi"   # Hindi
    mr = "mr"   # Marathi
    en = "en"   # English


class WeatherSource(str, enum.Enum):
    openmeteo = "openmeteo"
    imd = "imd"
    mock = "mock"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class Panchayat(Base):
    __tablename__ = "panchayats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    block = Column(String(200), nullable=False)
    district = Column(String(200), nullable=False, default="Nagpur")
    state = Column(String(100), nullable=False, default="Maharashtra")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    farmers = relationship("Farmer", back_populates="panchayat")
    advisories = relationship("Advisory", back_populates="panchayat")
    weather_observations = relationship("WeatherObservation", back_populates="panchayat")


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    block = Column(String(200), nullable=False)
    district = Column(String(200), nullable=False, default="Nagpur")
    is_active = Column(Boolean, default=True)
    hashed_otp = Column(String(200), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    approvals = relationship("Approval", back_populates="officer")
    advisories_reviewed = relationship("Advisory", back_populates="officer")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    preferred_language = Column(Enum(Language), default=Language.hi, nullable=False)
    crops = Column(JSON, default=list)  # List of crop names: ["wheat", "cotton"]
    land_area_acres = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    panchayat = relationship("Panchayat", back_populates="farmers")
    chatbot_sessions = relationship("ChatbotSession", back_populates="farmer")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"), nullable=False, index=True)
    observed_at = Column(DateTime, nullable=False, index=True)
    temperature_max = Column(Float, nullable=True)   # °C
    temperature_min = Column(Float, nullable=True)   # °C
    rainfall_mm = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    cloud_cover_pct = Column(Float, nullable=True)
    source = Column(Enum(WeatherSource), default=WeatherSource.openmeteo)
    confidence_score = Column(Float, default=1.0)  # 0–1; lower if downscaled
    raw_block_data = Column(JSON, nullable=True)   # Source block-level data
    created_at = Column(DateTime, default=func.now())

    # Relationships
    panchayat = relationship("Panchayat", back_populates="weather_observations")


class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    crop = Column(String(100), nullable=False)
    advisory_date = Column(DateTime, nullable=False, index=True)

    # Multilingual advisory content
    content_en = Column(Text, nullable=False)
    content_hi = Column(Text, nullable=False)
    content_mr = Column(Text, nullable=True)

    # ML metadata
    confidence_score = Column(Float, nullable=False)   # 0–1
    ml_explanation = Column(JSON, nullable=True)        # Key features + values
    weather_snapshot = Column(JSON, nullable=True)      # Weather used for generation
    is_imd_fallback = Column(Boolean, default=False)    # True if ML was low confidence

    # Workflow state
    status = Column(Enum(AdvisoryStatus), default=AdvisoryStatus.draft, index=True)
    officer_note = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    panchayat = relationship("Panchayat", back_populates="advisories")
    officer = relationship("Officer", back_populates="advisories_reviewed")
    approvals = relationship("Approval", back_populates="advisory")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    advisory_id = Column(Integer, ForeignKey("advisories.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=False)
    action = Column(Enum(ApprovalAction), nullable=False)
    note = Column(Text, nullable=True)
    modified_content_hi = Column(Text, nullable=True)  # Officer's edited text
    modified_content_en = Column(Text, nullable=True)
    modified_content_mr = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    advisory = relationship("Advisory", back_populates="approvals")
    officer = relationship("Officer", back_populates="approvals")


class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"), nullable=True)
    language = Column(Enum(Language), default=Language.hi)
    messages = Column(JSON, default=list)  # [{role, content, timestamp}]
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    farmer = relationship("Farmer", back_populates="chatbot_sessions")
