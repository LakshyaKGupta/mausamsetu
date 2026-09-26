"""
Unit tests for the B2 Physical Lapse-Rate Downscaling Engine.

These tests verify:
1. Correct formula application and sign convention.
2. Deterministic output for given inputs.
3. Graceful handling of missing elevation inputs.
4. Sanity guards on unrealistic elevation differences.
5. Null temperature propagation.
6. Metadata completeness.

They do NOT test any ML model, confidence score, or reliability gate.
They do NOT use historical observation targets.
"""
import pytest
from unittest.mock import MagicMock
import datetime

from app.downscaling.baseline_lapse_rate import (
    BaselineLapseRate,
    GAMMA_C_PER_M,
    MAX_ELEVATION_DIFFERENCE_M,
)


def _make_record(temp: float | None, dt_offset_h: int = 0) -> MagicMock:
    """Create a synthetic ForecastRecord mock for testing mechanics only."""
    r = MagicMock()
    r.temperature = temp
    r.precipitation = 2.0
    r.humidity = 75.0
    r.wind_speed = 10.0
    r.wind_direction = 180.0
    r.valid_time = datetime.datetime(2023, 2, 1, 12, 0, 0) + datetime.timedelta(hours=dt_offset_h)
    return r


class TestB2Formula:
    """Test the mathematical correctness of the B2 lapse-rate formula."""

    def test_positive_elevation_difference_cools(self):
        """Station higher than GFS grid → lapse-rate reduces temperature."""
        engine = BaselineLapseRate()
        records = [_make_record(30.0)]
        ctx = {"target_elevation_m": 500.0, "reference_elevation_m": 0.0}
        result = engine.apply(records, ctx)
        val = result["values"][0]
        # correction = GAMMA * (z_target - z_ref) = 0.0065 * 500 = 3.25 °C cooling
        expected = 30.0 - GAMMA_C_PER_M * 500.0
        assert abs(val["temperature"] - expected) < 1e-4, (
            f"Expected {expected:.4f}, got {val['temperature']}"
        )

    def test_negative_elevation_difference_warms(self):
        """Station lower than GFS grid → lapse-rate increases temperature."""
        engine = BaselineLapseRate()
        records = [_make_record(20.0)]
        ctx = {"target_elevation_m": -10.0, "reference_elevation_m": 500.0}
        result = engine.apply(records, ctx)
        val = result["values"][0]
        # correction = GAMMA * (-10 - 500) = GAMMA * -510 → warming
        expected = 20.0 - GAMMA_C_PER_M * (-510.0)
        # Output is rounded to 2 dp; tolerance of 0.01 accounts for this
        assert abs(val["temperature"] - expected) < 0.01

    def test_zero_elevation_difference_passes_through(self):
        """No elevation difference → B2 temperature equals reference temperature."""
        engine = BaselineLapseRate()
        ref_temp = 25.3
        records = [_make_record(ref_temp)]
        ctx = {"target_elevation_m": 200.0, "reference_elevation_m": 200.0}
        result = engine.apply(records, ctx)
        assert abs(result["values"][0]["temperature"] - ref_temp) < 1e-6

    def test_gamma_value_matches_experiment(self):
        """GAMMA constant must match the Phase 6 validated value exactly."""
        assert GAMMA_C_PER_M == 0.0065, (
            "GAMMA must not be changed without re-running Phase 6 validation."
        )

    def test_deterministic_for_identical_inputs(self):
        """Same inputs always produce the same output."""
        engine = BaselineLapseRate()
        records = [_make_record(28.5)]
        ctx = {"target_elevation_m": 800.0, "reference_elevation_m": 300.0}
        r1 = engine.apply(records, ctx)
        r2 = engine.apply(records, ctx)
        assert r1["values"][0]["temperature"] == r2["values"][0]["temperature"]

    def test_adjustment_metadata_matches_formula(self):
        """temperature_adjustment_c in output must match the applied correction."""
        engine = BaselineLapseRate()
        records = [_make_record(25.0)]
        elev_diff = 400.0
        ctx = {"target_elevation_m": 400.0, "reference_elevation_m": 0.0}
        result = engine.apply(records, ctx)
        expected_adj = -GAMMA_C_PER_M * elev_diff  # negative = cooling
        assert abs(result["values"][0]["temperature_adjustment_c"] - expected_adj) < 1e-6
        assert abs(result["temperature_adjustment_c"] - expected_adj) < 1e-6


class TestB2InputValidation:
    """Test that B2 correctly rejects invalid or missing inputs."""

    def test_missing_target_elevation_raises(self):
        engine = BaselineLapseRate()
        with pytest.raises(ValueError, match="target_elevation_m"):
            engine.apply([_make_record(25.0)], {"reference_elevation_m": 100.0})

    def test_missing_reference_elevation_raises(self):
        engine = BaselineLapseRate()
        with pytest.raises(ValueError, match="target_elevation_m"):
            engine.apply([_make_record(25.0)], {"target_elevation_m": 100.0})

    def test_both_elevations_missing_raises(self):
        engine = BaselineLapseRate()
        with pytest.raises(ValueError):
            engine.apply([_make_record(25.0)], {})

    def test_extreme_elevation_difference_raises(self):
        """Elevation differences beyond physical plausibility must be rejected."""
        engine = BaselineLapseRate()
        with pytest.raises(ValueError, match="Elevation difference"):
            engine.apply(
                [_make_record(25.0)],
                {"target_elevation_m": MAX_ELEVATION_DIFFERENCE_M + 1.0,
                 "reference_elevation_m": 0.0},
            )

    def test_non_numeric_elevation_raises(self):
        engine = BaselineLapseRate()
        with pytest.raises(ValueError, match="numeric"):
            engine.apply(
                [_make_record(25.0)],
                {"target_elevation_m": "high", "reference_elevation_m": 0.0},
            )


class TestB2NullHandling:
    """Null/None temperature must propagate without raising an exception."""

    def test_none_temperature_propagates_cleanly(self):
        engine = BaselineLapseRate()
        records = [_make_record(None)]
        ctx = {"target_elevation_m": 300.0, "reference_elevation_m": 100.0}
        result = engine.apply(records, ctx)
        assert result["values"][0]["temperature"] is None
        assert result["values"][0]["temperature_adjustment_c"] is None

    def test_mixed_none_and_valid_temperatures(self):
        """Non-None values still corrected; None values remain None."""
        engine = BaselineLapseRate()
        records = [_make_record(28.0), _make_record(None), _make_record(26.0)]
        ctx = {"target_elevation_m": 200.0, "reference_elevation_m": 0.0}
        result = engine.apply(records, ctx)
        assert result["values"][0]["temperature"] is not None
        assert result["values"][1]["temperature"] is None
        assert result["values"][2]["temperature"] is not None


class TestB2Metadata:
    """Test that the response metadata is complete and scientifically correct."""

    def test_method_field_is_b2(self):
        engine = BaselineLapseRate()
        result = engine.apply([_make_record(25.0)],
                              {"target_elevation_m": 100.0, "reference_elevation_m": 0.0})
        assert result["method"] == "B2_PHYSICAL_LAPSE_RATE"

    def test_status_is_experimental(self):
        engine = BaselineLapseRate()
        result = engine.apply([_make_record(25.0)],
                              {"target_elevation_m": 100.0, "reference_elevation_m": 0.0})
        assert result["status"] == "EXPERIMENTAL"

    def test_limitations_list_is_non_empty(self):
        engine = BaselineLapseRate()
        result = engine.apply([_make_record(25.0)],
                              {"target_elevation_m": 100.0, "reference_elevation_m": 0.0})
        assert isinstance(result["limitations"], list)
        assert len(result["limitations"]) >= 5, "At least 5 limitation entries expected."

    def test_no_observed_temperature_in_output(self):
        """Output must never expose historical observed temperatures."""
        engine = BaselineLapseRate()
        result = engine.apply([_make_record(25.0)],
                              {"target_elevation_m": 100.0, "reference_elevation_m": 0.0})
        for key in result:
            assert "observed" not in key.lower(), (
                f"Output key '{key}' appears to expose an observed value."
            )

    def test_precipitation_unchanged(self):
        """B2 addresses temperature only; precipitation must pass through unchanged."""
        engine = BaselineLapseRate()
        original_precip = 5.3
        records = [_make_record(25.0)]
        records[0].precipitation = original_precip
        result = engine.apply(records, {"target_elevation_m": 300.0, "reference_elevation_m": 0.0})
        assert result["values"][0]["precipitation"] == original_precip

    def test_validation_summary_present(self):
        engine = BaselineLapseRate()
        result = engine.apply([_make_record(25.0)],
                              {"target_elevation_m": 100.0, "reference_elevation_m": 0.0})
        vs = result["validation_summary"]
        assert vs["dataset_size"] == 1660
        assert vs["stations"] == 18
        assert vs["b2_overall_mae_c"] < vs["b0_overall_mae_c"], (
            "Validation summary must reflect that B2 improved over B0."
        )


class TestB2NumericalRegression:
    """
    Phase 9 Scientific Regression Requirement:
    Ensure production implementation perfectly matches the Phase 6 formula:
        T_B2 = T_reference - 0.0065 * (target_elevation - reference_elevation)
    """

    @pytest.mark.parametrize(
        "ref_temp, target_elev, ref_elev, expected_b2",
        [
            # target > ref (cooling)
            (30.0, 500.0, 0.0, 30.0 - 0.0065 * 500.0),
            # target < ref (warming)
            (20.0, 0.0, 1000.0, 20.0 - 0.0065 * -1000.0),
            # target == ref (no change)
            (15.5, 333.3, 333.3, 15.5),
            # negative elevations (e.g. death valley)
            (40.0, -80.0, 100.0, 40.0 - 0.0065 * -180.0),
        ]
    )
    def test_b2_regression_matches_phase6_formula(self, ref_temp, target_elev, ref_elev, expected_b2):
        engine = BaselineLapseRate()
        records = [_make_record(ref_temp)]
        ctx = {
            "target_elevation_m": target_elev,
            "reference_elevation_m": ref_elev,
        }
        
        result = engine.apply(records, ctx)
        loc_temp = result["values"][0]["temperature"]
        
        # Rounding logic in B2 is to 2 decimal places for temperature.
        assert abs(loc_temp - round(expected_b2, 2)) <= 1e-6, (
            f"Regression failed! Expected ~{expected_b2:.4f}, got {loc_temp}. "
            "The physical formulation has been altered!"
        )
