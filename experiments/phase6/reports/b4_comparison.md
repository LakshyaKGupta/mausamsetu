# PHASE 6 SCIENTIFIC EXPERIMENT
# Baseline 4: Linear Residual Correction

## 1. Objective
Evaluate whether `T_B4 = T_B2 + (intercept + beta1*T_B2 + beta2*lead_hours + beta3*elevation_difference)` can generalize across spatial and temporal holdouts better than the physical lapse rate alone (B2).

## 2. Methodology
- **Dataset**: 1,660 expanded pairs across 18 stations in Maharashtra (Feb and Aug 2023).
- **Spatial Validation**: 5-Fold Leave-Region-Out cross-validation.
- **Temporal Validation**: Train Feb → Test Aug, and Train Aug → Test Feb.

## 3. Main Results

| Split | Baseline | MAE | RMSE | Bias | Useful | Harmful | Neutral |
|---|---|---|---|---|---|---|---|
| Spatial CV | b0 | 1.705 | 2.241 | -0.015 | 0 | 0 | 0 |
| Spatial CV | b2 | 1.555 | 2.093 | -0.110 | 340 | 245 | 1075 |
| Spatial CV | b4_spatial | 1.635 | 2.124 | 0.208 | 734 | 625 | 301 |
| Temporal (Test Aug) | b0 | 1.531 | 1.838 | -1.048 | 0 | 0 | 0 |
| Temporal (Test Aug) | b2 | 1.364 | 1.651 | -1.150 | 186 | 108 | 491 |
| Temporal (Test Aug) | b4_temp_aug | 2.774 | 3.055 | -2.659 | 54 | 680 | 51 |
| Temporal (Test Feb) | b0 | 1.861 | 2.550 | 0.912 | 0 | 0 | 0 |
| Temporal (Test Feb) | b2 | 1.726 | 2.422 | 0.822 | 154 | 137 | 584 |
| Temporal (Test Feb) | b4_temp_feb | 2.298 | 3.030 | 1.970 | 242 | 575 | 58 |

## 4. Coefficient Stability Analysis

**Train Feb (Test Aug) Coefficients:**
- Intercept: -9.278
- B2 Temp: 0.322
- Lead Time: -0.020
- Elev Diff: 0.0021

**Train Aug (Test Feb) Coefficients:**
- Intercept: 0.920
- B2 Temp: -0.001
- Lead Time: 0.009
- Elev Diff: -0.0010

**Spatial Folds (Min to Max Range):**
- intercept: -5.0409 to -1.8724 (Mean: -3.9290)
- b2: 0.0833 to 0.1946 (Mean: 0.1544)
- lead_time_hours: -0.0047 to -0.0015 (Mean: -0.0033)
- elevation_difference_m: -0.0008 to 0.0040 (Mean: 0.0013)

## 5. Visualizations
![Spatial MAE](/home/aditya/Documents/Projects/GramWeather/experiments/phase6/reports/plots/b4_spatial_mae.png)
![Temporal MAE](/home/aditya/Documents/Projects/GramWeather/experiments/phase6/reports/plots/b4_temporal_mae.png)

## 6. Scientific Decision Gate

### Conclusion: NO-GO
- **Performance:** B4 degraded performance in **all** held-out validations. Spatial CV MAE degraded from 1.555 (B2) to 1.635. Temporal holdout (Test Aug) degraded from 1.364 (B2) to 2.774. Temporal holdout (Test Feb) degraded from 1.726 (B2) to 2.298.
- **Coefficient Instability:** The fitted coefficients are highly unstable. Between February and August, the intercept shifts from -9.278 to 0.920, and the elevation difference coefficient flips sign from positive (0.0021) to negative (-0.0010). This indicates the linear residual model is learning season-specific noise rather than a generalizable physical relationship.
- **Correction Impact:** B4 produced a massive number of harmful corrections on out-of-sample data (e.g., 680 harmful vs 54 useful on the August test set).

### Next Actions
- B4 (`B2 + Linear Residual`) is rejected.
- Baseline 2 (Physical Lapse Rate) remains the strongest, most generalizable method.
- **ML Gate:** Because a simple, interpretable linear model completely failed to generalize the residual structure, jumping directly to highly non-linear ML models (XGBoost/Random Forest) on this dataset carries an extreme risk of catastrophic overfitting. ML remains blocked unless a non-linear theoretical justification is clearly defined and a much larger training set is established.
