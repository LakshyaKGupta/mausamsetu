# Phase 6: Baseline 1 Spatial Representation Experiment

## 1. Objective
Determine whether spatial interpolation of the existing GFS grid to the exact station coordinate improves the raw nearest-grid representation.

## 2. Data & GFS Grid Geometry
- **N_pairs**: 892
- **N_stations**: 4
- **Date Range**: 2023-01-01T12:00:00 to 2023-10-09T12:00:00
- **Lead Times**: 12, 24, 36, 48 hours
- **GFS Grid Resolution**: 0.25° x 0.25°
- **Evaluation Target**: Real ISD station observations. Observations were NOT used in interpolation.

## 3. Interpolation Formula
Bilinear interpolation using the 4 surrounding GFS grid cells.
Given station coordinate `(lat, lon)`:
```
lat0 = floor(lat / 0.25) * 0.25
lat1 = lat0 + 0.25
lon0 = floor(lon / 0.25) * 0.25
lon1 = lon0 + 0.25

u = (lon - lon0) / 0.25
v = (lat - lat0) / 0.25

T_B1 = (1 - u) * (1 - v) * T(lat0, lon0) + 
       u * (1 - v) * T(lat0, lon1) + 
       (1 - u) * v * T(lat1, lon0) + 
       u * v * T(lat1, lon1)
```
- **Edge Cases**: If a station falls exactly on a grid point, `T_B1` exactly equals the grid point value. If boundaries are missing (e.g. edge of parsed subset), falls back to nearest-neighbor (0 cases in this dataset).
- **Elevation**: Baseline 1 operates entirely independently of elevation to maintain scientific separation from Baseline 2.

## 4. Definitions
- **Baseline 0**: `T_B0 = nearest_grid_temperature`
- **Baseline 1**: `T_B1 = bilinear_interpolated_temperature`

## 5. Overall Metrics
| Metric | Baseline 0 | Baseline 1 | Difference (B0 - B1) |
|---|---|---|---|
| MAE | 1.855 | 1.716 | 0.139 |
| RMSE | 2.542 | 2.375 | 0.167 |
| Bias | -0.238 | -0.273 | 0.035 |
| Median AE | 1.385 | 1.300 | 0.085 |

## 6. Useful vs Harmful Corrections
Threshold: 0.2 °C
- **USEFUL**: 374 (41.9%)
- **HARMFUL**: 242 (27.1%)
- **NEUTRAL**: 276 (30.9%)

## 7. Stratified Metrics: By Station
### Station 43063099999 (n=220)
- **MAE B0**: 2.051 | **MAE B1**: 1.844 (Diff: 0.208)
- **Bias B0**: -0.709 | **Bias B1**: -0.322

### Station 43003099999 (n=224)
- **MAE B0**: 1.683 | **MAE B1**: 1.331 (Diff: 0.353)
- **Bias B0**: -0.866 | **Bias B1**: -0.871

### Station 42867099999 (n=224)
- **MAE B0**: 2.178 | **MAE B1**: 2.190 (Diff: -0.011)
- **Bias B0**: -0.026 | **Bias B1**: -0.155

### Station 43014099999 (n=224)
- **MAE B0**: 1.508 | **MAE B1**: 1.502 (Diff: 0.007)
- **Bias B0**: 0.640 | **Bias B1**: 0.255

## 8. Stratified Metrics: By Lead Time
### Lead Time 12h (n=223)
- **MAE B0**: 1.704 | **MAE B1**: 1.545 (Diff: 0.160)

### Lead Time 24h (n=223)
- **MAE B0**: 1.839 | **MAE B1**: 1.699 (Diff: 0.140)

### Lead Time 36h (n=223)
- **MAE B0**: 1.922 | **MAE B1**: 1.796 (Diff: 0.126)

### Lead Time 48h (n=223)
- **MAE B0**: 1.952 | **MAE B1**: 1.824 (Diff: 0.129)

## 9. Statistical & Scientific Limitations
- **Paired Comparisons**: B0 and B1 are evaluated on the exact same records. The differences represent the strict marginal effect of the spatial interpolation.
- **Dependence**: The 892 records span 4 specific stations over 4 separated weeks. Records within each week are temporally autocorrelated. They are not 892 fully independent random samples.
- **Elevation Independence**: Because B1 lacks an elevation correction, residual errors related to altitude differences still exist and are isolated from this spatial analysis.

## 10. Interpretation & Decision
**Overall Performance**: MAE improves from 1.855 to 1.716.
**Correction Profile**: 41.9% useful vs 27.1% harmful.

**Interpretation**: Bilinear interpolation consistently improves or maintains performance across lead times and most stations. It introduces meaningful spatial accuracy (especially for Pune and Mumbai), though it doesn't significantly help or harm Nagpur and Aurangabad. 

**DECISION OUTCOME**: GO WITH LIMITATION.
Baseline 1 establishes a stronger spatial foundation than Baseline 0, but residual errors remain. This scientifically justifies exploring Baseline 4 (Residual Modeling / ML) because we have proven a simple mathematical correction is viable but incomplete.
