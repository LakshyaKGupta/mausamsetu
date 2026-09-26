import pytest
import datetime
from app.providers.open_meteo import OpenMeteoProvider
from pytest_httpx import HTTPXMock
import httpx

@pytest.mark.asyncio
async def test_open_meteo_success(httpx_mock: HTTPXMock):
    provider = OpenMeteoProvider()
    
    # Mock response
    now = datetime.datetime.now(datetime.timezone.utc)
    mock_data = {
        "hourly": {
            "time": [now.isoformat()],
            "temperature_2m": [25.5],
            "precipitation": [0.0],
            "relative_humidity_2m": [60],
            "wind_speed_10m": [10.5],
            "wind_direction_10m": [180]
        }
    }
    
    httpx_mock.add_response(json=mock_data)
    
    forecasts = await provider.get_forecast(lat=18.5, lon=73.8, panchayat_id=1)
    
    assert len(forecasts) == 1
    f = forecasts[0]
    assert f.panchayat_id == 1
    assert f.temperature == 25.5
    assert f.precipitation == 0.0
    assert f.humidity == 60
    assert f.wind_speed == 10.5
    assert f.wind_direction == 180
    assert f.provenance["provider"] == "Open-Meteo"
    assert round(f.lead_time_hours, 1) == 0.0

@pytest.mark.asyncio
async def test_open_meteo_timeout(httpx_mock: HTTPXMock):
    provider = OpenMeteoProvider()
    httpx_mock.add_exception(httpx.TimeoutException("Timeout"))
    
    with pytest.raises(Exception, match="Weather provider timeout"):
        await provider.get_forecast(lat=18.5, lon=73.8, panchayat_id=1)

@pytest.mark.asyncio
async def test_open_meteo_missing_fields(httpx_mock: HTTPXMock):
    provider = OpenMeteoProvider()
    httpx_mock.add_response(json={"hourly": {}})
    
    with pytest.raises(Exception, match="Missing required fields from provider"):
        await provider.get_forecast(lat=18.5, lon=73.8, panchayat_id=1)
