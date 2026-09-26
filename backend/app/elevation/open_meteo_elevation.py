"""
Open-Meteo Elevation API provider.

Source:  https://api.open-meteo.com/v1/elevation
Dataset: SRTM (Shuttle Radar Topography Mission) at ~90 m resolution.
License: Open-Meteo free tier; no API key required for reasonable use.

This is the same source verified during Phase 6 source testing
(see experiments/phase6/data_audit/data_sources.json and test_sources.py).

Scientific note
---------------
This provider is used ONLY for *target* (Panchayat) elevation lookup.
The *reference* elevation for the B2 correction comes from the Open-Meteo
forecast API response directly (the `elevation` field of the forecast JSON),
which also reflects the SRTM DEM at the snapped forecast grid point.

Using both from the same underlying dataset (SRTM via Open-Meteo) eliminates
cross-dataset inconsistencies and ensures a consistent reference system
for the B2 elevation difference calculation.

Approved use in Phase 9:
    B2 formula:
        T_B2 = T_openmeteo - GAMMA * (z_panchayat - z_openmeteo_grid)
    where:
        z_panchayat      = this provider (ElevationResult.elevation_m)
        z_openmeteo_grid = Open-Meteo forecast response["elevation"]
        GAMMA            = 0.0065 °C/m

Do NOT use this provider to obtain the reference elevation.
Do NOT substitute a different DEM source.
"""

import logging
from datetime import datetime, timezone

import httpx

from app.elevation.base import ElevationProvider, ElevationProviderError, ElevationResult

logger = logging.getLogger(__name__)

# Validated endpoint from Phase 6 data source verification.
_ELEVATION_API_URL = "https://api.open-meteo.com/v1/elevation"

# Coordinate sanity bounds (WGS-84).
_LAT_MIN, _LAT_MAX = -90.0, 90.0
_LON_MIN, _LON_MAX = -180.0, 180.0


class OpenMeteoElevationProvider(ElevationProvider):
    """
    Concrete ElevationProvider backed by the Open-Meteo SRTM Elevation API.

    Uses asynchronous httpx with a 10-second timeout (matching the forecast provider).
    Raises ElevationProviderError on all failures — never returns a fabricated elevation.
    """

    def __init__(self, timeout_s: float = 10.0) -> None:
        self._timeout = timeout_s

    async def get_elevation(self, latitude: float, longitude: float) -> ElevationResult:
        """
        Query the Open-Meteo Elevation API for a single point.

        Parameters
        ----------
        latitude  : float  Decimal degrees, WGS-84.
        longitude : float  Decimal degrees, WGS-84.

        Returns
        -------
        ElevationResult with is_valid=True and the SRTM elevation.

        Raises
        ------
        ValueError              On out-of-range coordinates.
        ElevationProviderError  On network, timeout, HTTP, or parse failure.
        """
        # ── Coordinate validation ──────────────────────────────────────────
        if not (_LAT_MIN <= latitude <= _LAT_MAX):
            raise ValueError(
                f"Latitude {latitude} is out of valid range [{_LAT_MIN}, {_LAT_MAX}]."
            )
        if not (_LON_MIN <= longitude <= _LON_MAX):
            raise ValueError(
                f"Longitude {longitude} is out of valid range [{_LON_MIN}, {_LON_MAX}]."
            )

        url = f"{_ELEVATION_API_URL}?latitude={latitude}&longitude={longitude}"
        retrieved_at = datetime.now(timezone.utc).isoformat()

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as exc:
            logger.warning("Open-Meteo Elevation API timeout for (%.4f, %.4f)", latitude, longitude)
            raise ElevationProviderError(
                f"Open-Meteo Elevation API timed out after {self._timeout}s."
            ) from exc
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Open-Meteo Elevation API HTTP %s for (%.4f, %.4f)",
                exc.response.status_code, latitude, longitude,
            )
            raise ElevationProviderError(
                f"Open-Meteo Elevation API returned HTTP {exc.response.status_code}."
            ) from exc
        except Exception as exc:
            logger.warning(
                "Open-Meteo Elevation API connection error for (%.4f, %.4f): %s",
                latitude, longitude, exc,
            )
            raise ElevationProviderError(
                f"Open-Meteo Elevation API connection error: {exc}"
            ) from exc

        # ── Parse response ─────────────────────────────────────────────────
        elevation_list = data.get("elevation")
        if not elevation_list or not isinstance(elevation_list, list):
            raise ElevationProviderError(
                "Open-Meteo Elevation API returned malformed response: "
                f"'elevation' field missing or not a list. Got: {data!r}"
            )

        raw_elevation = elevation_list[0]
        if raw_elevation is None:
            raise ElevationProviderError(
                "Open-Meteo Elevation API returned null elevation for "
                f"(lat={latitude}, lon={longitude}). Cannot fabricate a value."
            )

        try:
            elevation_m = float(raw_elevation)
        except (TypeError, ValueError) as exc:
            raise ElevationProviderError(
                f"Open-Meteo Elevation API returned non-numeric elevation: {raw_elevation!r}"
            ) from exc

        return ElevationResult(
            elevation_m=elevation_m,
            latitude=latitude,
            longitude=longitude,
            source="Open-Meteo Elevation API (SRTM 90m)",
            provider="open_meteo",
            retrieved_at=retrieved_at,
            is_valid=True,
            is_cached=False,
            is_stale=False,
        )
