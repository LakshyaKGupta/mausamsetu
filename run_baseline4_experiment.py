import os
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

def compute_metrics(df, col_pred, col_true):
    mae = np.mean(np.abs(df[col_pred] - df[col_true]))
    rmse = np.sqrt(np.mean((df[col_pred] - df[col_true])**2))
    bias = np.mean(df[col_pred] - df[col_true])
    median_ae = np.median(np.abs(df[col_pred] - df[col_true]))
    return {'mae': mae, 'rmse': rmse, 'bias': bias, 'median_ae': median_ae}

def classify_correction(imp, threshold=0.2):
    if imp > threshold: return 'USEFUL'
    elif imp < -threshold: return 'HARMFUL'
    else: return 'NEUTRAL'

def main():
    os.makedirs('experiments/phase6/reports', exist_ok=True)
    os.makedirs('experiments/phase6/models', exist_ok=True)
    
    # 1. Load Datasets
    raw_df = pd.read_csv('experiments/phase6/data/validated/phase6_real_gfs_isd_expanded.csv')
    b1_df = pd.read_csv('experiments/phase6/reports/baseline1_spatial_predictions.csv')
    
    # Merge to get all features + B1 predictions
    df = raw_df.merge(b1_df[['station_id', 'observation_time', 'lead_time_hours', 'baseline1_temperature_c']], 
                      on=['station_id', 'observation_time', 'lead_time_hours'])
                      
    df['observation_time'] = pd.to_datetime(df['observation_time'])
    df['month'] = df['observation_time'].dt.month
    
    # Residual Target
    df['residual'] = df['observed_temperature_c'] - df['baseline1_temperature_c']
    
    # 2. Split Data (Temporal)
    calib_mask = df['month'].isin([1, 4, 7])
    val_mask = df['month'] == 10
    
    df_calib = df[calib_mask].copy()
    df_val = df[val_mask].copy()
    
    # Features definition
    features_R0 = ['baseline1_temperature_c']
    features_R1 = ['baseline1_temperature_c', 'lead_time_hours']
    features_R2 = ['baseline1_temperature_c', 'elevation_difference_m']
    features_R3 = ['baseline1_temperature_c', 'lead_time_hours', 'elevation_difference_m']
    
    models = {
        'R0': features_R0,
        'R1': features_R1,
        'R2': features_R2,
        'R3': features_R3
    }
    
    # Train and evaluate candidate models on temporal validation
    best_model_name = 'R3' # Let's select R3 as the final B4-R if it performs best, or just use R3.
    # We will evaluate all and pick the one with best MAE on a subset, or just report R3. 
    # Actually, the prompt says "The objective is to determine whether the remaining error after B1 contains a simple predictable structure."
    # Let's train R3 as our primary B4-R since it encompasses the physical constraints requested (elevation, lead time).
    
    trained_models = {}
    for name, feats in models.items():
        X_train = df_calib[feats]
        y_train = df_calib['residual']
        lr = LinearRegression()
        lr.fit(X_train, y_train)
        trained_models[name] = lr
        
        df_val[f'r_hat_{name}'] = lr.predict(df_val[feats])
        df_val[f'T_B4_{name}'] = df_val['baseline1_temperature_c'] + df_val[f'r_hat_{name}']
        
    # Primary model is R3
    primary_model = 'R3'
    lr_primary = trained_models[primary_model]
    features_primary = models[primary_model]
    
    df_val['baseline4_temperature_c'] = df_val[f'T_B4_{primary_model}']
    
    # 3. Spatial Validation (Leave-One-Station-Out on entire dataset or calibration set)
    # The prompt asks to investigate spatial holdout. We'll do it on the calibration set.
    stations = df['station_id'].unique()
    loso_maes_b1 = []
    loso_maes_b4 = []
    for stn in stations:
        train_mask = (df_calib['station_id'] != stn)
        test_mask = (df_calib['station_id'] == stn)
        if sum(train_mask) > 0 and sum(test_mask) > 0:
            lr_loso = LinearRegression()
            lr_loso.fit(df_calib.loc[train_mask, features_primary], df_calib.loc[train_mask, 'residual'])
            
            preds_r = lr_loso.predict(df_calib.loc[test_mask, features_primary])
            preds_t = df_calib.loc[test_mask, 'baseline1_temperature_c'] + preds_r
            
            true_t = df_calib.loc[test_mask, 'observed_temperature_c']
            mae_b4 = np.mean(np.abs(preds_t - true_t))
            mae_b1 = np.mean(np.abs(df_calib.loc[test_mask, 'baseline1_temperature_c'] - true_t))
            
            loso_maes_b1.append(mae_b1)
            loso_maes_b4.append(mae_b4)
            
    spatial_holdout_b1_mae = np.mean(loso_maes_b1)
    spatial_holdout_b4_mae = np.mean(loso_maes_b4)

    # 4. Metrics on Temporal Validation
    df_val['baseline0_temperature_c'] = df_val['gfs_temperature_c']
    
    df_val['baseline0_error_c'] = df_val['baseline0_temperature_c'] - df_val['observed_temperature_c']
    df_val['baseline1_error_c'] = df_val['baseline1_temperature_c'] - df_val['observed_temperature_c']
    df_val['baseline4_error_c'] = df_val['baseline4_temperature_c'] - df_val['observed_temperature_c']
    
    df_val['abs_err_B0'] = np.abs(df_val['baseline0_error_c'])
    df_val['abs_err_B1'] = np.abs(df_val['baseline1_error_c'])
    df_val['abs_err_B4'] = np.abs(df_val['baseline4_error_c'])
    
    df_val['improvement_B4_over_B1'] = df_val['abs_err_B1'] - df_val['abs_err_B4']
    df_val['correction_class'] = df_val['improvement_B4_over_B1'].apply(classify_correction)
    
    m0 = compute_metrics(df_val, 'baseline0_temperature_c', 'observed_temperature_c')
    m1 = compute_metrics(df_val, 'baseline1_temperature_c', 'observed_temperature_c')
    m4 = compute_metrics(df_val, 'baseline4_temperature_c', 'observed_temperature_c')
    
    class_counts = df_val['correction_class'].value_counts()
    n_val = len(df_val)
    pct_useful = (class_counts.get('USEFUL', 0) / n_val) * 100
    pct_harmful = (class_counts.get('HARMFUL', 0) / n_val) * 100
    pct_neutral = (class_counts.get('NEUTRAL', 0) / n_val) * 100
    
    # 5. Output CSV
    out_cols = [
        'station_id', 'observation_time', 'lead_time_hours', 'observed_temperature_c',
        'baseline0_temperature_c', 'baseline1_temperature_c', 'baseline4_temperature_c',
        'baseline0_error_c', 'baseline1_error_c', 'baseline4_error_c', 
        'improvement_B4_over_B1', 'correction_class'
    ]
    df_val[out_cols].to_csv('experiments/phase6/reports/baseline4_revised_predictions.csv', index=False)
    
    # 6. Equation String
    coef_str = " + ".join([f"({c:.4f} * {f})" for c, f in zip(lr_primary.coef_, features_primary)])
    eq_str = f"r_hat = {lr_primary.intercept_:.4f} + {coef_str}"
    
    # 7. Model Metadata
    metadata = {
        "model_id": "B4_R_Linear_Residual_v1",
        "version": "1.0",
        "training_data_reference": "phase6_real_gfs_isd_expanded.csv (Jan, Apr, Jul 2023)",
        "feature_schema": features_primary,
        "training_period": "2023-01-01 to 2023-07-07",
        "validation_period": "2023-10-01 to 2023-10-07",
        "coefficients": dict(zip(features_primary, lr_primary.coef_)),
        "intercept": lr_primary.intercept_,
        "metrics": {
            "validation_mae": m4['mae'],
            "validation_rmse": m4['rmse'],
            "validation_bias": m4['bias']
        },
        "creation_timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "EXPERIMENTAL"
    }
    with open('experiments/phase6/models/baseline4_model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    # 8. Markdown Report
    report = f"""# Phase 6: Revised Baseline 4 (B1 + Simple Linear Residual)

## 1. Objective
Determine whether a simple linear residual model can learn systematic temperature error remaining after spatial interpolation (B1), without relying on the failed fixed lapse-rate correction (B2).

## 2. Why Original B4 Was Modified
The original project plan defined Baseline 4 as `B2 + linear residual`. Because Baseline 2 (fixed environmental lapse rate) degraded accuracy in the Phase 6 pilot and was marked NO-GO, it has been excluded. Revised Baseline 4 is built on top of Baseline 1, which successfully improved spatial representation (GO WITH LIMITATION).

## 3. Data & Validation Design
- **Dataset**: Expanded real paired GFS-ISD dataset (n={len(df)})
- **Temporal Holdout**: 
  - **Calibration Period**: January, April, July 2023 (n={len(df_calib)})
  - **Validation Period**: October 2023 (n={len(df_val)})
- **Leakage Check**: The validation month (October) was entirely held out from residual model fitting. The `observed_temperature_c` target was strictly excluded from validation inputs.

## 4. Revised Baseline 4 Formulation
- **B1**: Bilinear spatial interpolation of GFS 2m temperature
- **Target Residual**: `r = T_observed - T_B1`
- **Features**: `{', '.join(features_primary)}`
- **Equation**: 
  `{eq_str}`
- **B4-R**: `T_B4 = T_B1 + r_hat`

## 5. Overall Validation Metrics (Temporal Holdout: October)
| Metric | Baseline 0 | Baseline 1 | Baseline 4-R | Diff (B1 - B4-R) |
|---|---|---|---|---|
| MAE | {m0['mae']:.3f} | {m1['mae']:.3f} | {m4['mae']:.3f} | {m1['mae'] - m4['mae']:.3f} |
| RMSE | {m0['rmse']:.3f} | {m1['rmse']:.3f} | {m4['rmse']:.3f} | {m1['rmse'] - m4['rmse']:.3f} |
| Bias | {m0['bias']:.3f} | {m1['bias']:.3f} | {m4['bias']:.3f} | {m1['bias'] - m4['bias']:.3f} |
| Median AE | {m0['median_ae']:.3f} | {m1['median_ae']:.3f} | {m4['median_ae']:.3f} | {m1['median_ae'] - m4['median_ae']:.3f} |

## 6. Useful vs Harmful Corrections (B4-R vs B1)
Threshold: 0.2 °C
- **USEFUL**: {class_counts.get('USEFUL', 0)} ({pct_useful:.1f}%)
- **HARMFUL**: {class_counts.get('HARMFUL', 0)} ({pct_harmful:.1f}%)
- **NEUTRAL**: {class_counts.get('NEUTRAL', 0)} ({pct_neutral:.1f}%)

## 7. Stratified Metrics: By Station (Validation)
"""
    for stn in stations:
        df_stn = df_val[df_val['station_id'] == stn]
        if len(df_stn) == 0: continue
        sm1 = compute_metrics(df_stn, 'baseline1_temperature_c', 'observed_temperature_c')
        sm4 = compute_metrics(df_stn, 'baseline4_temperature_c', 'observed_temperature_c')
        report += f"### Station {stn} (n={len(df_stn)})\n"
        report += f"- **MAE B1**: {sm1['mae']:.3f} | **MAE B4-R**: {sm4['mae']:.3f} (Diff: {sm1['mae'] - sm4['mae']:.3f})\n"
        report += f"- **Bias B1**: {sm1['bias']:.3f} | **Bias B4-R**: {sm4['bias']:.3f}\n\n"

    report += "## 8. Stratified Metrics: By Lead Time (Validation)\n"
    for lt in sorted(df_val['lead_time_hours'].unique()):
        df_lt = df_val[df_val['lead_time_hours'] == lt]
        if len(df_lt) == 0: continue
        lm1 = compute_metrics(df_lt, 'baseline1_temperature_c', 'observed_temperature_c')
        lm4 = compute_metrics(df_lt, 'baseline4_temperature_c', 'observed_temperature_c')
        report += f"### Lead Time {lt}h (n={len(df_lt)})\n"
        report += f"- **MAE B1**: {lm1['mae']:.3f} | **MAE B4-R**: {lm4['mae']:.3f} (Diff: {lm1['mae'] - lm4['mae']:.3f})\n\n"
        
    report += f"""## 9. Spatial Validation (Exploratory Leave-One-Station-Out)
- Evaluated on calibration set ({len(df_calib)} pairs across 4 stations) to test spatial generalization.
- Model trained on 3 stations, validated on 1 held-out station (repeated 4 times).
- **Average B1 MAE**: {spatial_holdout_b1_mae:.3f} °C
- **Average B4-R MAE**: {spatial_holdout_b4_mae:.3f} °C
- *Limitation*: 4 stations is an insufficient sample to claim robust spatial generalization.

## 10. Seasonal Behavior
The temporal holdout in October tests the model's ability to generalize from Jan/Apr/Jul to a post-monsoon transition month. If B4-R MAE degrades compared to B1, it indicates the linear residual structure overfits to the calibration seasons.

## 11. Scientific & Statistical Limitations
- **Model Complexity**: A linear regression with 3 features is simple, but testing on only 4 stations risks learning site-specific correlations rather than universal physical residuals.
- **Dependence**: Temporal autocorrelation exists. Records are not independent.

## 12. Interpretation & Decision Gate
**Overall Performance**: MAE changes from {m1['mae']:.3f} (B1) to {m4['mae']:.3f} (B4-R).
**Correction Profile**: {pct_useful:.1f}% useful vs {pct_harmful:.1f}% harmful compared to B1.

**DECISION OUTCOME**: To be evaluated.
"""
    with open('experiments/phase6/reports/baseline4_revised_experiment.md', 'w') as f:
        f.write(report)
        
    print("Baseline 4-R Experiment complete.")

if __name__ == '__main__':
    main()
