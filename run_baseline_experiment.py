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
    data_path = 'experiments/phase6/data/validated/phase6_real_gfs_isd_temperature_scaled.csv'
    df = pd.read_csv(data_path)
    
    # 2. Define Gamma
    # Standard environmental lapse rate: 6.5 C per 1000m (0.0065 C/m)
    GAMMA = 0.0065
    
    # 3. Compute Baselines
    df['baseline0_temperature_c'] = df['gfs_temperature_c']
    df['baseline2_temperature_c'] = df['baseline0_temperature_c'] - GAMMA * (df['station_elevation_m'] - df['gfs_reference_elevation_m'])
    
    # 4. Compute Errors
    df['baseline0_error_c'] = df['baseline0_temperature_c'] - df['observed_temperature_c']
    df['baseline2_error_c'] = df['baseline2_temperature_c'] - df['observed_temperature_c']
    
    df['absolute_error_baseline0_c'] = np.abs(df['baseline0_error_c'])
    df['absolute_error_baseline2_c'] = np.abs(df['baseline2_error_c'])
    
    df['error_improvement_c'] = df['absolute_error_baseline0_c'] - df['absolute_error_baseline2_c']
    
    # Useful/Harmful Threshold (0.2 C is often considered meaningful in T2M)
    THRESHOLD = 0.2
    
    def classify_correction(improvement):
        if improvement > THRESHOLD:
            return 'USEFUL'
        elif improvement < -THRESHOLD:
            return 'HARMFUL'
        else:
            return 'NEUTRAL'
            
    df['correction_class'] = df['error_improvement_c'].apply(classify_correction)
    
    # 5. Save Raw Result Table
    out_cols = [
        'station_id', 'observation_time', 'lead_time_hours', 'observed_temperature_c',
        'gfs_temperature_c', 'station_elevation_m', 'gfs_reference_elevation_m',
        'elevation_difference_m', 'baseline0_error_c', 'baseline2_temperature_c',
        'baseline2_error_c', 'absolute_error_baseline0_c', 'absolute_error_baseline2_c',
        'error_improvement_c', 'correction_class'
    ]
    df[out_cols].to_csv('experiments/phase6/reports/temperature_baseline_predictions.csv', index=False)
    
    # 6. Overall Metrics
    b0_metrics = compute_metrics(df, 'baseline0_temperature_c', 'observed_temperature_c')
    b2_metrics = compute_metrics(df, 'baseline2_temperature_c', 'observed_temperature_c')
    
    # 7. Stratified Results
    stations = df['station_id'].unique()
    leads = df['lead_time_hours'].unique()
    
    # 8. Elevation Analysis
    mean_dz = df['elevation_difference_m'].mean()
    median_dz = df['elevation_difference_m'].median()
    min_dz = df['elevation_difference_m'].min()
    max_dz = df['elevation_difference_m'].max()
    
    # 9. Statistical Test
    t_stat, p_val = stats.ttest_rel(df['absolute_error_baseline0_c'], df['absolute_error_baseline2_c'])
    
    # 10. Generate Visualizations
    sns.set_theme(style="whitegrid")
    
    # Plot 1: Observed vs B0 and B2 (Scatter)
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 2, 1)
    sns.scatterplot(data=df, x='observed_temperature_c', y='baseline0_temperature_c', hue='station_id', alpha=0.7)
    plt.plot([df['observed_temperature_c'].min(), df['observed_temperature_c'].max()],
             [df['observed_temperature_c'].min(), df['observed_temperature_c'].max()], 'r--')
    plt.title('Baseline 0 vs Observed\n(PILOT EXPERIMENT)')
    plt.xlabel('Observed Temp (C)')
    plt.ylabel('Baseline 0 Temp (C)')
    
    plt.subplot(1, 2, 2)
    sns.scatterplot(data=df, x='observed_temperature_c', y='baseline2_temperature_c', hue='station_id', alpha=0.7)
    plt.plot([df['observed_temperature_c'].min(), df['observed_temperature_c'].max()],
             [df['observed_temperature_c'].min(), df['observed_temperature_c'].max()], 'r--')
    plt.title('Baseline 2 vs Observed\n(PILOT EXPERIMENT)')
    plt.xlabel('Observed Temp (C)')
    plt.ylabel('Baseline 2 Temp (C)')
    plt.tight_layout()
    plt.savefig('experiments/phase6/reports/pilot_scatter_b0_b2.png')
    plt.close()
    
    # Plot 2: Error Distributions
    plt.figure(figsize=(8, 5))
    sns.kdeplot(data=df, x='baseline0_error_c', label='Baseline 0', fill=True)
    sns.kdeplot(data=df, x='baseline2_error_c', label='Baseline 2', fill=True)
    plt.title('Error Distribution: B0 vs B2\n(PILOT EXPERIMENT)')
    plt.xlabel('Error (C)')
    plt.legend()
    plt.savefig('experiments/phase6/reports/pilot_error_distribution.png')
    plt.close()
    
    # Plot 3: Error Improvement
    plt.figure(figsize=(8, 5))
    sns.histplot(data=df, x='error_improvement_c', bins=20, kde=True)
    plt.axvline(0, color='r', linestyle='--')
    plt.title('Absolute Error Improvement (B0 - B2)\n(PILOT EXPERIMENT)')
    plt.xlabel('Improvement (C) [Positive is Better]')
    plt.savefig('experiments/phase6/reports/pilot_error_improvement.png')
    plt.close()
    
    # Plot 4: Baseline MAE by Lead Time
    b0_lt = df.groupby('lead_time_hours').apply(lambda x: compute_metrics(x, 'baseline0_temperature_c', 'observed_temperature_c')['mae']).reset_index(name='MAE_B0')
    b2_lt = df.groupby('lead_time_hours').apply(lambda x: compute_metrics(x, 'baseline2_temperature_c', 'observed_temperature_c')['mae']).reset_index(name='MAE_B2')
    lt_df = pd.merge(b0_lt, b2_lt, on='lead_time_hours')
    lt_df_melt = lt_df.melt(id_vars='lead_time_hours', var_name='Model', value_name='MAE')
    
    plt.figure(figsize=(8, 5))
    sns.barplot(data=lt_df_melt, x='lead_time_hours', y='MAE', hue='Model')
    plt.title('MAE by Lead Time\n(PILOT EXPERIMENT)')
    plt.ylabel('Mean Absolute Error (C)')
    plt.savefig('experiments/phase6/reports/pilot_mae_by_leadtime.png')
    plt.close()
    
    # Plot 5: Baseline MAE by Station
    b0_st = df.groupby('station_id').apply(lambda x: compute_metrics(x, 'baseline0_temperature_c', 'observed_temperature_c')['mae']).reset_index(name='MAE_B0')
    b2_st = df.groupby('station_id').apply(lambda x: compute_metrics(x, 'baseline2_temperature_c', 'observed_temperature_c')['mae']).reset_index(name='MAE_B2')
    st_df = pd.merge(b0_st, b2_st, on='station_id')
    st_df_melt = st_df.melt(id_vars='station_id', var_name='Model', value_name='MAE')
    
    plt.figure(figsize=(8, 5))
    sns.barplot(data=st_df_melt, x='station_id', y='MAE', hue='Model')
    plt.title('MAE by Station\n(PILOT EXPERIMENT)')
    plt.ylabel('Mean Absolute Error (C)')
    plt.savefig('experiments/phase6/reports/pilot_mae_by_station.png')
    plt.close()
    
    # 11. Write Report
    class_counts = df['correction_class'].value_counts()
    pct_useful = (class_counts.get('USEFUL', 0) / len(df)) * 100
    pct_harmful = (class_counts.get('HARMFUL', 0) / len(df)) * 100
    pct_neutral = (class_counts.get('NEUTRAL', 0) / len(df)) * 100
    
    report_content = f"""# Phase 6: Controlled Temperature Baseline Experiment

## 1. Objective
Evaluate the effectiveness of an elevation-based physical correction (Baseline 2) against the raw uncorrected GFS 2m temperature forecast (Baseline 0) in a limited pilot setting.

## 2. Dataset
- **N_pairs**: {len(df)}
- **N_stations**: {len(stations)} ({', '.join(map(str, stations))})
- **Dates**: {df['observation_time'].min()} to {df['observation_time'].max()}
- **Lead Times**: {', '.join(map(str, leads))} hours

## 3. Definitions
- **Baseline 0**: `T_B0 = T_GFS` (Raw GFS 2m Temperature)
- **Baseline 2**: `T_B2 = T_B0 - Gamma * (z_station - z_reference)`
- **Gamma**: `{GAMMA}` °C/m (Standard Environmental Lapse Rate)
- **z_station**: Real station elevation from NOAA ISD (`station_elevation_m`)
- **z_reference**: GFS grid surface elevation from GRIB2 `orog` (`gfs_reference_elevation_m`)

## 4. Overall Metrics
| Metric | Baseline 0 | Baseline 2 | Difference (B0 - B2) |
|---|---|---|---|
| MAE | {b0_metrics['mae']:.3f} | {b2_metrics['mae']:.3f} | {b0_metrics['mae'] - b2_metrics['mae']:.3f} |
| RMSE | {b0_metrics['rmse']:.3f} | {b2_metrics['rmse']:.3f} | {b0_metrics['rmse'] - b2_metrics['rmse']:.3f} |
| Bias | {b0_metrics['bias']:.3f} | {b2_metrics['bias']:.3f} | {b0_metrics['bias'] - b2_metrics['bias']:.3f} |
| Median AE | {b0_metrics['median_ae']:.3f} | {b2_metrics['median_ae']:.3f} | {b0_metrics['median_ae'] - b2_metrics['median_ae']:.3f} |

## 5. Stratified Metrics: By Station
"""
    for stn in stations:
        df_stn = df[df['station_id'] == stn]
        m0 = compute_metrics(df_stn, 'baseline0_temperature_c', 'observed_temperature_c')
        m2 = compute_metrics(df_stn, 'baseline2_temperature_c', 'observed_temperature_c')
        report_content += f"### Station {stn}\n"
        report_content += f"- **MAE B0**: {m0['mae']:.3f} | **MAE B2**: {m2['mae']:.3f} (Diff: {m0['mae'] - m2['mae']:.3f})\n"
        report_content += f"- **Bias B0**: {m0['bias']:.3f} | **Bias B2**: {m2['bias']:.3f} (Diff: {m0['bias'] - m2['bias']:.3f})\n\n"

    report_content += "## 6. Stratified Metrics: By Lead Time\n"
    for lt in sorted(leads):
        df_lt = df[df['lead_time_hours'] == lt]
        m0 = compute_metrics(df_lt, 'baseline0_temperature_c', 'observed_temperature_c')
        m2 = compute_metrics(df_lt, 'baseline2_temperature_c', 'observed_temperature_c')
        report_content += f"### Lead Time {lt}h\n"
        report_content += f"- **MAE B0**: {m0['mae']:.3f} | **MAE B2**: {m2['mae']:.3f} (Diff: {m0['mae'] - m2['mae']:.3f})\n\n"

    report_content += f"""## 7. Useful vs Harmful Corrections
Threshold: {THRESHOLD} °C
- **USEFUL**: {class_counts.get('USEFUL', 0)} ({pct_useful:.1f}%)
- **HARMFUL**: {class_counts.get('HARMFUL', 0)} ({pct_harmful:.1f}%)
- **NEUTRAL**: {class_counts.get('NEUTRAL', 0)} ({pct_neutral:.1f}%)

## 8. Elevation Difference Analysis (delta_z)
- **Mean**: {mean_dz:.2f} m
- **Median**: {median_dz:.2f} m
- **Min**: {min_dz:.2f} m
- **Max**: {max_dz:.2f} m

## 9. Statistical Analysis
- **Test**: Paired t-test on Absolute Errors (B0 vs B2)
- **t-statistic**: {t_stat:.3f}
- **p-value**: {p_val:.4e}
*(Note: Repeated measures from only two stations violate standard independence assumptions. p-value should be interpreted cautiously.)*

## 10. Scientific Limitations
- **PILOT EXPERIMENT ONLY**: This is not a state-wide, rural, or Panchayat-level validation.
- **Station Count**: Only 2 synoptic airport stations.
- **Timeframe**: Short 7-day period in January.
- **Dependence**: Highly autocorrelated temporal samples.

## 11. Decision Gate Assessment
**Overall Performance**: MAE changes from {b0_metrics['mae']:.3f} to {b2_metrics['mae']:.3f}.
**Per-Station**: Consistent behavior across stations? (Check Section 5)
**Correction Classes**: {pct_useful:.1f}% useful vs {pct_harmful:.1f}% harmful.

**DECISION OUTCOME**: To be evaluated based on the printed output of this script.
"""

    with open('experiments/phase6/reports/temperature_baseline_experiment.md', 'w') as f:
        f.write(report_content)
        
    print(f"Overall MAE B0: {b0_metrics['mae']:.3f}")
    print(f"Overall MAE B2: {b2_metrics['mae']:.3f}")
    print(f"Useful: {pct_useful:.1f}% | Harmful: {pct_harmful:.1f}%")
    print(f"Pune MAE B0 -> B2: {df[df['station_id'] == 43063099999]['absolute_error_baseline0_c'].mean():.3f} -> {df[df['station_id'] == 43063099999]['absolute_error_baseline2_c'].mean():.3f}")
    print(f"Mumbai MAE B0 -> B2: {df[df['station_id'] == 43003099999]['absolute_error_baseline0_c'].mean():.3f} -> {df[df['station_id'] == 43003099999]['absolute_error_baseline2_c'].mean():.3f}")

if __name__ == '__main__':
    main()
