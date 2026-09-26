# Phase 6: Baseline 1 Temporal Holdout Reanalysis

## 1. Objective
To reconcile the discrepancy between the mixed-period Baseline 1 evaluation (where MAE improved from 1.855 to 1.716 °C) and the strict October temporal holdout evaluation (where MAE degraded from 2.040 to 2.096 °C).

## 2. Why Earlier B1 and October B1 Results Differ
- **Mixed-Period Evaluation (Original B1 Report):** The original evaluation computed metrics across all 892 records spanning January, April, July, and October. In that aggregate view, spatial interpolation provided massive benefits in some months (likely Jan/Jul) which masked its failures in others.
- **Strict Temporal Holdout (This Reanalysis):** When evaluating *only* on the completely held-out October dataset (n=224), B1 actually performed worse than the raw B0 nearest-grid forecast. The relationship between the GFS grid spatial gradients and the true station temperature is highly seasonal and non-stationary. 

## 3. Strict October Holdout Result (n=224)
| Metric | Baseline 0 | Baseline 1 | Difference (B0 - B1) |
|---|---|---|---|
| MAE | 2.040 | 2.096 | -0.056 |
| RMSE | 2.621 | 2.562 | +0.059 |
| Bias | -1.907 | -1.998 | -0.091 |
| Median AE | 1.640 | 1.915 | -0.275 |

*Note: A negative difference indicates Baseline 1 performed worse than Baseline 0.*

## 4. Useful vs Harmful Corrections (October)
Threshold: 0.2 °C
- **USEFUL**: 73 (32.6%)
- **HARMFUL**: 86 (38.4%)
- **NEUTRAL**: 65 (29.0%)

## 5. Stratified Metrics: By Station (October)
### Station 43063099999 (Pune, n=56)
- **MAE B0**: 2.573 | **MAE B1**: 2.092 (Diff: +0.481)

### Station 43003099999 (Mumbai, n=56)
- **MAE B0**: 1.504 | **MAE B1**: 1.834 (Diff: -0.330)

### Station 42867099999 (Nagpur, n=56)
- **MAE B0**: 3.027 | **MAE B1**: 3.140 (Diff: -0.113)

### Station 43014099999 (Aurangabad, n=56)
- **MAE B0**: 1.058 | **MAE B1**: 1.316 (Diff: -0.259)

*Observation: Only Pune saw an improvement from spatial interpolation in October. Mumbai, Nagpur, and Aurangabad all degraded.*

## 6. Stratified Metrics: By Lead Time (October)
### Lead Time 12h (n=56)
- **MAE B0**: 1.851 | **MAE B1**: 1.852 (Diff: -0.001)

### Lead Time 24h (n=56)
- **MAE B0**: 2.036 | **MAE B1**: 2.096 (Diff: -0.060)

### Lead Time 36h (n=56)
- **MAE B0**: 2.111 | **MAE B1**: 2.200 (Diff: -0.089)

### Lead Time 48h (n=56)
- **MAE B0**: 2.163 | **MAE B1**: 2.234 (Diff: -0.071)

## 7. B1 Implementation & Leakage Audit
- **Implementation Verified:** 
  - Four surrounding GFS nodes are extracted correctly (`lat0, lat1, lon0, lon1`).
  - Bilinear weights `u, v` and grid indexing are mathematically sound.
  - Longitude translation (0-360) is handled.
  - No accidental fallbacks to nearest-neighbor occurred during the October evaluation.
- **Leakage Audit Verified:** 
  - The B1 method strictly used `station_lat`, `station_lon`, and the `gfs_temperature_c` (2m). 
  - It did NOT use `station_elevation`, `observed_temperature_c`, or any validation-period statistical distributions.

## 8. Statistical & Dependence Limitations
Because the 224 records represent highly autocorrelated temporal sequences across only 4 stations, treating them as independent spatial/temporal samples is statistically invalid. 

## 9. Conclusion
**DECISION OUTCOME**: NO-GO FOR TEMPORAL GENERALIZATION IN CURRENT PILOT.
While spatial interpolation provided a mixed-period improvement, strict temporal holdout did not confirm this improvement. The relationship between spatial gradients and station observations varies significantly by season, and a static bilinear interpolation without seasonal/topographical context is insufficient to consistently downscale GFS temperatures.

## 10. Data Expansion Requirement
The evidence explicitly demonstrates that the current 4-station pilot cannot safely generalise either spatially or temporally. 
**Requirement**: Significant dataset expansion (more stations, contiguous periods, rural representation) is mandatory before engaging in further complexity (Baseline 4 redesign or Machine Learning).
