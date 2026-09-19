"""Pydantic schemas for MausamSetu API."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict

from app.models.models import AdvisoryStatus, ApprovalAction, Language


# ---------------------------------------------------------------------------
# Panchayat
# ---------------------------------------------------------------------------


class PanchayatBase(BaseModel):
    name: str
    block: str
    district: str = "Nagpur"
    state: str = "Maharashtra"
    lat: float
    lng: float
    elevation_m: Optional[float] = None


class PanchayatCreate(PanchayatBase):
    pass


class PanchayatOut(PanchayatBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Weather
# ---------------------------------------------------------------------------


class WeatherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    panchayat_id: int
    observed_at: datetime
    temperature_max: Optional[float] = None
    temperature_min: Optional[float] = None
    rainfall_mm: Optional[float] = None
    humidity_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    cloud_cover_pct: Optional[float] = None
    source: str
    confidence_score: float
    predicted_rainfall_mm: Optional[float] = None
    baseline_rainfall_mm: Optional[float] = None
    expected_error_margin_mm: Optional[float] = None
    prediction_interval_lower_mm: Optional[float] = None
    prediction_interval_upper_mm: Optional[float] = None
    model_reliability: Optional[str] = "HIGH"
    provenance_stage: Optional[str] = "AI_DOWNSCALED"
    source_name: Optional[str] = "IMD_API_AGROMET"


class WeatherSummary(BaseModel):
    """Simplified weather card for farmer-facing views with empirical reliability."""
    panchayat_id: int
    panchayat_name: str
    date: str
    temperature_max: Optional[float] = None
    temperature_min: Optional[float] = None
    rainfall_mm: Optional[float] = None
    humidity_pct: Optional[float] = None
    condition: str  # "sunny" | "cloudy" | "rainy" | "partly_cloudy"
    confidence_score: float
    predicted_rainfall_mm: Optional[float] = None
    baseline_rainfall_mm: Optional[float] = None
    expected_error_margin_mm: Optional[float] = None
    prediction_interval_lower_mm: Optional[float] = None
    prediction_interval_upper_mm: Optional[float] = None
    model_reliability: Optional[str] = "HIGH"
    provenance_stage: Optional[str] = "AI_DOWNSCALED"
    source_name: Optional[str] = "IMD_API_AGROMET"


# ---------------------------------------------------------------------------
# Advisory
# ---------------------------------------------------------------------------


class AdvisoryGenerateRequest(BaseModel):
    panchayat_id: int
    crop: str
    advisory_date: Optional[datetime] = None


class AdvisoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    panchayat_id: int
    crop: str
    advisory_date: datetime
    content_en: str
    content_hi: str
    content_mr: Optional[str] = None
    confidence_score: float
    ml_explanation: Optional[dict[str, Any]] = None
    weather_snapshot: Optional[dict[str, Any]] = None
    is_imd_fallback: bool
    status: AdvisoryStatus
    officer_note: Optional[str] = None
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    panchayat_name: Optional[str] = None


class AdvisoryListItem(BaseModel):
    """Slim advisory card for queue listing."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    panchayat_id: int
    panchayat_name: Optional[str] = None
    crop: str
    advisory_date: datetime
    status: AdvisoryStatus
    confidence_score: float
    is_imd_fallback: bool
    created_at: datetime


class AdvisoryApproveRequest(BaseModel):
    action: ApprovalAction
    note: Optional[str] = None
    modified_content_hi: Optional[str] = None
    modified_content_en: Optional[str] = None
    modified_content_mr: Optional[str] = None


# ---------------------------------------------------------------------------
# Officer
# ---------------------------------------------------------------------------


class OfficerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    phone: str
    block: str
    district: str
    is_active: bool


class OfficerLoginRequest(BaseModel):
    phone: str


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer: OfficerOut


# ---------------------------------------------------------------------------
# Farmer
# ---------------------------------------------------------------------------


class FarmerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    panchayat_id: int
    name: str
    phone: str
    preferred_language: Language
    crops: list[str]
    land_area_acres: Optional[float] = None


# ---------------------------------------------------------------------------
# Chatbot
# ---------------------------------------------------------------------------


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str
    timestamp: datetime


class ChatbotRequest(BaseModel):
    message: str
    language: Language = Language.hi
    panchayat_id: Optional[int] = None
    farmer_id: Optional[int] = None
    session_id: Optional[int] = None


class ChatbotResponse(BaseModel):
    session_id: int
    reply: str
    language: Language
    source: str  # "advisory" | "weather" | "fallback"


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------


class MessageResponse(BaseModel):
    message: str


class StatsResponse(BaseModel):
    total_panchayats: int
    total_farmers: int
    pending_advisories: int
    approved_today: int
    sent_today: int
