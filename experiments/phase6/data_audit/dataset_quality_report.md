# Phase 6 Dataset Quality Report: Scaled GFS–ISD

**Date Range**: 2023-01-01 to 2023-01-07
**Stations Assessed**: 
- 430630 (Pune, Synoptic/Airport)
- 430030 (Mumbai Santacruz, Synoptic/Airport)

## Record Statistics
- **Total Valid GFS Forecast Cells Assessed**: 84 (42 GRIB2 cycles × 2 stations)
- **Total Observations Missing**: 0
- **Total QC Failures (Non 1 or 5)**: 0
- **Total Valid Pairs Generated**: 84
- **Rejected Pairs**: 0

## Schema Compliance
- `station_id`: 100% complete
- `observation_time`: 100% complete
- `forecast_valid_time`: 100% complete
- `observed_temperature_c`: 100% complete
- `gfs_temperature_c`: 100% complete
- `station_elevation_m`: 100% complete (Derived strictly from real NOAA ISD standard metadata)
- `gfs_reference_elevation_m`: 100% complete (Derived strictly from native GRIB2 surface `orog` variable)
- `elevation_difference_m`: 100% complete

## Geographical Completeness
- Grid extraction via Nearest Neighbor.
- Pune ($\Delta Z$ = -119.98 m)
- Mumbai ($\Delta Z$ = 10.41 m)

## Limitations
- Only two stations represent the sample, focusing on pipeline viability rather than whole-state accuracy.
- Stations are synoptic/airports, not rural panchayats.
