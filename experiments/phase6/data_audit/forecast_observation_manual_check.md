# Phase 6 GFS–ISD Manual Verification

Five records from `phase6_real_gfs_isd_temperature_scaled.csv` have been randomly selected to manually mathematically verify causality and extraction correctness.

## Record 1: Pune (430630) - 12h Lead
- **GFS Cycle (Issue Time)**: `2023-01-01T00:00:00`
- **Lead Time**: 12 hours
- **Valid Time / Obs Time**: `2023-01-01T12:00:00`
- **Observed Temp (ISD)**: 28.8 °C
- **Forecast Temp (GRIB2)**: 26.94 °C
- **Station Elevation**: 558.0 m
- **GFS Reference Elevation**: 677.98 m
- **Causality Check**: `2023-01-01T00:00` strictly precedes `2023-01-01T12:00`. (PASS)

## Record 2: Mumbai (430030) - 12h Lead
- **GFS Cycle (Issue Time)**: `2023-01-01T00:00:00`
- **Lead Time**: 12 hours
- **Valid Time / Obs Time**: `2023-01-01T12:00:00`
- **Observed Temp (ISD)**: 26.0 °C
- **Forecast Temp (GRIB2)**: 23.83 °C
- **Station Elevation**: 11.27 m
- **GFS Reference Elevation**: 0.86 m
- **Causality Check**: `2023-01-01T00:00` strictly precedes `2023-01-01T12:00`. (PASS)

## Record 3: Pune (430630) - 24h Lead
- **GFS Cycle (Issue Time)**: `2023-01-01T00:00:00`
- **Lead Time**: 24 hours
- **Valid Time / Obs Time**: `2023-01-02T00:00:00`
- **Observed Temp (ISD)**: 12.0 °C
- **Forecast Temp (GRIB2)**: 17.37 °C
- **Station Elevation**: 558.0 m
- **GFS Reference Elevation**: 677.98 m
- **Causality Check**: `2023-01-01T00:00` strictly precedes `2023-01-02T00:00`. (PASS)

## Record 4: Mumbai (430030) - 36h Lead
- **GFS Cycle (Issue Time)**: `2023-01-02T12:00:00`
- **Lead Time**: 36 hours
- **Valid Time / Obs Time**: `2023-01-04T00:00:00`
- **Observed Temp (ISD)**: 18.2 °C
- **Forecast Temp (GRIB2)**: 22.03 °C
- **Station Elevation**: 11.27 m
- **GFS Reference Elevation**: 0.86 m
- **Causality Check**: `2023-01-02T12:00` strictly precedes `2023-01-04T00:00`. (PASS)

## Record 5: Pune (430630) - 12h Lead
- **GFS Cycle (Issue Time)**: `2023-01-07T12:00:00`
- **Lead Time**: 12 hours
- **Valid Time / Obs Time**: `2023-01-08T00:00:00`
- **Observed Temp (ISD)**: 14.8 °C
- **Forecast Temp (GRIB2)**: 18.06 °C
- **Station Elevation**: 558.0 m
- **GFS Reference Elevation**: 677.98 m
- **Causality Check**: `2023-01-07T12:00` strictly precedes `2023-01-08T00:00`. (PASS)
