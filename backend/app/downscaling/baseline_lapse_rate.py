"""
Baseline 2: Physical Lapse-Rate Temperature Correction (B2)

Scientific formulation established in Phase 6:
    T_B2 = T_reference - Gamma * (z_target - z_reference)

which is equivalent to:
    T_B2 = T_reference + Gamma * (z_reference - z_target)

where:
    Gamma = 0.0065 °C/m   (standard environmental lapse rate)
    z_target   = Panchayat/target elevation in metres
    z_reference = Reference GFS grid elevation in metres

Phase 6 experimental results (1,660 real GFS–ISD pairs, 18 Maharashtra stations):
    B0 overall MAE = 1.705 °C
    B2 overall MAE = 1.555 °C (improvement of 0.15 °C)
    B2 August temporal holdout MAE = 1.364 °C
    B2 February temporal holdout MAE = 1.726 °C

Scientific status: GO WITH LIMITATION
    - B2 improved aggregate MAE but did not eliminate harmful corrections.
    - 14.8 % of predictions produced a harmful correction (B2 worse than B0).
    - No reliable prediction-time signal was found to gate harmful corrections
      (Phase 7 reliability gate: NO-GO).
    - Validation used synoptic/airport stations, NOT rural Panchayat observations.
    - Results must NOT be interpreted as direct Panchayat ground-truth accuracy.
"""

from typing import List, Dict, Any, Optional
from app.downscaling.base import BaselineLocalizationEngine
from app.models.weather import ForecastRecord

# Standard environmental lapse rate used in Phase 6 experiments.
# Must NOT be changed without re-running the full Phase 6 validation suite.
GAMMA_C_PER_M: float = 0.0065

# Soft caps to reject implausible elevation inputs.
# These are not a reliability filter — they are input sanity guards.
MAX_ELEVATION_DIFFERENCE_M: float = 5000.0   # Highest Himalayan peaks ~8,850 m
MIN_TEMPERATURE_C: float = -60.0             # Record Indian low ~-45 °C with margin
MAX_TEMPERATURE_C: float =  60.0             # Record Indian high ~51 °C with margin


class BaselineLapseRate(BaselineLocalizationEngine):
    """
    B2 Physical Lapse-Rate Correction Engine.

    Applies a deterministic, formula-based temperature adjustment using
    the elevation difference between the reference grid cell and the
    Panchayat target location.

    This engine NEVER uses observed temperatures as inputs.
    This engine NEVER infers reliability scores.
    This engine returns explicit metadata with every computation.
    """

    def apply(
        self,
        reference_forecasts: List[ForecastRecord],
        panchayat_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Apply B2 lapse-rate correction to each reference forecast record.

        Required panchayat_context keys:
            target_elevation_m (float): Panchayat elevation in metres.
            reference_elevation_m (float): GFS grid reference elevation in metres.

        Optional panchayat_context keys:
            lat, lon: passed through to provenance only.

        Returns a dict matching the schema expected by the forecast API.
        Raises ValueError for missing or invalid elevation inputs.
        """
        target_elev: Optional[float] = panchayat_context.get("target_elevation_m")
        ref_elev: Optional[float] = panchayat_context.get("reference_elevation_m")

        # ── Input validation ───────────────────────────────────────────────
        if target_elev is None or ref_elev is None:
            raise ValueError(
                "B2 requires both target_elevation_m and reference_elevation_m. "
                "Use Baseline0Raw when elevation data is not available."
            )

        if not isinstance(target_elev, (int, float)) or not isinstance(ref_elev, (int, float)):
            raise ValueError("Elevation values must be numeric.")

        elev_diff: float = float(target_elev) - float(ref_elev)

        if abs(elev_diff) > MAX_ELEVATION_DIFFERENCE_M:
            raise ValueError(
                f"Elevation difference {elev_diff:.1f} m exceeds sanity bound "
                f"of ±{MAX_ELEVATION_DIFFERENCE_M} m. Check input data."
            )

        # ── Apply correction to each hourly forecast record ────────────────
        correction_c: float = round(GAMMA_C_PER_M * elev_diff, 4)
        localized_values: List[Dict[str, Any]] = []

        for f in reference_forecasts[:24]:
            ref_temp = f.temperature
            if ref_temp is None:
                loc_temp = None
            else:
                loc_temp = ref_temp - correction_c
                # Sanity-check the output (not a reliability filter)
                if not (MIN_TEMPERATURE_C <= loc_temp <= MAX_TEMPERATURE_C):
                    loc_temp = None   # Return null rather than a nonsense value

            localized_values.append({
                "valid_time": f.valid_time.isoformat(),
                "temperature": round(loc_temp, 2) if loc_temp is not None else None,
                "reference_temperature": ref_temp,
                "temperature_adjustment_c": round(-correction_c, 4) if loc_temp is not None else None,
                "precipitation": f.precipitation,   # Unchanged — B2 addresses temperature only
                "humidity": f.humidity,
                "wind_speed": f.wind_speed,
                "wind_direction": f.wind_direction,
            })

        return {
            "method": "B2_PHYSICAL_LAPSE_RATE",
            "status": "EXPERIMENTAL",
            "gamma_c_per_m": GAMMA_C_PER_M,
            "reference_elevation_m": float(ref_elev),
            "target_elevation_m": float(target_elev),
            "elevation_difference_m": round(elev_diff, 2),
            "temperature_adjustment_c": round(-correction_c, 4),
            "values": localized_values,
            "validation_summary": {
                "dataset_size": 1660,
                "stations": 18,
                "b0_overall_mae_c": 1.705,
                "b2_overall_mae_c": 1.555,
                "b2_aug_holdout_mae_c": 1.364,
                "b2_feb_holdout_mae_c": 1.726,
                "harmful_correction_rate_pct": 14.8,
            },
            "limitations": [
                "B2 is an experimental physical correction. Scientific status: GO WITH LIMITATION.",
                "Validated on 1,660 real GFS–ISD pairs across 18 Maharashtra synoptic/airport stations (Feb and Aug 2023).",
                "14.8% of evaluated predictions produced a harmful correction where B2 was worse than raw B0.",
                "No reliable prediction-time signal was found to detect harmful corrections (Phase 7 reliability gate: NO-GO).",
                "Validation stations are synoptic/airport observations — NOT rural Panchayat observations.",
                "Results must not be interpreted as direct Panchayat ground-truth accuracy.",
                "B2 addresses temperature only. Precipitation is passed through unchanged from the reference forecast.",
                "Performance varies by terrain regime and season. High-elevation correction data is limited.",
            ],
        }
