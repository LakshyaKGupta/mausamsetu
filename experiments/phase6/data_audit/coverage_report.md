# Phase 6 Data Coverage Report

## Summary
The current verified data sources do not provide sufficient coverage to build a paired (forecast + observation) dataset for Panchayat-level localization.

## Observation Data Coverage
- **IMD AWS Portal**: 0 stations retrieved (Connection timeout / no API available).
- **NOAA ISD (Global Hourly)**: Sparse coverage. Focuses heavily on major synoptic stations and airports (e.g., Pune Airport). This is insufficient to validate block-level or Panchayat-level agricultural weather.
- **Total Valid Indian Agricultural Stations Available**: 0.

## Historical Forecast Coverage
- **Hindcast Availability**: 0 days. We were unable to identify a free, accessible archive of historical forecasts (e.g., GFS or ECMWF) that explicitly preserves the `issue_time` required for a true hindcast experiment.
- **Reanalysis Availability**: Open-Meteo ERA5 archive is available but is mathematically classified as *Reanalysis*, not *Hindcast*. It cannot be used as the input for a predictive model evaluation without introducing massive leakage.

## Dataset Statistics
- **Total Stations**: 0 suitable rural stations.
- **Total Paired Samples**: 0.
- **Missingness**: 100% missing for the exact target criteria.
