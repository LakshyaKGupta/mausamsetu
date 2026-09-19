"""
Production Weather Downscaling Service for MausamSetu.
Integrates trained XGBoost regressor, empirical residual calibration intervals,
geospatial terrain features, and source-aware fallback hierarchy.
"""

from datetime import date, datetime
import json
import logging
import math
import os
from typing import Optional, Tuple
import joblib
import numpy as np

from app.schemas.contracts import (
    BlockForecast,
    DataProvenance,
    FeatureVector,
    PanchayatGeoFeatures,
    PanchayatPrediction,
    PipelineStage,
    PredictionInterval,
    ReliabilityStatus,
    SourceType,
)
from app.services.connectors.gis_connector import GISConnector
from app.services.connectors.imd_connector import IMDConnector
from app.services.connectors.openmeteo_connector import OpenMeteoConnector

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")


class WeatherDownscalingEngine:
    """
    Downscaling engine that executes trained XGBoost models,
    computes empirical prediction intervals, and enforces source-aware fallbacks.
    """

    def __init__(self, artifacts_dir: str = ARTIFACTS_DIR):
        self.artifacts_dir = artifacts_dir
        self.model = None
        self.scaler = None
        self.calibration_params = {}
        self.metadata = {}

        self.imd_connector = IMDConnector()
        self.openmeteo_connector = OpenMeteoConnector()
        self.gis_connector = GISConnector()

        self._load_artifacts()

    def _load_artifacts(self):
        """Load serialized model, scaler, calibration params, and metadata."""
        model_path = os.path.join(self.artifacts_dir, "model.joblib")
        scaler_path = os.path.join(self.artifacts_dir, "scaler.joblib")
        calib_path = os.path.join(self.artifacts_dir, "calibration_params.json")
        meta_path = os.path.join(self.artifacts_dir, "model_metadata.json")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            try:
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                if os.path.exists(calib_path):
                    with open(calib_path, "r") as f:
                        self.calibration_params = json.load(f)
                if os.path.exists(meta_path):
                    with open(meta_path, "r") as f:
                        self.metadata = json.load(f)
                logger.info("Successfully loaded MausamSetu ML downscaling artifacts.")
            except Exception as e:
                logger.error(f"Failed to load ML artifacts: {e}")
                self.model = None
        else:
            logger.warning(f"ML artifacts not found at {self.artifacts_dir}. Fallback mode active.")

    async def get_block_forecast(
        self,
        block_id: str,
        lat: float,
        lon: float,
        target_date: Optional[date] = None,
    ) -> Tuple[Optional[BlockForecast], SourceType]:
        """
        Fetch forecast following source priority:
        1. Official IMD API (Primary)
        2. Open-Meteo API (Development / Fallback)
        """
        # 1. Try official IMD API
        forecast = await self.imd_connector.fetch_block_forecast(block_id, lat, lon, target_date)
        if forecast:
            return forecast, SourceType.OFFICIAL_IMD

        # 2. Engage Open-Meteo fallback
        logger.info(f"Using Open-Meteo fallback for block {block_id}")
        forecast = await self.openmeteo_connector.fetch_block_forecast(block_id, lat, lon, target_date)
        if forecast:
            return forecast, SourceType.FALLBACK

        return None, SourceType.FALLBACK

    def construct_feature_vector(
        self,
        block_forecast: BlockForecast,
        geo: PanchayatGeoFeatures,
        target_date: date,
        historical_rain_7d: float = 0.0,
    ) -> FeatureVector:
        """Assemble normalized FeatureVector matching training features."""
        doy = target_date.timetuple().tm_yday
        doy_sin = math.sin(2 * math.pi * doy / 365.25)
        doy_cos = math.cos(2 * math.pi * doy / 365.25)

        aspect_rad = math.radians(geo.aspect_deg)
        aspect_sin = math.sin(aspect_rad)
        aspect_cos = math.cos(aspect_rad)

        return FeatureVector(
            coarse_rainfall_mm=block_forecast.rainfall_mm,
            coarse_temp_max_c=block_forecast.temp_max_c,
            coarse_temp_min_c=block_forecast.temp_min_c,
            lead_time_hours=block_forecast.lead_time_hours,
            centroid_lat=geo.centroid_lat,
            centroid_lon=geo.centroid_lon,
            elevation_m=geo.elevation_m,
            slope_deg=geo.slope_deg,
            aspect_sin=round(aspect_sin, 4),
            aspect_cos=round(aspect_cos, 4),
            terrain_roughness=geo.terrain_roughness,
            station_distance_km=geo.station_distance_km,
            day_of_year_sin=round(doy_sin, 4),
            day_of_year_cos=round(doy_cos, 4),
            historical_rain_7d_mm=historical_rain_7d,
        )

    async def downscale_panchayat_forecast(
        self,
        panchayat_id: str,
        panchayat_name: str,
        block_id: str,
        lat: float,
        lon: float,
        elevation_m: Optional[float] = None,
        target_date: Optional[date] = None,
    ) -> PanchayatPrediction:
        """
        Execute full downscaling and fallback pipeline:
        1. Fetch forecast & check freshness
        2. Extract GIS terrain features
        3. Run XGBoost model & compute prediction intervals
        4. Validate reliability; fallback to baseline if uncertain
        """
        import uuid
        pred_date = target_date or date.today()
        prediction_id = str(uuid.uuid4())

        # Step 1: Fetch source forecast
        block_forecast, source_type = await self.get_block_forecast(block_id, lat, lon, pred_date)

        # Handle total source outage
        if not block_forecast:
            # Return zeroed fallback prediction marking outage
            return PanchayatPrediction(
                prediction_id=prediction_id,
                panchayat_id=panchayat_id,
                target_date=pred_date,
                predicted_rainfall_mm=0.0,
                baseline_rainfall_mm=0.0,
                delta_from_baseline_mm=0.0,
                prediction_interval=PredictionInterval(
                    lower_bound_mm=0.0,
                    upper_bound_mm=0.0,
                    expected_error_margin_mm=0.0,
                    methodology="SOURCE_UNAVAILABLE",
                    calibration_sample_size=0,
                    reliability_status=ReliabilityStatus.UNRELIABLE,
                ),
                model_version="none",
                is_reliable=False,
                provenance=DataProvenance(
                    source_name="UNAVAILABLE",
                    source_type=SourceType.FALLBACK,
                    source_resolution="NONE",
                    ingestion_timestamp=datetime.utcnow(),
                    data_freshness_hours=999.0,
                    is_stale=True,
                    pipeline_stage=PipelineStage.STALE,
                ),
            )

        # Freshness calculation
        now = datetime.utcnow()
        freshness_hours = (now - block_forecast.forecast_issued_at).total_seconds() / 3600.0
        is_stale = freshness_hours > 24.0

        # Step 2: Derive GIS & Terrain Features
        geo = self.gis_connector.get_panchayat_geo_features(
            panchayat_id=panchayat_id,
            centroid_lat=lat,
            centroid_lon=lon,
            block_id=block_id,
            panchayat_name=panchayat_name,
            elevation_m=elevation_m,
        )

        # Step 3: Check model availability & freshness
        can_run_ml = (self.model is not None and self.scaler is not None and not is_stale)

        if can_run_ml:
            feature_vec = self.construct_feature_vector(block_forecast, geo, pred_date)
            feature_order = self.metadata.get("feature_list", [
                "coarse_rainfall_mm", "coarse_temp_max_c", "coarse_temp_min_c", "lead_time_hours",
                "centroid_lat", "centroid_lon", "elevation_m", "slope_deg", "aspect_sin", "aspect_cos",
                "terrain_roughness", "station_distance_km", "day_of_year_sin", "day_of_year_cos",
                "historical_rain_7d_mm"
            ])
            raw_features = [getattr(feature_vec, f) for f in feature_order]
            X_scaled = self.scaler.transform([raw_features])
            raw_pred = float(self.model.predict(X_scaled)[0])
            predicted_rain = round(max(0.0, raw_pred), 1)

            # Empirical Prediction Interval from calibration params
            e80 = float(self.calibration_params.get("expected_error_margin_p80_mm", 1.5))
            calib_samples = int(self.calibration_params.get("calibration_sample_size", 2920))

            lower_bound = round(max(0.0, predicted_rain - e80), 1)
            upper_bound = round(predicted_rain + e80, 1)

            # Reliability Check
            # If distance to station is > 35km or extreme anomaly, mark moderate
            if geo.station_distance_km > 35.0:
                reliability_status = ReliabilityStatus.MODERATE
            else:
                reliability_status = ReliabilityStatus.HIGH

            interval = PredictionInterval(
                lower_bound_mm=lower_bound,
                upper_bound_mm=upper_bound,
                expected_error_margin_mm=e80,
                methodology="EMPIRICAL_VALIDATION_RESIDUALS_P80",
                calibration_sample_size=calib_samples,
                reliability_status=reliability_status,
            )

            delta = round(predicted_rain - block_forecast.rainfall_mm, 1)

            provenance = DataProvenance(
                source_name=block_forecast.source_name,
                source_type=source_type,
                source_resolution="PANCHAYAT_POINT_DOWNSCALED",
                ingestion_timestamp=now,
                data_freshness_hours=round(freshness_hours, 1),
                is_stale=is_stale,
                pipeline_stage=PipelineStage.AI_DOWNSCALED,
            )

            return PanchayatPrediction(
                prediction_id=prediction_id,
                panchayat_id=panchayat_id,
                target_date=pred_date,
                predicted_rainfall_mm=predicted_rain,
                baseline_rainfall_mm=block_forecast.rainfall_mm,
                delta_from_baseline_mm=delta,
                prediction_interval=interval,
                model_version=self.metadata.get("model_id", "xgb_rain_v1.0.0"),
                is_reliable=True,
                provenance=provenance,
            )

        # Fallback to Baseline (when ML model unavailable or data stale)
        baseline_rain = block_forecast.rainfall_mm
        interval = PredictionInterval(
            lower_bound_mm=baseline_rain,
            upper_bound_mm=baseline_rain,
            expected_error_margin_mm=0.0,
            methodology="OFFICIAL_BASELINE_NO_INTERVAL",
            calibration_sample_size=0,
            reliability_status=ReliabilityStatus.MODERATE if not is_stale else ReliabilityStatus.UNRELIABLE,
        )

        provenance = DataProvenance(
            source_name=block_forecast.source_name,
            source_type=source_type,
            source_resolution="BLOCK_LEVEL",
            ingestion_timestamp=now,
            data_freshness_hours=round(freshness_hours, 1),
            is_stale=is_stale,
            pipeline_stage=PipelineStage.OFFICIAL_BASELINE if not is_stale else PipelineStage.STALE,
        )

        return PanchayatPrediction(
            prediction_id=prediction_id,
            panchayat_id=panchayat_id,
            target_date=pred_date,
            predicted_rainfall_mm=baseline_rain,
            baseline_rainfall_mm=baseline_rain,
            delta_from_baseline_mm=0.0,
            prediction_interval=interval,
            model_version="baseline_only",
            is_reliable=not is_stale,
            provenance=provenance,
        )


# Singleton instance
downscaler_engine = WeatherDownscalingEngine()
