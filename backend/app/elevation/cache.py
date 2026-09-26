"""
In-memory TTL cache for elevation results.

Design decisions
----------------
- Key:  (round(lat, 4), round(lon, 4))
        4 decimal places ≈ 11 m precision — sufficient for matching Panchayat
        coordinates across requests without per-metre key explosion.
- TTL:  30 days (terrain does not change on human timescales).
- Provider failures must NEVER overwrite valid cached entries.
- An expired entry may be served as a stale fallback when the provider is
  unreachable, with is_stale=True and is_cached=True on the result.
- No fabricated fallback: if no cache entry exists and provider fails,
  the cache returns None.
- Thread safety: a simple dict is sufficient for the single-process async
  server. asyncio's event loop is single-threaded; no locking is needed.

Persistence
-----------
This cache is in-memory only. On server restart all entries are lost.
A fresh provider lookup on the next request is correct behavior.
A persistent on-disk cache (e.g. SQLite) is deferred to Phase 10 if needed.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple

from app.elevation.base import ElevationResult

logger = logging.getLogger(__name__)

# 30-day TTL: terrain elevation is effectively static.
_DEFAULT_TTL_DAYS = 30

# Key precision: 4 decimal places ≈ 11 m spatial resolution.
_KEY_PRECISION = 4

# Internal cache entry type.
_CacheKey = Tuple[float, float]

class _CacheEntry:
    __slots__ = ("result", "inserted_at")

    def __init__(self, result: ElevationResult) -> None:
        self.result: ElevationResult = result
        self.inserted_at: datetime = datetime.now(timezone.utc)


class ElevationCache:
    """
    Simple in-memory TTL cache for ElevationResult objects.

    Usage
    -----
        cache = ElevationCache()
        entry = cache.get(lat, lon)   # None if not found
        cache.set(lat, lon, result)   # stores a fresh result
    """

    def __init__(self, ttl_days: int = _DEFAULT_TTL_DAYS) -> None:
        self._ttl: timedelta = timedelta(days=ttl_days)
        self._store: Dict[_CacheKey, _CacheEntry] = {}

    # ── Public API ─────────────────────────────────────────────────────────

    def get(self, latitude: float, longitude: float) -> Optional[ElevationResult]:
        """
        Return a cached ElevationResult, or None if no entry exists.

        If the entry's TTL has expired it is returned with:
            is_stale = True
            is_cached = True

        The caller is responsible for deciding whether to use a stale value
        (typically: only if the provider is currently unavailable).

        Returns None if no entry has ever been stored for this coordinate.
        """
        key = self._make_key(latitude, longitude)
        entry = self._store.get(key)
        if entry is None:
            return None

        age = datetime.now(timezone.utc) - entry.inserted_at
        is_stale = age > self._ttl

        # Return a copy with the cache/staleness flags set correctly.
        return ElevationResult(
            elevation_m=entry.result.elevation_m,
            latitude=entry.result.latitude,
            longitude=entry.result.longitude,
            source=entry.result.source,
            provider=entry.result.provider,
            retrieved_at=entry.result.retrieved_at,
            is_valid=entry.result.is_valid,
            is_cached=True,
            is_stale=is_stale,
        )

    def set(self, latitude: float, longitude: float, result: ElevationResult) -> None:
        """
        Store a fresh ElevationResult.

        IMPORTANT: Only store if is_valid=True. A provider failure must NOT
        overwrite an existing valid cached entry — callers must not call this
        method with an invalid result.

        Raises ValueError if called with is_valid=False (programming error guard).
        """
        if not result.is_valid:
            raise ValueError(
                "ElevationCache.set() must only be called with is_valid=True results. "
                "Do not overwrite valid cached data with a provider failure."
            )
        key = self._make_key(latitude, longitude)
        self._store[key] = _CacheEntry(result)
        logger.debug("Cached elevation %.1f m for key %s", result.elevation_m, key)

    def clear(self) -> None:
        """Remove all entries. Intended for testing only."""
        self._store.clear()

    def size(self) -> int:
        """Return the number of stored entries."""
        return len(self._store)

    # ── Internal ───────────────────────────────────────────────────────────

    @staticmethod
    def _make_key(latitude: float, longitude: float) -> _CacheKey:
        return (round(latitude, _KEY_PRECISION), round(longitude, _KEY_PRECISION))
