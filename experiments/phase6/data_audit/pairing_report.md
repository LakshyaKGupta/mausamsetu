# Phase 6 Pairing Report: Real GFS–ISD

## Methodology
Instead of bulk-downloading terabytes of raw GRIB2 files, we optimized the AWS PDS retrieval pipeline. The script parses the `.idx` byte-offset files and utilizes HTTP `Range` requests to strictly download ONLY the `TMP` (2-meter temperature) and `HGT` (surface orography) arrays. 
This reduced payload sizes from ~375MB to ~3MB per forecast cycle, unlocking rapid processing in the experimental sandbox.

## Pairing Metrics
- **Forecast Source**: AWS Open Data (`noaa-gfs-bdp-pds`), strict 0.25-degree GRIB2.
- **Observation Source**: NOAA ISD (NCEI Global Hourly).
- **Tolerance**: 0 hours. We strictly matched `00z` and `12z` observations directly to the target `forecast_valid_time`.

## Lead Time Distribution
For each of the 7 days (Jan 1 to Jan 7, 2023) across 2 cycles (`00z`, `12z`), we extracted:
- **12-hour lead time**: 28 pairs
- **24-hour lead time**: 28 pairs
- **36-hour lead time**: 28 pairs
- **Total Pairs**: 84 pairs

## Rejection Categories
- **Observation missing**: 0 
- **Observation QC fail**: 0
- **GFS fetch fail**: 0

## Scientific Viability Conclusion
The dataset perfectly pairs the GFS prediction to the exact valid physical observation while guaranteeing that the forecast was strictly issued *prior* to the observation time. We are now scientifically ready to evaluate Baseline 0 and Baseline 2.
