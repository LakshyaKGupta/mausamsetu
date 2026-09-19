"""
Normalized Data Contracts for MausamSetu.
Defines schemas for meteorology, geospatial features, ML predictions, and advisories.
"""

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    OFFICIAL_IMD = "OFFICIAL_IMD"
    GROUND_STATION = "GROUND_STATION"
    FALLBACK = "FALLBACK"
    REANALYSIS = "REANALYSIS"


class PipelineStage(str, Enum):
    OFFICIAL_BASELINE = "OFFICIAL_BASELINE"
    AI_DOWNSCALED = "AI_DOWNSCALED"
    OFFICER_APPROVED = "OFFICER_APPROVED"
    STALE = "STALE"


class ReliabilityStatus(str, Enum):
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    UNRELIABLE = "UNRELIABLE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DataProvenance(BaseModel):
    """Auditing metadata tracking data lineage, resolution, freshness, and stage."""
    source_name: str = Field(..., description="E.g., IMD_API_AGROMET, OPENMETEO_DEV")
    source_type: SourceType = Field(..., description="Official IMD, ground station, or fallback")
    source_resolution: str = Field(..., description="E.g., BLOCK_LEVEL, 0.25_GRID, STATION_POINT")
    ingestion_timestamp: datetime = Field(default_factory=datetime.utcnow, description="When retrieved")
    data_freshness_hours: float = Field(..., description="Age of data in hours: now - forecast_issued_at")
    is_stale: bool = Field(..., description="True if freshness exceeds freshness threshold")
    pipeline_stage: PipelineStage = Field(..., description="Current stage in pipeline")


class BlockForecast(BaseModel):
    """Coarse meteorological forecast issued at block/sub-district level."""
    block_id: str = Field(..., description="LGD block code")
    block_name: str = Field(..., description="Official block name")
    district_name: str = Field(..., description="District name")
    state_name: str = Field(..., description="State name")
    forecast_issued_at: datetime = Field(..., description="When forecast was generated")
    forecast_target_date: date = Field(..., description="Date forecast applies to")
    lead_time_hours: int = Field(24, description="Forecast horizon in hours")
    rainfall_mm: float = Field(..., description="Coarse forecasted 24h rainfall (mm)")
    temp_max_c: float = Field(..., description="Forecasted maximum temperature (°C)")
    temp_min_c: float = Field(..., description="Forecasted minimum temperature (°C)")
    humidity_morning_pct: Optional[float] = Field(None, description="Forecasted morning humidity (%)")
    wind_speed_kmh: Optional[float] = Field(None, description="Forecasted wind speed (km/h)")
    wind_direction_deg: Optional[float] = Field(None, description="Forecasted wind direction (degrees)")
    source_name: str = Field("IMD_API_AGROMET", description="Source identifier")


class Observation(BaseModel):
    """Ground truth meteorological observation recorded at an official AWS/ARG station."""
    station_id: str = Field(..., description="Station identifier")
    station_name: str = Field(..., description="Station name")
    latitude: float = Field(..., description="WGS84 latitude")
    longitude: float = Field(..., description="WGS84 longitude")
    elevation_m: float = Field(..., description="Station altitude above sea level (meters)")
    observation_timestamp: datetime = Field(..., description="Observation timestamp")
    rainfall_24h_mm: float = Field(..., ge=0.0, description="Observed 24h rainfall (mm) - Primary ML Target")
    temp_max_c: Optional[float] = Field(None, description="Observed daily max temperature (°C)")
    temp_min_c: Optional[float] = Field(None, description="Observed daily min temperature (°C)")
    qc_flag: str = Field("PASSED", description="QC status: PASSED, SUSPECT, FAILED")
    source_type: str = Field("IMD_AWS", description="IMD_AWS, IMD_ARG, etc.")


class PanchayatGeoFeatures(BaseModel):
    """Static geospatial and terrain context for a Gram Panchayat."""
    panchayat_id: str = Field(..., description="LGD Panchayat code")
    panchayat_name: str = Field(..., description="Gram Panchayat name")
    block_id: str = Field(..., description="Parent block LGD code")
    centroid_lat: float = Field(..., description="Centroid latitude")
    centroid_lon: float = Field(..., description="Centroid longitude")
    elevation_m: float = Field(..., description="Mean elevation (meters) from SRTM DEM")
    slope_deg: float = Field(0.0, ge=0.0, le=90.0, description="Mean slope gradient (degrees)")
    aspect_deg: float = Field(0.0, ge=0.0, le=360.0, description="Terrain aspect (degrees)")
    terrain_roughness: float = Field(0.0, description="Terrain roughness index")
    nearest_station_id: str = Field(..., description="Nearest AWS/ARG station ID")
    station_distance_km: float = Field(..., ge=0.0, description="Distance to nearest station (km)")
    station_elevation_diff_m: float = Field(0.0, description="panchayat_elevation - station_elevation")


class FeatureVector(BaseModel):
    """Merged feature row fed into the ML Downscaling Model."""
    coarse_rainfall_mm: float = Field(..., description="Baseline block rainfall forecast")
    coarse_temp_max_c: float = Field(..., description="Baseline block max temperature")
    coarse_temp_min_c: float = Field(..., description="Baseline block min temperature")
    lead_time_hours: int = Field(24, description="Forecast horizon")
    centroid_lat: float = Field(..., description="Panchayat latitude")
    centroid_lon: float = Field(..., description="Panchayat longitude")
    elevation_m: float = Field(..., description="Panchayat elevation")
    slope_deg: float = Field(..., description="Terrain slope")
    aspect_sin: float = Field(..., description="sin(aspect_deg * pi / 180)")
    aspect_cos: float = Field(..., description="cos(aspect_deg * pi / 180)")
    terrain_roughness: float = Field(..., description="Terrain roughness")
    station_distance_km: float = Field(..., description="Distance to calibration station")
    day_of_year_sin: float = Field(..., description="sin(2 * pi * day_of_year / 365.25)")
    day_of_year_cos: float = Field(..., description="cos(2 * pi * day_of_year / 365.25)")
    historical_rain_7d_mm: float = Field(0.0, description="Antecedent 7-day cumulative rainfall")


class PredictionInterval(BaseModel):
    """Empirical uncertainty bounds derived from validation residuals."""
    lower_bound_mm: float = Field(..., ge=0.0, description="max(0.0, predicted - empirical_margin)")
    upper_bound_mm: float = Field(..., ge=0.0, description="predicted + empirical_margin")
    expected_error_margin_mm: float = Field(..., description="Empirical error margin (+/- X mm)")
    methodology: str = Field("EMPIRICAL_VALIDATION_RESIDUALS_P80", description="Methodology")
    calibration_sample_size: int = Field(..., description="Calibration sample count")
    reliability_status: ReliabilityStatus = Field(..., description="HIGH, MODERATE, or UNRELIABLE")


class PanchayatPrediction(BaseModel):
    """Output of the ML Downscaling Engine for a specific Panchayat."""
    prediction_id: str = Field(..., description="Unique prediction UUID")
    panchayat_id: str = Field(..., description="Target Panchayat LGD code")
    target_date: date = Field(..., description="Forecast date")
    predicted_rainfall_mm: float = Field(..., ge=0.0, description="Downscaled rainfall estimate (mm)")
    baseline_rainfall_mm: float = Field(..., ge=0.0, description="Original coarse forecast (mm)")
    delta_from_baseline_mm: float = Field(..., description="predicted - baseline")
    prediction_interval: PredictionInterval = Field(..., description="Uncertainty interval")
    model_version: str = Field(..., description="E.g., xgb_rain_v1.0.0")
    is_reliable: bool = Field(..., description="True if within reliability tolerance")
    provenance: DataProvenance = Field(..., description="Audit and lineage metadata")


class ModelMetadata(BaseModel):
    """Audit record of the trained downscaling model."""
    model_id: str = Field(..., description="Unique model identifier")
    algorithm: str = Field("XGBoostRegressor", description="Model algorithm")
    target_variable: str = Field("rainfall_24h_mm", description="Target variable")
    training_period: str = Field(..., description="E.g., 2014-01-01 to 2021-12-31")
    validation_period: str = Field(..., description="E.g., 2022-01-01 to 2022-12-31")
    test_period: str = Field(..., description="E.g., 2023-01-01 to 2023-12-31")
    feature_list: List[str] = Field(..., description="Feature list in exact order")
    test_mae_model: float = Field(..., description="Model MAE on held-out test set")
    test_mae_baseline: float = Field(..., description="Baseline MAE on held-out test set")
    test_rmse_model: float = Field(..., description="Model RMSE on held-out test set")
    test_rmse_baseline: float = Field(..., description="Baseline RMSE on held-out test set")
    improvement_pct: float = Field(..., description="((baseline_mae - model_mae) / baseline_mae) * 100")
    calibration_residuals_p80: float = Field(..., description="80th percentile residual margin on val set")


class Advisory(BaseModel):
    """Crop-specific agricultural risk assessment and recommended action."""
    advisory_id: str = Field(..., description="Unique advisory UUID")
    panchayat_id: str = Field(..., description="Target Panchayat LGD code")
    crop_name: str = Field(..., description="E.g., cotton, soybean, wheat, orange")
    crop_stage: str = Field(..., description="E.g., flowering, vegetative, pod_formation")
    weather_condition_code: str = Field(..., description="E.g., RAIN_HEAVY, DRY_SPELL")
    risk_level: RiskLevel = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    action_recommendation: Dict[str, str] = Field(..., description="Multilingual actions: hi, mr, en")
    prediction_id: str = Field(..., description="Linked prediction UUID")
    approval_status: ApprovalStatus = Field(ApprovalStatus.PENDING, description="Approval status")
    approved_by_officer_id: Optional[str] = Field(None, description="Officer ID who approved")
    approved_at: Optional[datetime] = Field(None, description="Approval timestamp")
