"""
Location models — Phase 15.

Hierarchy: State → District → Block → Panchayat

All official LGD-sourced records have is_test_data = False.
All fields are nullable to accommodate partial data from various sources.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Text
try:
    from geoalchemy2 import Geometry
    GeometryColumn = Geometry('GEOMETRY', srid=4326)
except ImportError:
    GeometryColumn = Text
from app.database.base import Base
from datetime import datetime


class State(Base):
    __tablename__ = "states"
    id = Column(Integer, primary_key=True, index=True)
    lgd_code = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String, unique=True, index=True)
    census_code = Column(Integer, nullable=True)
    status = Column(String, nullable=True)  # Active, Historical, etc.
    source = Column(String, nullable=True, default="LGD")
    source_url = Column(String, nullable=True)
    source_updated_at = Column(DateTime, nullable=True)


class District(Base):
    __tablename__ = "districts"
    id = Column(Integer, primary_key=True, index=True)
    lgd_code = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True)
    census_code = Column(Integer, nullable=True)
    status = Column(String, nullable=True)

    # Approximate centroid for map display (derived from block/panchayat data or geocoding)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    geometry_source = Column(String, nullable=True)  # e.g. "LGD_CENTROID", "OPEN_METEO_GEOCODING_DERIVED"

    # Summary statistics (updated by sync script)
    panchayat_count = Column(Integer, nullable=True)
    weather_coverage_pct = Column(Float, nullable=True)  # 0.0–100.0

    source = Column(String, nullable=True, default="LGD")
    source_url = Column(String, nullable=True)
    source_updated_at = Column(DateTime, nullable=True)


class Block(Base):
    __tablename__ = "blocks"
    id = Column(Integer, primary_key=True, index=True)
    lgd_code = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    census_code = Column(Integer, nullable=True)
    status = Column(String, nullable=True)
    source = Column(String, nullable=True, default="LGD")
    source_url = Column(String, nullable=True)
    source_updated_at = Column(DateTime, nullable=True)


class Panchayat(Base):
    __tablename__ = "panchayats"
    id = Column(Integer, primary_key=True, index=True)
    lgd_code = Column(Integer, unique=True, index=True, nullable=True)
    gpc_code = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), index=True)
    local_body_type = Column(String, nullable=True)  # Gram Panchayat, Nagar Panchayat, etc.
    census_code = Column(Integer, nullable=True)
    status = Column(String, nullable=True)  # Active, Inactive, etc.

    # ── Geography ────────────────────────────────────────────────────────────
    # Point coordinates — may come from official source or derived geocoding
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # PostGIS geometry for spatial queries (SRID 4326)
    geometry = Column(GeometryColumn, nullable=True)

    # Source of geography — NEVER conflate official and derived
    geometry_source = Column(String, nullable=True)
    coordinate_source = Column(String, nullable=True)
    # Examples:
    #   "LGD_OFFICIAL"                    — Directly from LGD portal
    #   "GRAM_MANCHITRA"                  — From Gram Manchitra / Bhuvan
    #   "DERIVED_FROM_OFFICIAL_BOUNDARY"  — Centroid of official polygon
    #   "OPEN_METEO_GEOCODING_DERIVED"    — Derived via name-based geocoding (fallback)
    #   None                              — No geography

    # Geometry status — clearly separates official, derived, and unavailable
    geometry_status = Column(String, nullable=True, default="GEOGRAPHY_UNAVAILABLE")
    # Values:
    #   "OFFICIAL"                  — Authoritative coordinate from official source
    #   "DERIVED_GEOCODING"         — Coordinate from name-based geocoding, labeled as derived
    #   "GEOGRAPHY_REVIEW_REQUIRED" — Geocoding returned ambiguous match
    #   "GEOGRAPHY_UNAVAILABLE"     — No coordinate available from any source

    # Geocoding metadata (when geometry_source is OPEN_METEO_GEOCODING_DERIVED)
    geocoding_matched_name = Column(String, nullable=True)
    geocoding_query = Column(String, nullable=True)
    geocoding_confidence = Column(Float, nullable=True)    # 0.0–1.0 if API provides
    geocoding_retrieved_at = Column(DateTime, nullable=True)

    # Source of URL for the administrative record
    source_url = Column(String, nullable=True)
    source_updated_at = Column(DateTime, nullable=True)

    # ── Weather Availability ──────────────────────────────────────────────────
    # weather_available: set by checking actual provider coverage, NOT merely "has coordinates"
    weather_available = Column(Boolean, nullable=True, default=None)  # None = pending check

    # Overall weather status (set by weather availability check pipeline)
    weather_status = Column(String, nullable=True, default="WEATHER_CHECK_PENDING")
    # Values:
    #   "WEATHER_AVAILABLE"         — Provider confirmed forecast available
    #   "WEATHER_UNAVAILABLE"       — Provider confirmed no coverage
    #   "WEATHER_CHECK_PENDING"     — Not yet checked
    #   "GEOGRAPHY_UNAVAILABLE"     — Cannot check: no coordinates
    #   "PROVIDER_UNAVAILABLE"      — Check attempted but provider was down

    # ── Data Quality ─────────────────────────────────────────────────────────
    data_status = Column(String, nullable=True)  # Legacy field, superseded by geometry_status + weather_status
    is_test_data = Column(Boolean, default=False)

    # Elevation (populated on demand via elevation service)
    elevation_m = Column(Float, nullable=True)
    elevation_source = Column(String, nullable=True)
    elevation_retrieved_at = Column(DateTime, nullable=True)
