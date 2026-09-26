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
    forecast_issued_at: Optional[str] = "09:00 IST"
    data_updated_at: Optional[str] = "10:30 AM"
    valid_until: Optional[str] = "Tomorrow 09:00 IST"


# ---------------------------------------------------------------------------
# Advisory
# ---------------------------------------------------------------------------


class AdvisoryGenerateRequest(BaseModel):
    panchayat_id: int
    crop: str
    crop_stage: Optional[str] = "Vegetative Stage"
    advisory_date: Optional[datetime] = None


class AdvisoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    panchayat_id: int
    crop: str
    crop_stage: Optional[str] = "Vegetative Stage"
    advisory_date: datetime
    content_en: str
    content_hi: str
    content_mr: Optional[str] = None
    confidence_score: float
    baseline_rainfall_mm: Optional[float] = 4.5
    predicted_rainfall_mm: Optional[float] = 3.8
    model_diff_mm: Optional[float] = -0.7
    reliability_tier: Optional[str] = "HIGH"
    terrain_factors: Optional[dict[str, Any]] = None
    ml_explanation: Optional[dict[str, Any]] = None
    weather_snapshot: Optional[dict[str, Any]] = None
    is_imd_fallback: bool
    status: AdvisoryStatus
    officer_note: Optional[str] = None
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    panchayat_name: Optional[str] = None
    officer_name: Optional[str] = None


class AdvisoryListItem(BaseModel):
    """Slim advisory card for queue listing."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    panchayat_id: int
    panchayat_name: Optional[str] = None
    crop: str
    crop_stage: Optional[str] = "Vegetative Stage"
    advisory_date: datetime
    status: AdvisoryStatus
    confidence_score: float
    baseline_rainfall_mm: Optional[float] = 4.5
    predicted_rainfall_mm: Optional[float] = 3.8
    model_diff_mm: Optional[float] = -0.7
    reliability_tier: Optional[str] = "HIGH"
    is_imd_fallback: bool
    created_at: datetime


class AdvisoryApproveRequest(BaseModel):
    action: ApprovalAction
    reason_category: Optional[str] = None
    note: Optional[str] = None
    modified_content_hi: Optional[str] = None
    modified_content_en: Optional[str] = None
    modified_content_mr: Optional[str] = None


class ApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    advisory_id: int
    officer_id: int
    officer_name: Optional[str] = "Rajesh Sharma"
    action: ApprovalAction
    reason_category: Optional[str] = None
    note: Optional[str] = None
    modified_content_hi: Optional[str] = None
    modified_content_en: Optional[str] = None
    modified_content_mr: Optional[str] = None
    created_at: datetime


class AdvisoryAuditItem(BaseModel):
    timestamp: str
    stage: str
    actor: str
    role: str
    action: str
    details: str


class AdvisoryAuditResponse(BaseModel):
    advisory_id: int
    panchayat_name: str
    crop: str
    status: AdvisoryStatus
    history: list[AdvisoryAuditItem]


# ---------------------------------------------------------------------------
# Officer & Auth
# ---------------------------------------------------------------------------


class OfficerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    name: str
    department: Optional[str] = None
    designation: Optional[str] = None
    block: str
    district: str

class InstitutionalLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "officer"
    officer: Optional[OfficerOut] = None


class UnifiedLoginRequest(BaseModel):
    phone: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    otp: Optional[str] = "123456"


class UnifiedLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str  # "farmer" | "officer" | "admin"
    user_id: int
    name: str
    phone: Optional[str] = None
    district: str
    block: Optional[str] = None
    panchayat_id: Optional[int] = None
    panchayat_name: Optional[str] = None
    preferred_language: Optional[str] = "hi"
    crops: Optional[list[str]] = None


# ---------------------------------------------------------------------------
# Farmer
# ---------------------------------------------------------------------------


class FarmerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    panchayat_id: int
    name: str
    preferred_language: Language
    land_area_acres: Optional[float] = None
    district: Optional[str] = "Nagpur"
    block: Optional[str] = "Kalmeshwar"
    state: Optional[str] = "Maharashtra"


class FarmerSignupRequest(BaseModel):
    name: str
    phone: str
    state: str = "Maharashtra"
    district: str = "Nagpur"
    block: str = "Kalmeshwar"
    panchayat_id: int = 1
    crops: list[str] = ["soybean"]
    preferred_language: Language = Language.hi
    land_area_acres: Optional[float] = 3.5


# ---------------------------------------------------------------------------
# District Operations & Model Monitoring
# ---------------------------------------------------------------------------


class DistrictAlertItem(BaseModel):
    id: str
    severity: str  # "critical" | "warning" | "info"
    category: str  # "advisory_pending" | "stale_data" | "station_offline" | "forecast_deviation"
    title: str
    description: str
    affected_entity: str
    action_label: str
    action_target: str


class BlockSummaryItem(BaseModel):
    block: str
    total_panchayats: int
    verified_today: int
    pending_review: int
    stale_count: int
    avg_error_mm: str
    assigned_officer: str


class DistrictOperationsSummary(BaseModel):
    district: str = "Nagpur"
    total_panchayats: int = 78
    total_blocks: int = 4
    total_stations: int = 12
    approved_today: int = 71
    pending_advisories: int = 7
    stale_panchayats: int = 3
    offline_stations: int = 2
    telemetry_status: str = "Healthy"
    model_status: str = "Active (XGBoost v0.3)"
    alerts: list[DistrictAlertItem]
    blocks: list[BlockSummaryItem]


class ModelPerformanceResponse(BaseModel):
    model_version: str = "MausamSetu XGBoost v0.3.1"
    evaluation_period: str = "01 Sep 2026 – 25 Sep 2026"
    total_evaluation_samples: int = 480
    baseline_mae_mm: float = 2.41
    mausamsetu_mae_mm: float = 1.38
    error_reduction_pct: float = 42.7
    status: str = "Active"
    last_evaluated_at: str = "Today, 08:30 IST"
    fallback_rules: list[str] = [
        "Uncertainty Interval > ±3.5 mm triggers automated fallback to IMD official forecast",
        "Empirical Confidence < 0.65 flags advisory for mandatory manual officer inspection",
        "If AWS local station telemetry is offline > 12h, uses regional spatial interpolation"
    ]


# ---------------------------------------------------------------------------
# Chatbot & Stats
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


class MessageResponse(BaseModel):
    message: str


class StatsResponse(BaseModel):
    total_panchayats: int
    total_farmers: int
    pending_advisories: int
    approved_today: int
    sent_today: int


# ---------------------------------------------------------------------------
# India-First Geography & Crop Configuration Schemas
# ---------------------------------------------------------------------------


class StateConfigOut(BaseModel):
    state: str
    code: str
    languages: list[str]
    major_crops: list[str]
    districts_count: int


class DistrictItemOut(BaseModel):
    district: str
    state_code: str
    blocks_count: int
    panchayats_count: int


class BlockItemOut(BaseModel):
    block: str
    district: str
    panchayats_count: int
    assigned_officer: Optional[str] = None


class PanchayatHierarchyOut(BaseModel):
    id: int
    name: str
    block: str
    district: str
    state: str
    lat: float
    lng: float
    elevation_m: Optional[float] = None
    assigned_officer: Optional[str] = None
    registered_farmers: Optional[int] = 84
    primary_crops: list[str] = ["soybean", "cotton"]
    telemetry_status: str = "FRESH"
    last_sync: str = "10:30 AM"
    weather_status_text: Optional[str] = "0.0 mm (Clear)"
    advisory_status: Optional[str] = "Approved"
    model_state: Optional[str] = "Normal (XGB-03)"


class CropGrowthStageOut(BaseModel):
    stage_name: str
    stage_name_hi: str
    stage_name_mr: str
    approx_days: str
    vulnerability_notes: str


class CropMetadataOut(BaseModel):
    crop_id: str
    name: str
    name_hi: str
    name_mr: str
    supported_states: list[str]
    growth_stages: list[CropGrowthStageOut]
    critical_weather_thresholds: dict[str, str]


# ---------------------------------------------------------------------------
# Field Report Schemas
# ---------------------------------------------------------------------------


class FieldReportCreate(BaseModel):
    officer_id: Optional[int] = 1
    panchayat_id: int
    crop: str
    observation_type: Optional[str] = None  # crop_stress, pest_reported, drainage_blocked, forecast_divergence, sensor_drift
    category: Optional[str] = None
    severity: str = "medium"  # low, medium, high, critical
    description: Optional[str] = None
    observation_notes: Optional[str] = None
    crop_stage: Optional[str] = None
    action_recommended: Optional[str] = None
    photo_url: Optional[str] = None


class FieldReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    officer_id: int
    officer_name: Optional[str] = None
    panchayat_id: int
    panchayat_name: Optional[str] = None
    block: Optional[str] = None
    crop: str
    observation_type: str
    severity: str
    description: str
    photo_url: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Officer Management & Operations Schemas
# ---------------------------------------------------------------------------


class OfficerDirectoryItem(BaseModel):
    id: int
    name: str
    phone: str
    district: str
    block: str
    assigned_panchayats_count: int
    pending_reviews: int
    approved_today: int
    avg_review_time_mins: int
    status: str  # "active" | "on_leave" | "deactivated"
    last_active: str


class OfficerAssignRequest(BaseModel):
    officer_id: int
    block: str
    panchayat_ids: Optional[list[int]] = None


class OfficerBlockDashboardOut(BaseModel):
    officer_id: int
    officer_name: str
    block: str
    district: str
    total_panchayats: int
    total_farmers: int
    active_crops_count: int
    pending_advisories: int
    approved_today: int
    field_reports_count: int
    weather_watch_alerts: list[dict]

