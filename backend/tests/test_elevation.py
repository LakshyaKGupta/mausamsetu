"""
Unit tests for the Elevation integration module (Phase 9).

Covers:
1. OpenMeteoElevationProvider (network, timeout, malformed, success).
2. ElevationCache (hit, expiry, failure protection, staleness).
3. ElevationService (orchestration, fallback).
4. Weather API route integration (automatic B2, B0 fallback).
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import datetime
from httpx import Response, HTTPStatusError, Request

from app.elevation.base import ElevationResult, ElevationProviderError
from app.elevation.open_meteo_elevation import OpenMeteoElevationProvider
from app.elevation.cache import ElevationCache
from app.elevation.service import ElevationService
from app.models.weather import ForecastRecord
from app.models.location import Panchayat


# ── 1. OpenMeteoElevationProvider ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_provider_valid_response():
    provider = OpenMeteoElevationProvider()
    mock_data = {"elevation": [561.0]}
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock(spec=Response)
        mock_resp.json.return_value = mock_data
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        
        result = await provider.get_elevation(18.5204, 73.8567)
        
        assert result.is_valid is True
        assert result.elevation_m == 561.0
        assert result.latitude == 18.5204
        assert result.longitude == 73.8567
        assert result.source == "Open-Meteo Elevation API (SRTM 90m)"


@pytest.mark.asyncio
async def test_provider_malformed_response():
    provider = OpenMeteoElevationProvider()
    
    # Missing 'elevation' key entirely
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock(spec=Response)
        mock_resp.json.return_value = {"error": True}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        
        with pytest.raises(ElevationProviderError, match="malformed response"):
            await provider.get_elevation(18.5, 73.8)


@pytest.mark.asyncio
async def test_provider_http_error():
    provider = OpenMeteoElevationProvider()
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock(spec=Response)
        mock_resp.status_code = 500
        request = Request("GET", "https://test")
        error = HTTPStatusError("Server Error", request=request, response=mock_resp)
        mock_resp.raise_for_status.side_effect = error
        mock_get.return_value = mock_resp
        
        with pytest.raises(ElevationProviderError, match="HTTP 500"):
            await provider.get_elevation(18.5, 73.8)


@pytest.mark.asyncio
async def test_provider_invalid_coordinates():
    provider = OpenMeteoElevationProvider()
    with pytest.raises(ValueError, match="out of valid range"):
        await provider.get_elevation(100.0, 73.8)  # lat > 90


@pytest.mark.asyncio
async def test_provider_non_numeric_elevation():
    provider = OpenMeteoElevationProvider()
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = AsyncMock(spec=Response)
        mock_resp.json.return_value = {"elevation": ["high"]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        
        with pytest.raises(ElevationProviderError, match="non-numeric elevation"):
            await provider.get_elevation(18.5, 73.8)


# ── 2. ElevationCache ──────────────────────────────────────────────────────

def _dummy_result(elev: float = 100.0) -> ElevationResult:
    return ElevationResult(
        elevation_m=elev,
        latitude=10.0,
        longitude=20.0,
        source="test",
        provider="test",
        retrieved_at="2026-09-20T00:00:00Z",
        is_valid=True
    )


def test_cache_hit_and_miss():
    cache = ElevationCache()
    assert cache.get(10.0, 20.0) is None
    
    cache.set(10.0, 20.0, _dummy_result(250.0))
    hit = cache.get(10.0, 20.0)
    assert hit is not None
    assert hit.elevation_m == 250.0
    assert hit.is_cached is True
    assert hit.is_stale is False


def test_cache_expiry_staleness():
    cache = ElevationCache(ttl_days=0)  # Immediately expire
    cache.set(10.0, 20.0, _dummy_result(250.0))
    
    hit = cache.get(10.0, 20.0)
    assert hit is not None
    assert hit.is_cached is True
    assert hit.is_stale is True  # Should be marked stale


def test_cache_provider_failure_protection():
    cache = ElevationCache()
    invalid_result = ElevationResult(
        elevation_m=0.0,
        latitude=10.0,
        longitude=20.0,
        source="test",
        provider="test",
        retrieved_at="",
        is_valid=False  # Invalid
    )
    with pytest.raises(ValueError, match="is_valid=True"):
        cache.set(10.0, 20.0, invalid_result)


# ── 3. ElevationService ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_service_live_fetch():
    mock_provider = AsyncMock()
    mock_provider.get_elevation.return_value = _dummy_result(300.0)
    cache = ElevationCache()
    service = ElevationService(provider=mock_provider, cache=cache)
    
    res = await service.get_elevation(10.0, 20.0)
    assert res is not None
    assert res.elevation_m == 300.0
    assert cache.size() == 1


@pytest.mark.asyncio
async def test_service_stale_cache_on_provider_failure():
    mock_provider = AsyncMock()
    mock_provider.get_elevation.side_effect = ElevationProviderError("Failed")
    cache = ElevationCache(ttl_days=0)  # Immediately stale
    cache.set(10.0, 20.0, _dummy_result(400.0))
    
    service = ElevationService(provider=mock_provider, cache=cache)
    res = await service.get_elevation(10.0, 20.0)
    
    assert res is not None
    assert res.elevation_m == 400.0
    assert res.is_stale is True


@pytest.mark.asyncio
async def test_service_provider_failure_with_no_cache():
    mock_provider = AsyncMock()
    mock_provider.get_elevation.side_effect = ElevationProviderError("Failed")
    cache = ElevationCache()
    
    service = ElevationService(provider=mock_provider, cache=cache)
    res = await service.get_elevation(10.0, 20.0)
    
    assert res is None


# ── 4. Weather API Integration ─────────────────────────────────────────────

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.providers.base import NormalizedForecast
from app.api.weather import provider as weather_provider

def _mock_forecast(panchayat_id: int):
    now = datetime.datetime.now(datetime.timezone.utc)
    return [
        NormalizedForecast(
            panchayat_id=panchayat_id,
            issue_time=now,
            valid_time=now + datetime.timedelta(hours=i),
            temperature=25.0,
            precipitation=0.0,
            humidity=50,
            wind_speed=10.0,
            wind_direction=180,
            provenance={
                "reference_elevation_m": 600.0,
                "reference_elevation_source": "Forecast Response"
            }
        )
        for i in range(24)
    ]


@pytest.mark.asyncio
async def test_weather_api_automatic_b2():
    """Test full automatic elevation integration resulting in B2_APPLIED.

    The weather API reads reference_elevation_m from persisted ForecastRecord
    provenance in the DB. This test provides mock ForecastRecord objects with
    the expected provenance to ensure test isolation from any live DB cache.
    """
    import json
    from unittest.mock import MagicMock, AsyncMock, patch
    from app.models.weather import ForecastRecord

    mock_elevation_service = AsyncMock()
    mock_elevation_service.get_elevation.return_value = _dummy_result(400.0)

    now = datetime.datetime.now(datetime.timezone.utc)

    # Build mock ForecastRecord objects with provenance carrying reference_elevation_m=600.0
    def _make_mock_record(i: int):
        r = MagicMock(spec=ForecastRecord)
        r.panchayat_id = 1
        r.issue_time = now
        r.valid_time = now + datetime.timedelta(hours=i)
        r.temperature = 25.0
        r.precipitation = 0.0
        r.humidity = 50
        r.wind_speed = 10.0
        r.wind_direction = 180
        r.provenance = {"reference_elevation_m": 600.0, "reference_elevation_source": "Forecast Response"}
        return r

    mock_records = [_make_mock_record(i) for i in range(24)]

    # Create a mock async DB session that returns our controlled data
    mock_scalars_issue = MagicMock()
    mock_scalars_issue.first.return_value = now  # latest_issue_time — fresh, so no refetch
    mock_execute_issue = MagicMock()
    mock_execute_issue.scalars.return_value = mock_scalars_issue

    mock_scalars_source = MagicMock()
    mock_source = MagicMock()
    mock_source.id = 1
    mock_scalars_source.first.return_value = mock_source
    mock_execute_source = MagicMock()
    mock_execute_source.scalars.return_value = mock_scalars_source

    mock_scalars_records = MagicMock()
    mock_scalars_records.all.return_value = mock_records
    mock_execute_records = MagicMock()
    mock_execute_records.scalars.return_value = mock_scalars_records

    mock_scalars_panchayat = MagicMock()
    panchayat_row = MagicMock()
    panchayat_obj = MagicMock()
    panchayat_obj.id = 1
    panchayat_obj.lat = 18.533
    panchayat_obj.lon = 73.85
    panchayat_obj.name = "Test Panchayat"
    block_obj = MagicMock()
    block_obj.name = "Test Block"
    district_obj = MagicMock()
    district_obj.name = "Test District"
    state_obj = MagicMock()
    state_obj.name = "Maharashtra"
    panchayat_row.__iter__ = MagicMock(return_value=iter([panchayat_obj, block_obj, district_obj, state_obj]))
    mock_scalars_panchayat.first.return_value = panchayat_row

    execute_call_count = [0]

    async def mock_execute(stmt, *args, **kwargs):
        execute_call_count[0] += 1
        call_num = execute_call_count[0]
        if call_num == 1:
            # Panchayat lookup
            result = MagicMock()
            result.first.return_value = (panchayat_obj, block_obj, district_obj, state_obj)
            return result
        elif call_num == 2:
            # ForecastSource lookup
            return mock_execute_source
        elif call_num == 3:
            # Latest issue_time check
            return mock_execute_issue
        else:
            # ForecastRecord load
            return mock_execute_records

    mock_db = AsyncMock()
    mock_db.execute = mock_execute

    async def override_get_db():
        yield mock_db

    from app.main import app
    from app.database.session import get_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        with patch("app.api.weather.elevation_service", mock_elevation_service):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.get("/api/panchayat/1/forecast")
                assert resp.status_code == 200
                data = resp.json()

                assert data["downscaling_method"] == "B2_APPLIED"
                assert data["downscaling_elevation_inputs_used"] is True
                prov = data["elevation_provenance"]
                assert prov["reference_elevation_m"] == 600.0
                assert prov["target_elevation_m"] == 400.0
                assert prov["target_elevation_source"] == "test"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_weather_api_b0_fallback_elevation_unavailable():
    """Test fallback to B0 when target elevation cannot be obtained."""
    mock_service = AsyncMock()
    mock_service.get_elevation.return_value = None  # Force failure
    
    with patch("app.api.weather.elevation_service", mock_service):
        with patch.object(weather_provider, "get_forecast", return_value=_mock_forecast(1)):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.get("/api/panchayat/1/forecast")
                data = resp.json()
                
                assert data["downscaling_method"] == "B0_FALLBACK_ELEVATION_UNAVAILABLE"
                assert data["downscaling_elevation_inputs_used"] is False
                assert "missing: target_elevation_m" in data["localized_estimate"]["b2_fallback_reason"]


@pytest.mark.asyncio
async def test_weather_api_manual_override():
    """Test that manual query params override automatic lookups."""
    mock_service = AsyncMock()
    mock_service.get_elevation.return_value = _dummy_result(400.0)
    
    with patch("app.api.weather.elevation_service", mock_service):
        with patch.object(weather_provider, "get_forecast", return_value=_mock_forecast(1)):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                # But we supply manual overrides:
                resp = await client.get("/api/panchayat/1/forecast?target_elevation_m=800&reference_elevation_m=300")
                data = resp.json()
                
                assert data["downscaling_method"] == "B2_APPLIED"
                prov = data["elevation_provenance"]
                assert prov["reference_elevation_m"] == 300.0  # From query
                assert prov["target_elevation_m"] == 800.0     # From query
                assert prov["reference_elevation_source"] == "manual_query_parameter"
                assert prov["target_elevation_source"] == "manual_query_parameter"
