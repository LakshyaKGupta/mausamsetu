# Phase 7: Reliability / Fallback Experiment — Analysis

## 1. Objective
Determine when the B2 (physical lapse-rate correction) is reliable enough to use versus when to fall back to B0 (raw GFS reference).

## 2. Dataset Used
- **Source**: `experiments/phase6/reports/expanded_baseline_predictions.csv`
- **Total pairs**: 1,660 real GFS–ISD pairs
- **Stations**: 18 unique stations active in the February and August 2023 windows
- **Temporal windows**: February 1–10, 2023 (n=875) and August 1–10, 2023 (n=785)
- **Lead times**: 12h, 24h, 36h, 48h
- **Correction threshold**: 0.2 °C (identical to all Phase 6 experiments)

## 3. Leakage Controls
All leakage rules from Phase 6 are preserved:
- `observed_temperature_c` is **never** used as an input to any reliability rule
- All rule thresholds are derived on training data only and applied to an untouched test set
- `forecast_issue_time < observation_time` enforced across all records

## 4. Feature Audit
| Feature | Available at Prediction Time | Scientifically Plausible | Leakage Risk | Decision |
|---|---|---|---|---|
| `b0` (raw GFS temperature) | YES | YES | NO | KEEP |
| `b2` (lapse-rate corrected) | YES | YES | NO | KEEP |
| `elevation_difference_m` | YES | YES | NO | KEEP |
| `lead_time_hours` | YES | YES | NO | KEEP |
| `station_lat / station_lon` | YES | YES | NO | KEEP |
| `station_elevation_m` | YES | YES | NO | KEEP |
| `gfs_reference_elevation_m` | YES | YES | NO | KEEP |
| `month` | YES | YES | NO | KEEP |
| `observed_temperature_c` | NO | N/A | **YES** | **REJECT** |
| `b3_spatial` | NO | N/A | **YES** | **REJECT** |
| `b3_temporal` | NO | N/A | **YES** | **REJECT** |

## 5. B2 Correction Quality Labels (Overall)
- **USEFUL**: 340 (20.5%) — B2 reduced error by > 0.2 °C vs B0
- **HARMFUL**: 245 (14.8%) — B2 increased error by > 0.2 °C vs B0
- **NEUTRAL**: 1,075 (64.8%) — Difference within 0.2 °C

## 6. Exploratory Analysis by Feature

### 6.1 Elevation Difference Bins
| Elevation Diff Bin | USEFUL | HARMFUL | NEUTRAL | n | Mean Improvement |
|---|---|---|---|---|---|
| -200 to -50m (station lower than GFS) | 64.0% | 29.7% | 6.3% | 239 | +0.27 °C |
| -50 to 50m (near-flat) | 6.7% | 10.2% | 83.1% | 1268 | -0.005 °C |
| 50 to 200m (station higher) | 42.5% | 50.7% | 6.8% | 73 | -0.05 °C |
| > 200m (station much higher) | 88.8% | 10.0% | 1.3% | 80 | +2.43 °C |

**Key finding**: When `elevation_difference_m` is very large and positive (station much higher than GFS reference), B2 is overwhelmingly useful (88.8% USEFUL). The harmful correction zone is dominated by small-to-moderate elevation differences (50–200m), consistent with complex terrain where a fixed global lapse rate over- or under-corrects.

### 6.2 Lead Time Bins
| Lead Time | USEFUL | HARMFUL | NEUTRAL | n | Mean Improvement |
|---|---|---|---|---|---|
| 12h | 20.3% | 15.3% | 64.4% | 419 | +0.149 °C |
| 24h | 21.8% | 14.5% | 63.7% | 413 | +0.159 °C |
| 36h | 19.8% | 14.7% | 65.5% | 414 | +0.148 °C |
| 48h | 20.0% | 14.5% | 65.5% | 414 | +0.145 °C |

**Key finding**: Lead time shows no meaningful signal for reliability. The useful/harmful rates are essentially uniform across all lead times, making it an ineffective gating feature.

### 6.3 Month / Season
| Month | n | USEFUL | HARMFUL | NEUTRAL | Mean Improvement |
|---|---|---|---|---|---|
| February | 875 | 17.6% | 15.7% | 66.7% | +0.135 °C |
| August | 785 | 23.7% | 13.8% | 62.5% | +0.167 °C |

**Key finding**: B2 is slightly more beneficial in August than in February. However, the difference is modest and both months still have substantial harmful correction rates.
