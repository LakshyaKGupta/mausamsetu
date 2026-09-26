"""
Open-Meteo forecast provider.

Scientific note — reference elevation
--------------------------------------
The Open-Meteo forecast API returns an `elevation` field in its JSON response.
This value is the SRTM 90m DEM elevation at the snapped forecast grid point —
identical to what the Open-Meteo Elevation API returns for the same coordinate.

Open-Meteo applies an internal NWP-to-SRTM statistical correction, so the
returned `temperature_2m` is already adjusted to this SRTM grid elevation.

Therefore, for Phase 9 B2 integration:
    reference_elevation_m = data["elevation"]  (from this forecast response)
    target_elevation_m    = Open-Meteo Elevation API at Panchayat coordinates

This value is stored in NormalizedForecast.provenance["reference_elevation_m"]
and extracted by the weather API route — no separate reference-elevation lookup
is performed.

Phase 6 vs. production distinction
------------------------------------
Phase 6 used raw NOAA GFS GRIB2 as reference, with GRIB2 native orography
as the reference elevation (~678 m for Pune).  The production Open-Meteo
pipeline uses SRTM (~561 m for Pune).  These are different reference systems.
The Phase 6 MAE benchmark (B2 1.555 °C) was obtained on the GFS-based system
and does NOT directly transfer to the production Open-Meteo pipeline.
B2 status remains: EXPERIMENTAL — GO WITH LIMITATION.
"""

import httpx
import logging
from datetime import datetime, timezone
from typing import List
from app.providers.base import WeatherProvider, NormalizedForecast
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenMeteoProvider(WeatherProvider):
    async def get_forecast(
        self, lat: float, lon: float, panchayat_id: int
    ) -> List[NormalizedForecast]:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&hourly=temperature_2m,precipitation,relative_humidity_2m,"
            f"wind_speed_10m,wind_direction_10m"
        )

        # In a real enterprise tier, we might pass an API key
        headers = {}
        if settings.OPEN_METEO_API_KEY:
            headers["Authorization"] = f"Bearer {settings.OPEN_METEO_API_KEY}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException:
            logger.error("Open-Meteo API timeout")
            raise Exception("Weather provider timeout")
        except httpx.HTTPStatusError as e:
            logger.error(f"Open-Meteo API HTTP error: {e.response.status_code}")
            raise Exception("Weather provider HTTP error")
        except Exception as e:
            logger.error(f"Open-Meteo API error: {str(e)}")
            raise Exception("Weather provider connection error")

        # ── Extract reference elevation from the forecast response ─────────
        # This is the SRTM DEM elevation at the snapped grid point returned by
        # Open-Meteo.  Open-Meteo temperature_2m is already adjusted to this
        # elevation, making it the correct reference elevation for the B2 formula.
        # Verified: Open-Meteo Elevation API returns the identical value for
        # the same snapped coordinate.  See Phase 9 audit for details.
        reference_elevation_m: float | None = data.get("elevation")
        reference_lat: float | None = data.get("latitude")
        reference_lon: float | None = data.get("longitude")

        forecasts = []
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        precips = hourly.get("precipitation", [])
        hums = hourly.get("relative_humidity_2m", [])
        winds = hourly.get("wind_speed_10m", [])
        dirs = hourly.get("wind_direction_10m", [])

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        # Verify required fields exist before assuming
        if not times or not temps:
            raise Exception("Missing required fields from provider")

        for i, time_str in enumerate(times):
            # Open-Meteo returns time in ISO format without timezone
            # but it is UTC if requested (default is timezone=GMT)
            valid_time = datetime.fromisoformat(time_str).replace(tzinfo=timezone.utc)
            forecasts.append(NormalizedForecast(
                panchayat_id=panchayat_id,
                issue_time=now,
                valid_time=valid_time,
                temperature=temps[i],
                precipitation=precips[i],
                humidity=hums[i] if hums and i < len(hums) else None,
                wind_speed=winds[i] if winds and i < len(winds) else None,
                wind_direction=dirs[i] if dirs and i < len(dirs) else None,
                provenance={
                    "provider": "Open-Meteo",
                    "fetched_at": now_iso,
                    # ── Elevation provenance (Phase 9) ──────────────────
                    # reference_elevation_m: SRTM elevation at the snapped
                    # Open-Meteo grid point.  This is the correct reference
                    # elevation for the B2 lapse-rate correction.
                    # Source: top-level "elevation" field of the forecast response.
                    "reference_elevation_m": reference_elevation_m,
                    "reference_latitude": reference_lat,
                    "reference_longitude": reference_lon,
                    "reference_elevation_source": "Open-Meteo forecast response (SRTM 90m)",
                },
            ))
        return forecasts
