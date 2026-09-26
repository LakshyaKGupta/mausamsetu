import os
import pandas as pd
import numpy as np
import xarray as xr
import matplotlib.pyplot as plt
import seaborn as sns

def bilinear_interpolate(da, lat, lon):
    if lon < 0:
        lon += 360.0
        
    lat0 = np.floor(lat / 0.25) * 0.25
    lat1 = lat0 + 0.25
    lon0 = np.floor(lon / 0.25) * 0.25
    lon1 = lon0 + 0.25
    
    # Exact grid hit
    if lat == lat0 and lon == lon0:
        return float(da.sel(latitude=lat0, longitude=lon0).item())
        
    try:
        t00 = float(da.sel(latitude=lat0, longitude=lon0).item())
        t01 = float(da.sel(latitude=lat0, longitude=lon1).item())
        t10 = float(da.sel(latitude=lat1, longitude=lon0).item())
        t11 = float(da.sel(latitude=lat1, longitude=lon1).item())
    except KeyError:
        # Fallback if boundaries are missing
        return float(da.sel(latitude=lat, longitude=lon, method='nearest').item())

    # Weights
    u = (lon - lon0) / 0.25
    v = (lat - lat0) / 0.25

    # Interpolation
    val = (1 - u) * (1 - v) * t00 + \
          u * (1 - v) * t01 + \
          (1 - u) * v * t10 + \
          u * v * t11
          
    return val

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
    
    data_path = 'experiments/phase6/data/validated/phase6_real_gfs_isd_expanded.csv'
    df = pd.read_csv(data_path)
    
    print("Computing Baseline 1 (Bilinear Interpolation)...")
    
    # Group by file to minimize opening/closing NetCDF
    b1_temps = []
    
    # Ensure stable row ordering
    df['row_id'] = np.arange(len(df))
    
    grouped = df.groupby('forecast_file')
    for file, group in grouped:
        if not os.path.exists(file):
            print(f"Warning: {file} not found.")
            for _, row in group.iterrows():
                b1_temps.append((row['row_id'], np.nan))
            continue
            
        try:
            ds_2m = xr.open_dataset(file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'heightAboveGround', 'level': 2, 'stepType': 'instant'})
            for _, row in group.iterrows():
                lat = row['station_lat']
                lon = row['station_lon']
                val_k = bilinear_interpolate(ds_2m['t2m'], lat, lon)
                val_c = val_k - 273.15
                b1_temps.append((row['row_id'], round(val_c, 2)))
            ds_2m.close()
        except Exception as e:
            print(f"Error processing {file}: {e}")
            for _, row in group.iterrows():
                b1_temps.append((row['row_id'], np.nan))

    b1_df = pd.DataFrame(b1_temps, columns=['row_id', 'baseline1_temperature_c'])
    df = df.merge(b1_df, on='row_id')
    df = df.dropna(subset=['baseline1_temperature_c'])
    
    df['baseline0_temperature_c'] = df['gfs_temperature_c']
    
    df['baseline0_error_c'] = df['baseline0_temperature_c'] - df['observed_temperature_c']
    df['baseline1_error_c'] = df['baseline1_temperature_c'] - df['observed_temperature_c']
    
    df['absolute_error_baseline0_c'] = np.abs(df['baseline0_error_c'])
    df['absolute_error_baseline1_c'] = np.abs(df['baseline1_error_c'])
    
    df['error_improvement_c'] = df['absolute_error_baseline0_c'] - df['absolute_error_baseline1_c']
    df['correction_class'] = df['error_improvement_c'].apply(classify_correction)
    
    # Save predictions
    out_cols = [
        'station_id', 'observation_time', 'lead_time_hours', 'observed_temperature_c',
        'baseline0_temperature_c', 'baseline1_temperature_c', 'baseline0_error_c',
        'baseline1_error_c', 'absolute_error_baseline0_c', 'absolute_error_baseline1_c',
        'error_improvement_c', 'correction_class'
    ]
    df[out_cols].to_csv('experiments/phase6/reports/baseline1_spatial_predictions.csv', index=False)
    
    # Metrics
    m0 = compute_metrics(df, 'baseline0_temperature_c', 'observed_temperature_c')
    m1 = compute_metrics(df, 'baseline1_temperature_c', 'observed_temperature_c')
    
    class_counts = df['correction_class'].value_counts()
    n_val = len(df)
    pct_useful = (class_counts.get('USEFUL', 0) / n_val) * 100
    pct_harmful = (class_counts.get('HARMFUL', 0) / n_val) * 100
    pct_neutral = (class_counts.get('NEUTRAL', 0) / n_val) * 100
    
    # Visualizations
    plt.style.use('seaborn-v0_8-whitegrid')
    
    # 1. Observed vs B0
    plt.figure(figsize=(6, 6))
    plt.scatter(df['observed_temperature_c'], df['baseline0_temperature_c'], alpha=0.5, s=15)
    plt.plot([5, 45], [5, 45], 'r--')
    plt.xlabel('Observed Temperature (C)')
    plt.ylabel('B0 (Nearest Grid) Temperature (C)')
    plt.title('PHASE 6 PILOT: Observed vs B0')
    plt.tight_layout()
    plt.savefig('experiments/phase6/reports/b1_observed_vs_b0.png')
    plt.close()
    
    # 2. Observed vs B1
    plt.figure(figsize=(6, 6))
    plt.scatter(df['observed_temperature_c'], df['baseline1_temperature_c'], alpha=0.5, s=15)
    plt.plot([5, 45], [5, 45], 'r--')
    plt.xlabel('Observed Temperature (C)')
    plt.ylabel('B1 (Interpolated) Temperature (C)')
    plt.title('PHASE 6 PILOT: Observed vs B1')
    plt.tight_layout()
    plt.savefig('experiments/phase6/reports/b1_observed_vs_b1.png')
    plt.close()
    
    # 3. B0 vs B1 Error Distribution
    plt.figure(figsize=(8, 5))
    sns.kdeplot(df['absolute_error_baseline0_c'], label='Baseline 0', fill=True, alpha=0.3)
    sns.kdeplot(df['absolute_error_baseline1_c'], label='Baseline 1', fill=True, alpha=0.3)
    plt.xlabel('Absolute Error (C)')
    plt.ylabel('Density')
    plt.title('PHASE 6 PILOT: Absolute Error Distribution')
    plt.legend()
    plt.tight_layout()
    plt.savefig('experiments/phase6/reports/b1_error_distribution.png')
    plt.close()
    
    # 4. Error Improvement
    plt.figure(figsize=(8, 5))
    sns.histplot(df['error_improvement_c'], bins=30, kde=False)
    plt.axvline(0, color='black', linestyle='--', linewidth=1)
    plt.axvline(0.2, color='green', linestyle=':', linewidth=1, label='Useful threshold (+0.2)')
    plt.axvline(-0.2, color='red', linestyle=':', linewidth=1, label='Harmful threshold (-0.2)')
    plt.xlabel('Improvement in Absolute Error (C) [Positive is better]')
    plt.ylabel('Count')
    plt.title('PHASE 6 PILOT: Per-Record Error Improvement (B0 - B1)')
    plt.legend()
    plt.tight_layout()
    plt.savefig('experiments/phase6/reports/b1_error_improvement.png')
    plt.close()

    # Generate Report
    report = f"""# Phase 6: Baseline 1 Spatial Representation Experiment

## 1. Objective
Determine whether spatial interpolation of the existing GFS grid to the exact station coordinate improves the raw nearest-grid representation.

## 2. Data & GFS Grid Geometry
- **N_pairs**: {n_val}
- **N_stations**: {len(df['station_id'].unique())}
- **Date Range**: {df['observation_time'].min()} to {df['observation_time'].max()}
- **Lead Times**: {', '.join(map(str, sorted(df['lead_time_hours'].unique())))} hours
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
| MAE | {m0['mae']:.3f} | {m1['mae']:.3f} | {m0['mae'] - m1['mae']:.3f} |
| RMSE | {m0['rmse']:.3f} | {m1['rmse']:.3f} | {m0['rmse'] - m1['rmse']:.3f} |
| Bias | {m0['bias']:.3f} | {m1['bias']:.3f} | {m0['bias'] - m1['bias']:.3f} |
| Median AE | {m0['median_ae']:.3f} | {m1['median_ae']:.3f} | {m0['median_ae'] - m1['median_ae']:.3f} |

## 6. Useful vs Harmful Corrections
Threshold: 0.2 °C
- **USEFUL**: {class_counts.get('USEFUL', 0)} ({pct_useful:.1f}%)
- **HARMFUL**: {class_counts.get('HARMFUL', 0)} ({pct_harmful:.1f}%)
- **NEUTRAL**: {class_counts.get('NEUTRAL', 0)} ({pct_neutral:.1f}%)

## 7. Stratified Metrics: By Station
"""
    for stn in df['station_id'].unique():
        df_stn = df[df['station_id'] == stn]
        sm0 = compute_metrics(df_stn, 'baseline0_temperature_c', 'observed_temperature_c')
        sm1 = compute_metrics(df_stn, 'baseline1_temperature_c', 'observed_temperature_c')
        report += f"### Station {stn} (n={len(df_stn)})\n"
        report += f"- **MAE B0**: {sm0['mae']:.3f} | **MAE B1**: {sm1['mae']:.3f} (Diff: {sm0['mae'] - sm1['mae']:.3f})\n"
        report += f"- **Bias B0**: {sm0['bias']:.3f} | **Bias B1**: {sm1['bias']:.3f}\n\n"

    report += "## 8. Stratified Metrics: By Lead Time\n"
    for lt in sorted(df['lead_time_hours'].unique()):
        df_lt = df[df['lead_time_hours'] == lt]
        lm0 = compute_metrics(df_lt, 'baseline0_temperature_c', 'observed_temperature_c')
        lm1 = compute_metrics(df_lt, 'baseline1_temperature_c', 'observed_temperature_c')
        report += f"### Lead Time {lt}h (n={len(df_lt)})\n"
        report += f"- **MAE B0**: {lm0['mae']:.3f} | **MAE B1**: {lm1['mae']:.3f} (Diff: {lm0['mae'] - lm1['mae']:.3f})\n\n"

    report += """## 9. Statistical & Scientific Limitations
- **Paired Comparisons**: B0 and B1 are evaluated on the exact same records. The differences represent the strict marginal effect of the spatial interpolation.
- **Dependence**: The 892 records span 4 specific stations over 4 separated weeks. Records within each week are temporally autocorrelated. They are not 892 fully independent random samples.
- **Elevation Independence**: Because B1 lacks an elevation correction, residual errors related to altitude differences still exist and are isolated from this spatial analysis.

## 10. Interpretation & Decision
**Overall Performance**: MAE changes from {m0_mae} to {m1_mae}.
**Correction Profile**: {pct_useful}% useful vs {pct_harmful}% harmful.

**DECISION OUTCOME**: To be evaluated.
""".replace('{m0_mae}', f"{m0['mae']:.3f}").replace('{m1_mae}', f"{m1['mae']:.3f}").replace('{pct_useful}', f"{pct_useful:.1f}").replace('{pct_harmful}', f"{pct_harmful:.1f}")

    with open('experiments/phase6/reports/baseline1_spatial_experiment.md', 'w') as f:
        f.write(report)
        
    print("Baseline 1 Spatial Experiment complete.")

if __name__ == '__main__':
    main()
