"""
Elevation abstraction layer — base types.

Defines the ElevationResult dataclass and the ElevationProvider abstract base class.
All concrete elevation providers must implement ElevationProvider.

Provenance conventions
----------------------
source   : human-readable dataset name, e.g. "Open-Meteo Elevation API (SRTM 90m)"
provider : short machine key, e.g. "open_meteo"

Scientific note
---------------
Phase 9 uses the Open-Meteo Elevation API (SRTM 90m) as the sole approved source
for *target* (Panchayat) elevation lookup.
The *reference* elevation is extracted from the Open-Meteo forecast response itself
and is NOT obtained via this provider.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


class ElevationProviderError(Exception):
    """Raised when an ElevationProvider cannot return a valid elevation."""


@dataclass
class ElevationResult:
    """
    The result of a single-point elevation lookup.

    Fields
    ------
    elevation_m : float
        Terrain elevation in metres above mean sea level (SRTM AMSL).
        Positive = above sea level; negative = below (rare coastal/delta areas).
    latitude : float
        Latitude at which elevation was evaluated (may differ slightly from
        the requested coordinate due to DEM grid snapping).
    longitude : float
        Longitude at which elevation was evaluated.
    source : str
        Human-readable dataset description, e.g. "Open-Meteo Elevation API (SRTM 90m)".
    provider : str
        Short machine-readable key identifying the provider implementation,
        e.g. "open_meteo".
    retrieved_at : str
        ISO-8601 UTC timestamp of when the value was obtained from the provider.
        For cached results this is the time of the original fetch.
    is_valid : bool
        True if elevation_m is a genuine provider-returned value.
        False must NEVER be silently paired with a fallback numeric value;
        callers must treat is_valid=False as an absence of data.
    is_cached : bool
        True if the value was served from the local cache (not a fresh network request).
    is_stale : bool
        True if the cache entry's TTL has expired and the value was served as a stale
        fallback because the provider was unavailable.  is_stale=True implies is_cached=True.

    Invariant
    ---------
    If is_valid is False, the caller MUST NOT use elevation_m as a real value.
    The field is present for type-system convenience only and must be treated as undefined.
    """
    elevation_m: float
    latitude: float
    longitude: float
    source: str
    provider: str
    retrieved_at: str
    is_valid: bool
    is_cached: bool = field(default=False)
    is_stale: bool = field(default=False)


class ElevationProvider(ABC):
    """Abstract interface for point-elevation lookup."""

    @abstractmethod
    async def get_elevation(self, latitude: float, longitude: float) -> ElevationResult:
        """
        Return the terrain elevation for a given point.

        Parameters
        ----------
        latitude : float   Decimal degrees, WGS-84 (-90 to +90).
        longitude : float  Decimal degrees, WGS-84 (-180 to +180).

        Returns
        -------
        ElevationResult with is_valid=True on success.

        Raises
        ------
        ElevationProviderError
            On any network, timeout, parse, or validation failure.
            Callers must NOT silently catch this and substitute a fabricated elevation.
        ValueError
            On obviously invalid coordinates (out-of-range lat/lon).
        """
