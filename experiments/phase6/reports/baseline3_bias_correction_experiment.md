# Phase 6: Historical Bias-Correction Experiment (Baseline 3)

## 1. Objective
Evaluate whether a simple historical mean-bias correction (Baseline 3) improves temperature forecasts beyond raw GFS (Baseline 0) using a strict temporal holdout.

## 2. Dataset Expansion
- **Total Pairs (All Data)**: 892
- **Station Count**: 4
- **Date Range**: 2023-01-01 12:00:00 to 2023-10-09 12:00:00
- **Lead Times**: 12, 24, 36, 48 hours

## 3. Calibration / Validation Split
- **Calibration Period**: January, April, July 2023 (668 pairs)
- **Validation Period**: October 2023 (224 pairs)
- **Leakage Audit**: 
  - Overlapping observation times: 0
  - Causality violations (issue >= valid): 0

## 4. Definitions & Calibration
- **Baseline 0**: `T_B0 = T_GFS`
- **Baseline 3 (Global)**: `T_B3 = T_GFS - bias`
- **Baseline 3 (Lead)**: `T_B3_lead = T_GFS - bias(lead_time)`
- **Global Bias (Calibration)**: 0.321 °C (GFS was on average warmer than observations)
- **Lead-time Bias (Calibration)**:
  - 12h: 0.222 °C
  - 24h: 0.210 °C
  - 36h: 0.476 °C
  - 48h: 0.378 °C

## 5. Overall Validation Metrics
| Metric | Baseline 0 | Baseline 3 (Global) | Baseline 3 (Lead) | Diff (B0 - B3 Global) |
|---|---|---|---|---|
| MAE | 2.040 | 2.310 | 2.314 | -0.270 |
| RMSE | 2.621 | 2.864 | 2.871 | -0.242 |
| Bias | -1.907 | -2.228 | -2.228 | 0.321 |
| Median AE | 1.640 | 1.961 | 1.967 | -0.321 |

## 6. Stratified Metrics: By Station (Validation)
### Station 43063099999 (n=56)
- **MAE B0**: 2.573 | **MAE B3**: 2.877 (Diff: -0.304)
- **Bias B0**: -2.555 | **Bias B3**: -2.877 (Diff: 0.321)

### Station 43003099999 (n=56)
- **MAE B0**: 1.504 | **MAE B3**: 1.782 (Diff: -0.277)
- **Bias B0**: -1.298 | **Bias B3**: -1.619 (Diff: 0.321)

### Station 42867099999 (n=56)
- **MAE B0**: 3.027 | **MAE B3**: 3.337 (Diff: -0.310)
- **Bias B0**: -3.016 | **Bias B3**: -3.337 (Diff: 0.321)

### Station 43014099999 (n=56)
- **MAE B0**: 1.058 | **MAE B3**: 1.246 (Diff: -0.188)
- **Bias B0**: -0.757 | **Bias B3**: -1.078 (Diff: 0.321)

## 7. Stratified Metrics: By Lead Time (Validation)
### Lead Time 12h (n=56)
- **MAE B0**: 1.851 | **MAE B3**: 2.084 (Diff: -0.233)

### Lead Time 24h (n=56)
- **MAE B0**: 2.036 | **MAE B3**: 2.318 (Diff: -0.282)

### Lead Time 36h (n=56)
- **MAE B0**: 2.111 | **MAE B3**: 2.390 (Diff: -0.278)

### Lead Time 48h (n=56)
- **MAE B0**: 2.163 | **MAE B3**: 2.450 (Diff: -0.287)

## 8. Useful vs Harmful Corrections
Threshold: 0.2 °C
- **USEFUL**: 14 (6.2%)
- **HARMFUL**: 202 (90.2%)
- **NEUTRAL**: 8 (3.6%)

## 9. Dependence Limitations
- Temporal correlation exists within the validation week (October 1-7).
- Represents 4 specific spatial locations, not a continuous statewide grid.
- Spatial and temporal autocorrelation means records are not strictly independent random samples.

## 10. Decision Gate Assessment
**Overall Performance**: MAE changes from 2.040 to 2.310.
**Correction Profile**: 6.2% useful vs 90.2% harmful.

**DECISION OUTCOME**: To be determined.
