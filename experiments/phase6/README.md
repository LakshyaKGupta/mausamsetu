# Phase 6: Scientific Experimentation & Model Selection

## Status: BLOCKED AT DATA VIABILITY GATE

Phase 6 aims to identify the optimal scientific transformation to downscale reference weather forecasts to the Panchayat level. 

Per the project's strict rules against fabricating data or simulating observations to demonstrate ML pipelines, this phase was explicitly stopped. 

### Data Audit Findings
1. **Target Elevations (`z_target`)**: Missing. The geographic database only contains simple lat/lon points, not true Panchayat polygons mapping to a Digital Elevation Model (DEM).
2. **Reference Elevations (`z_reference`)**: Open-Meteo API provides point elevation, but without `z_target`, a physical lapse-rate comparison is impossible.
3. **Historical Target Observations**: **Missing entirely**. We do not have Automatic Weather Station (AWS) data, rain gauge records, or paired historical datasets.

### Required Future Data
To unblock Phase 6 and conduct defensible statistical ML or physical baseline downscaling (Baselines 1-4 and Models A/B), the following data schemas must be successfully ingested:

1. **Station Observation History**:
   - `station_id`, `lat`, `lon`, `elevation`
   - Continuous hourly records of `temperature` and `precipitation`.
2. **Paired Reference Forecasts (Hindcasts)**:
   - Historical NWP predictions exactly aligning with the observation timeline.
3. **Panchayat Digital Elevation Model (DEM)**:
   - High-resolution gridded elevation data mapping to true Panchayat bounding boxes.

### Conclusion
Until real validation targets are obtained, no downscaling models (Random Forest, XGBoost) will be trained, and no artificial performance tables will be manufactured. The system continues to use **Baseline 0 (Raw Reference Mapping)**.
