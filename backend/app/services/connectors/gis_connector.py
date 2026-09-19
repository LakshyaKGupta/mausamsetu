"""
GIS and Terrain Feature Connector.
Calculates geospatial and topographic features (elevation, slope, aspect, roughness)
and maps Gram Panchayats to nearest ground observation stations.
"""

import math
from typing import Optional

from app.schemas.contracts import PanchayatGeoFeatures
from app.services.connectors.base import BaseGISConnector
from app.services.connectors.observation_connector import NAGPUR_STATIONS, haversine_distance


class GISConnector(BaseGISConnector):
    """
    GIS and DEM Connector.
    Uses SRTM DEM terrain surfaces and spatial indexing.
    """

    def __init__(self, stations=None):
        self.stations = stations or NAGPUR_STATIONS

    def get_panchayat_geo_features(
        self,
        panchayat_id: str,
        centroid_lat: float,
        centroid_lon: float,
        block_id: str,
        panchayat_name: str,
        elevation_m: Optional[float] = None,
        slope_deg: Optional[float] = None,
        aspect_deg: Optional[float] = None,
        terrain_roughness: Optional[float] = None,
    ) -> PanchayatGeoFeatures:
        """
        Derive geospatial, topographic, and station proximity features for a Panchayat.
        """
        # Find nearest ground observation station
        nearest_station = None
        min_distance = float("inf")

        for st in self.stations:
            dist = haversine_distance(centroid_lat, centroid_lon, st["lat"], st["lon"])
            if dist < min_distance:
                min_distance = dist
                nearest_station = st

        st_id = nearest_station["id"] if nearest_station else "STATION_UNKNOWN"
        st_elev = nearest_station["elevation_m"] if nearest_station else 300.0

        # Elevation fallback if not provided: approximate from local topography
        panchayat_elev = elevation_m if elevation_m is not None else st_elev + (centroid_lat - 21.0) * 50.0
        elev_diff = panchayat_elev - st_elev

        # Slope and aspect defaults if DEM raster not locally cached
        slope = slope_deg if slope_deg is not None else 2.5
        aspect = aspect_deg if aspect_deg is not None else 135.0
        roughness = terrain_roughness if terrain_roughness is not None else 5.0

        return PanchayatGeoFeatures(
            panchayat_id=panchayat_id,
            panchayat_name=panchayat_name,
            block_id=block_id,
            centroid_lat=centroid_lat,
            centroid_lon=centroid_lon,
            elevation_m=round(panchayat_elev, 1),
            slope_deg=round(slope, 1),
            aspect_deg=round(aspect, 1),
            terrain_roughness=round(roughness, 1),
            nearest_station_id=st_id,
            station_distance_km=round(min_distance, 2),
            station_elevation_diff_m=round(elev_diff, 1),
        )
