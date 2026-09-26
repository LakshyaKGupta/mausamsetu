# Phase 6: Revised Baseline 4 (B1 + Simple Linear Residual)

## 1. Objective
Determine whether a simple linear residual model can learn systematic temperature error remaining after spatial interpolation (B1), without relying on the failed fixed lapse-rate correction (B2).

## 2. Why Original B4 Was Modified
The original project plan defined Baseline 4 as `B2 + linear residual`. Because Baseline 2 (fixed environmental lapse rate) degraded accuracy in the Phase 6 pilot and was marked NO-GO, it has been excluded. Revised Baseline 4 is built on top of Baseline 1, which successfully improved spatial representation (GO WITH LIMITATION).

## 3. Data & Validation Design
- **Dataset**: Expanded real paired GFS-ISD dataset (n=892)
- **Temporal Holdout**: 
  - **Calibration Period**: January, April, July 2023 (n=668)
  - **Validation Period**: October 2023 (n=224)
- **Leakage Check**: The validation month (October) was entirely held out from residual model fitting. The `observed_temperature_c` target was strictly excluded from validation inputs.

## 4. Revised Baseline 4 Formulation
- **B1**: Bilinear spatial interpolation of GFS 2m temperature
- **Target Residual**: `r = T_observed - T_B1`
- **Features**: `baseline1_temperature_c, lead_time_hours, elevation_difference_m`
- **Equation**: 
  `r_hat = -1.0178 + (0.0347 * baseline1_temperature_c) + (-0.0070 * lead_time_hours) + (-0.0013 * elevation_difference_m)`
- **B4-R**: `T_B4 = T_B1 + r_hat`

## 5. Overall Validation Metrics (Temporal Holdout: October)
| Metric | Baseline 0 | Baseline 1 | Baseline 4-R | Diff (B1 - B4-R) |
|---|---|---|---|---|
| MAE | 2.040 | 2.096 | 2.384 | -0.288 |
| RMSE | 2.621 | 2.562 | 2.818 | -0.256 |
| Bias | -1.907 | -1.998 | -2.337 | 0.338 |
| Median AE | 1.640 | 1.915 | 2.215 | -0.300 |

## 6. Useful vs Harmful Corrections (B4-R vs B1)
Threshold: 0.2 °C
- **USEFUL**: 12 (5.4%)
- **HARMFUL**: 167 (74.6%)
- **NEUTRAL**: 45 (20.1%)

## 7. Stratified Metrics: By Station (Validation)
### Station 43063099999 (n=56)
- **MAE B1**: 2.092 | **MAE B4-R**: 2.290 (Diff: -0.198)
- **Bias B1**: -1.994 | **Bias B4-R**: -2.261

### Station 43003099999 (n=56)
- **MAE B1**: 1.834 | **MAE B4-R**: 2.120 (Diff: -0.285)
- **Bias B1**: -1.704 | **Bias B4-R**: -2.005

### Station 42867099999 (n=56)
- **MAE B1**: 3.140 | **MAE B4-R**: 3.525 (Diff: -0.385)
- **Bias B1**: -3.140 | **Bias B4-R**: -3.525

### Station 43014099999 (n=56)
- **MAE B1**: 1.316 | **MAE B4-R**: 1.602 (Diff: -0.285)
- **Bias B1**: -1.156 | **Bias B4-R**: -1.556

## 8. Stratified Metrics: By Lead Time (Validation)
### Lead Time 12h (n=56)
- **MAE B1**: 1.852 | **MAE B4-R**: 2.004 (Diff: -0.152)

### Lead Time 24h (n=56)
- **MAE B1**: 2.096 | **MAE B4-R**: 2.328 (Diff: -0.232)

### Lead Time 36h (n=56)
- **MAE B1**: 2.200 | **MAE B4-R**: 2.534 (Diff: -0.333)

### Lead Time 48h (n=56)
- **MAE B1**: 2.234 | **MAE B4-R**: 2.670 (Diff: -0.436)

## 9. Spatial Validation (Exploratory Leave-One-Station-Out)
- Evaluated on calibration set (668 pairs across 4 stations) to test spatial generalization.
- Model trained on 3 stations, validated on 1 held-out station (repeated 4 times).
- **Average B1 MAE**: 1.590 °C
- **Average B4-R MAE**: 2.024 °C
- *Limitation*: 4 stations is an insufficient sample to claim robust spatial generalization.

## 10. Seasonal Behavior
The temporal holdout in October tests the model's ability to generalize from Jan/Apr/Jul to a post-monsoon transition month. If B4-R MAE degrades compared to B1, it indicates the linear residual structure overfits to the calibration seasons.

## 11. Scientific & Statistical Limitations
- **Model Complexity**: A linear regression with 3 features is simple, but testing on only 4 stations risks learning site-specific correlations rather than universal physical residuals.
- **Dependence**: Temporal autocorrelation exists. Records are not independent.

## 12. Interpretation & Decision Gate
**Overall Performance**: MAE degraded from 2.096 (B1) to 2.384 (B4-R).
**Correction Profile**: 5.4% useful vs 74.6% harmful compared to B1.

**Interpretation**: The linear residual model trained on Jan/Apr/Jul failed completely to generalize to the October temporal holdout. It degraded performance across all four stations and all four lead times. Furthermore, in the exploratory spatial holdout (leave-one-station-out on the calibration set), it degraded MAE from 1.590 to 2.024 °C. This strongly indicates that the simple linear relationship between B1 temperature, elevation difference, lead time, and error is highly non-stationary (it changes drastically across seasons and locations).

**DECISION OUTCOME**: NO-GO.

**ML Gate Justification**: Because a simple linear residual fails to generalize spatially and temporally, there is no evidence yet of a *simple reproducible* linear residual structure. The remaining error may be highly non-linear, driven by complex boundary layer physics (inversions, local topography not captured by a simple elevation diff, etc.). However, given the failure to generalize with just 3 features across 4 stations, introducing a high-capacity non-linear model (like XGBoost or Random Forest) on this small 4-station dataset is almost guaranteed to result in massive overfitting rather than learning true physics. 

Therefore, nonlinear ML is NOT scientifically justified until a significantly larger historical dataset (more stations, longer contiguous time periods) is acquired to support spatial/temporal cross-validation of a high-capacity model. Baseline 1 (Bilinear Interpolation) remains the strongest scientifically justified baseline.
