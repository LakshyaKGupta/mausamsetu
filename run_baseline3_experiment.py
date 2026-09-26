import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

def compute_metrics(df, col_pred, col_true):
    mae = np.mean(np.abs(df[col_pred] - df[col_true]))
    rmse = np.sqrt(np.mean((df[col_pred] - df[col_true])**2))
    bias = np.mean(df[col_pred] - df[col_true])
    median_ae = np.median(np.abs(df[col_pred] - df[col_true]))
    return {'mae': mae, 'rmse': rmse, 'bias': bias, 'median_ae': median_ae}

def main():
    os.makedirs('experiments/phase6/reports', exist_ok=True)
    
    # 1. Load Data
    data_path = 'experiments/phase6/data/validated/phase6_real_gfs_isd_expanded.csv'
    df = pd.read_csv(data_path)
    
    # Extract month for splitting
    df['observation_time'] = pd.to_datetime(df['observation_time'])
    df['month'] = df['observation_time'].dt.month
    
    # 2. Calibration / Validation Split
    # Calibrate on Jan (1), Apr (4), Jul (7). Validate on Oct (10).
    calib_mask = df['month'].isin([1, 4, 7])
    val_mask = df['month'] == 10
    
    df_calib = df[calib_mask].copy()
    df_val = df[val_mask].copy()
    
    # 3. Calculate Bias on Calibration Data
    # bias = mean(T_GFS - T_observed)
    global_bias = np.mean(df_calib['gfs_temperature_c'] - df_calib['observed_temperature_c'])
    
    # Lead-time specific bias
    lt_bias = df_calib.groupby('lead_time_hours').apply(
        lambda x: np.mean(x['gfs_temperature_c'] - x['observed_temperature_c'])
    ).to_dict()
    
    # 4. Apply Baseline 3 to Validation Data
    # B0 = Raw GFS
    df_val['baseline0_temperature_c'] = df_val['gfs_temperature_c']
    
    # B3-Global
    df_val['baseline3_temperature_c'] = df_val['gfs_temperature_c'] - global_bias
    
    # B3-Lead
    df_val['baseline3_lead_temperature_c'] = df_val.apply(
        lambda row: row['gfs_temperature_c'] - lt_bias[row['lead_time_hours']], axis=1
    )
    
    # 5. Compute Errors
    for m in ['baseline0', 'baseline3', 'baseline3_lead']:
        df_val[f'{m}_error_c'] = df_val[f'{m}_temperature_c'] - df_val['observed_temperature_c']
        df_val[f'absolute_error_{m}_c'] = np.abs(df_val[f'{m}_error_c'])
        
    df_val['error_improvement_c'] = df_val['absolute_error_baseline0_c'] - df_val['absolute_error_baseline3_c']
    
    # Useful/Harmful Threshold
    THRESHOLD = 0.2
    def classify_correction(imp):
        if imp > THRESHOLD: return 'USEFUL'
        elif imp < -THRESHOLD: return 'HARMFUL'
        else: return 'NEUTRAL'
        
    df_val['correction_class'] = df_val['error_improvement_c'].apply(classify_correction)
    
    # 6. Save Predictions
    out_cols = [
        'station_id', 'observation_time', 'lead_time_hours', 'observed_temperature_c',
        'gfs_temperature_c', 'baseline0_error_c', 'baseline3_temperature_c',
        'baseline3_error_c', 'baseline3_lead_temperature_c', 'absolute_error_baseline0_c',
        'absolute_error_baseline3_c', 'error_improvement_c', 'correction_class'
    ]
    df_val[out_cols].to_csv('experiments/phase6/reports/baseline3_bias_correction_predictions.csv', index=False)
    
    # 7. Metrics
    b0_metrics = compute_metrics(df_val, 'baseline0_temperature_c', 'observed_temperature_c')
    b3_metrics = compute_metrics(df_val, 'baseline3_temperature_c', 'observed_temperature_c')
    b3lt_metrics = compute_metrics(df_val, 'baseline3_lead_temperature_c', 'observed_temperature_c')
    
    stations = df_val['station_id'].unique()
    leads = df_val['lead_time_hours'].unique()
    
    # 8. Report Generation
    class_counts = df_val['correction_class'].value_counts()
    n_val = len(df_val)
    pct_useful = (class_counts.get('USEFUL', 0) / n_val) * 100
    pct_harmful = (class_counts.get('HARMFUL', 0) / n_val) * 100
    pct_neutral = (class_counts.get('NEUTRAL', 0) / n_val) * 100
    
    # Leakage check
    overlap = set(df_calib['observation_time']).intersection(set(df_val['observation_time']))
    causality_violations = (pd.to_datetime(df_val['forecast_issue_time']) >= df_val['observation_time']).sum()

    report_content = f"""# Phase 6: Historical Bias-Correction Experiment (Baseline 3)

## 1. Objective
Evaluate whether a simple historical mean-bias correction (Baseline 3) improves temperature forecasts beyond raw GFS (Baseline 0) using a strict temporal holdout.

## 2. Dataset Expansion
- **Total Pairs (All Data)**: {len(df)}
- **Station Count**: {len(df['station_id'].unique())}
- **Date Range**: {df['observation_time'].min()} to {df['observation_time'].max()}
- **Lead Times**: {', '.join(map(str, df['lead_time_hours'].unique()))} hours

## 3. Calibration / Validation Split
- **Calibration Period**: January, April, July 2023 ({len(df_calib)} pairs)
- **Validation Period**: October 2023 ({len(df_val)} pairs)
- **Leakage Audit**: 
  - Overlapping observation times: {len(overlap)}
  - Causality violations (issue >= valid): {causality_violations}

## 4. Definitions & Calibration
- **Baseline 0**: `T_B0 = T_GFS`
- **Baseline 3 (Global)**: `T_B3 = T_GFS - bias`
- **Baseline 3 (Lead)**: `T_B3_lead = T_GFS - bias(lead_time)`
- **Global Bias (Calibration)**: {global_bias:.3f} °C (GFS was on average {'warmer' if global_bias > 0 else 'cooler'} than observations)
- **Lead-time Bias (Calibration)**:
"""
    for lt, b in lt_bias.items():
        report_content += f"  - {lt}h: {b:.3f} °C\n"

    report_content += f"""
## 5. Overall Validation Metrics
| Metric | Baseline 0 | Baseline 3 (Global) | Baseline 3 (Lead) | Diff (B0 - B3 Global) |
|---|---|---|---|---|
| MAE | {b0_metrics['mae']:.3f} | {b3_metrics['mae']:.3f} | {b3lt_metrics['mae']:.3f} | {b0_metrics['mae'] - b3_metrics['mae']:.3f} |
| RMSE | {b0_metrics['rmse']:.3f} | {b3_metrics['rmse']:.3f} | {b3lt_metrics['rmse']:.3f} | {b0_metrics['rmse'] - b3_metrics['rmse']:.3f} |
| Bias | {b0_metrics['bias']:.3f} | {b3_metrics['bias']:.3f} | {b3lt_metrics['bias']:.3f} | {b0_metrics['bias'] - b3_metrics['bias']:.3f} |
| Median AE | {b0_metrics['median_ae']:.3f} | {b3_metrics['median_ae']:.3f} | {b3lt_metrics['median_ae']:.3f} | {b0_metrics['median_ae'] - b3_metrics['median_ae']:.3f} |

## 6. Stratified Metrics: By Station (Validation)
"""
    for stn in stations:
        df_stn = df_val[df_val['station_id'] == stn]
        if len(df_stn) == 0: continue
        m0 = compute_metrics(df_stn, 'baseline0_temperature_c', 'observed_temperature_c')
        m3 = compute_metrics(df_stn, 'baseline3_temperature_c', 'observed_temperature_c')
        report_content += f"### Station {stn} (n={len(df_stn)})\n"
        report_content += f"- **MAE B0**: {m0['mae']:.3f} | **MAE B3**: {m3['mae']:.3f} (Diff: {m0['mae'] - m3['mae']:.3f})\n"
        report_content += f"- **Bias B0**: {m0['bias']:.3f} | **Bias B3**: {m3['bias']:.3f} (Diff: {m0['bias'] - m3['bias']:.3f})\n\n"

    report_content += "## 7. Stratified Metrics: By Lead Time (Validation)\n"
    for lt in sorted(leads):
        df_lt = df_val[df_val['lead_time_hours'] == lt]
        if len(df_lt) == 0: continue
        m0 = compute_metrics(df_lt, 'baseline0_temperature_c', 'observed_temperature_c')
        m3 = compute_metrics(df_lt, 'baseline3_temperature_c', 'observed_temperature_c')
        report_content += f"### Lead Time {lt}h (n={len(df_lt)})\n"
        report_content += f"- **MAE B0**: {m0['mae']:.3f} | **MAE B3**: {m3['mae']:.3f} (Diff: {m0['mae'] - m3['mae']:.3f})\n\n"

    report_content += f"""## 8. Useful vs Harmful Corrections
Threshold: {THRESHOLD} °C
- **USEFUL**: {class_counts.get('USEFUL', 0)} ({pct_useful:.1f}%)
- **HARMFUL**: {class_counts.get('HARMFUL', 0)} ({pct_harmful:.1f}%)
- **NEUTRAL**: {class_counts.get('NEUTRAL', 0)} ({pct_neutral:.1f}%)

## 9. Dependence Limitations
- Temporal correlation exists within the validation week (October 1-7).
- Represents 4 specific spatial locations, not a continuous statewide grid.
- Spatial and temporal autocorrelation means records are not strictly independent random samples.

## 10. Decision Gate Assessment
**Overall Performance**: MAE changes from {b0_metrics['mae']:.3f} to {b3_metrics['mae']:.3f}.
**Correction Profile**: {pct_useful:.1f}% useful vs {pct_harmful:.1f}% harmful.

**DECISION OUTCOME**: To be determined.
"""

    with open('experiments/phase6/reports/baseline3_bias_correction_experiment.md', 'w') as f:
        f.write(report_content)
        
    print("Baseline 3 experiment generated.")

if __name__ == '__main__':
    main()
