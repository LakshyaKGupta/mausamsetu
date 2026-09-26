"""
ElevationService — orchestrates cache + provider for target elevation lookup.

This is the only entry point that the weather API route should use
for obtaining the target (Panchayat) elevation.

Lookup logic
------------
1. Check cache.
   - If a non-stale valid entry exists → return it immediately.
2. Attempt live provider lookup.
   - On success → store in cache and return fresh result.
   - On failure → if stale cached entry exists → return stale entry with warning.
   - On failure → if no cache entry at all → return None (caller must fall back to B0).

Contract
--------
- This service NEVER fabricates an elevation value.
- This service NEVER returns is_valid=False silently paired with a numeric value.
- Return of None means "elevation unavailable — use B0 fallback".
- Return of ElevationResult with is_stale=True means "provider unavailable,
  serving previous value; accuracy unaffected because terrain is static".
"""

import logging
from typing import Optional

from app.elevation.base import ElevationProvider, ElevationProviderError, ElevationResult
from app.elevation.cache import ElevationCache
from app.elevation.open_meteo_elevation import OpenMeteoElevationProvider

logger = logging.getLogger(__name__)


class ElevationService:
    """
    High-level service for target (Panchayat) elevation lookup.

    Typical use in the weather API route:
        result = await elevation_service.get_elevation(panchayat.lat, panchayat.lon)
        if result is None:
            # Fall back to B0
        else:
            target_elevation_m = result.elevation_m
    """

    def __init__(
        self,
        provider: Optional[ElevationProvider] = None,
        cache: Optional[ElevationCache] = None,
    ) -> None:
        self._provider: ElevationProvider = provider or OpenMeteoElevationProvider()
        self._cache: ElevationCache = cache or ElevationCache()

    async def get_elevation(
        self, latitude: float, longitude: float
    ) -> Optional[ElevationResult]:
        """
        Return the terrain elevation for the given point.

        Returns
        -------
        ElevationResult  if an elevation is available (fresh or stale cache).
        None             if no elevation can be obtained (must trigger B0 fallback).

        The result's is_stale flag distinguishes between a fresh and a stale value.
        """
        # ── 1. Cache check ──────────────────────────────────────────────────
        cached = self._cache.get(latitude, longitude)
        if cached is not None and not cached.is_stale:
            logger.debug(
                "Elevation cache HIT (fresh) for (%.4f, %.4f): %.1f m",
                latitude, longitude, cached.elevation_m,
            )
            return cached

        # ── 2. Live provider lookup ─────────────────────────────────────────
        try:
            fresh = await self._provider.get_elevation(latitude, longitude)
            self._cache.set(latitude, longitude, fresh)
            logger.info(
                "Elevation fetched from provider for (%.4f, %.4f): %.1f m",
                latitude, longitude, fresh.elevation_m,
            )
            return fresh
        except (ElevationProviderError, ValueError) as exc:
            logger.warning(
                "Elevation provider failed for (%.4f, %.4f): %s",
                latitude, longitude, exc,
            )

        # ── 3. Stale fallback ───────────────────────────────────────────────
        if cached is not None and cached.is_stale:
            logger.warning(
                "Serving stale elevation (%.1f m) for (%.4f, %.4f) — provider unavailable.",
                cached.elevation_m, latitude, longitude,
            )
            return cached

        # ── 4. No data at all ───────────────────────────────────────────────
        logger.error(
            "No elevation available for (%.4f, %.4f) — neither cache nor provider.",
            latitude, longitude,
        )
        return None


# Module-level singleton — one cache shared across the lifetime of the process.
# The weather API route imports and uses this directly.
elevation_service = ElevationService()
