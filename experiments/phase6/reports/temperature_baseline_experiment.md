# Phase 6: Controlled Temperature Baseline Experiment

> **IMPORTANT:** Initial controlled pilot — superseded for model-selection purposes by the expanded Phase 6 validation.

## 1. Objective
Evaluate the effectiveness of an elevation-based physical correction (Baseline 2) against the raw uncorrected GFS 2m temperature forecast (Baseline 0) in a limited pilot setting.

## 2. Dataset
- **N_pairs**: 84
- **N_stations**: 2 (43063099999, 43003099999)
- **Dates**: 2023-01-01T12:00:00 to 2023-01-09T00:00:00
- **Lead Times**: 12, 24, 36 hours

## 3. Definitions
- **Baseline 0**: `T_B0 = T_GFS` (Raw GFS 2m Temperature)
- **Baseline 2**: `T_B2 = T_B0 - Gamma * (z_station - z_reference)`
- **Gamma**: `0.0065` °C/m (Standard Environmental Lapse Rate)
- **z_station**: Real station elevation from NOAA ISD (`station_elevation_m`)
- **z_reference**: GFS grid surface elevation from GRIB2 `orog` (`gfs_reference_elevation_m`)

## 4. Overall Metrics
| Metric | Baseline 0 | Baseline 2 | Difference (B0 - B2) |
|---|---|---|---|
| MAE | 2.217 | 2.387 | -0.171 |
| RMSE | 2.693 | 2.923 | -0.229 |
| Bias | 0.061 | 0.418 | -0.356 |
| Median AE | 2.360 | 2.371 | -0.011 |

## 5. Stratified Metrics: By Station
### Station 43063099999
- **MAE B0**: 2.013 | **MAE B2**: 2.338 (Diff: -0.325)
- **Bias B0**: 1.168 | **Bias B2**: 1.948 (Diff: -0.780)

### Station 43003099999
- **MAE B0**: 2.420 | **MAE B2**: 2.436 (Diff: -0.016)
- **Bias B0**: -1.045 | **Bias B2**: -1.113 (Diff: 0.068)

## 6. Stratified Metrics: By Lead Time
### Lead Time 12h
- **MAE B0**: 2.181 | **MAE B2**: 2.348 (Diff: -0.167)

### Lead Time 24h
- **MAE B0**: 2.223 | **MAE B2**: 2.344 (Diff: -0.121)

### Lead Time 36h
- **MAE B0**: 2.246 | **MAE B2**: 2.470 (Diff: -0.224)

## 7. Useful vs Harmful Corrections
Threshold: 0.2 °C
- **USEFUL**: 12 (14.3%)
- **HARMFUL**: 30 (35.7%)
- **NEUTRAL**: 42 (50.0%)

## 7. Analysis & Plausible Causes

Baseline 2 degraded performance in this limited January two-station pilot. Boundary-layer effects such as inversion/cold-air pooling are plausible contributing factors, but the pilot is insufficient to establish causality.

### 7.1 The Inversion Hypothesis
During winter nights and early mornings, the boundary layer often decouples. Cold air pools at the surface. 
The GFS grid cell, representing a 25km average, might have a surface elevation of 600m. The observation station might be in a valley at 550m.
A standard lapse rate assumes temperature increases as you go down into the valley (0.0065°C/m * 50m = +0.325°C).
However, if an inversion is present, the valley floor is actually *colder* than the air above it. The correction adds heat when it should be subtracting it.

### 7.2 The Limit of Fixed Corrections
This pilot demonstrates that a single uniform physical correction coefficient is not universally applicable across varying weather regimes and diurnal cycles.

## 8. Decision Gate Assessment

**Overall Performance**: MAE degrades from 2.217°C to 2.387°C.
**Correction Profile**: 10.7% useful vs 35.7% harmful.

**DECISION OUTCOME**: NO-GO.
Fixed lapse-rate correction is not justified as a general production correction from this pilot.

*(Note: This initial pilot NO-GO decision was superseded by the subsequent expanded Phase 6 validation which demonstrated overall improvement across a much larger 1,660-pair dataset. See `expanded_baseline_comparison.md`.)*
