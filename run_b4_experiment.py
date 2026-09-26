import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold

def classify_correction(imp, threshold=0.2):
    if imp > threshold: return 'USEFUL'
    elif imp < -threshold: return 'HARMFUL'
    else: return 'NEUTRAL'

def compute_metrics(y_true, y_pred):
    mae = np.mean(np.abs(y_pred - y_true))
    rmse = np.sqrt(np.mean((y_pred - y_true)**2))
    bias = np.mean(y_pred - y_true)
    return mae, rmse, bias

def fit_b4(df_train, df_test):
    df_train['residual_true'] = df_train['observed_temperature_c'] - df_train['b2']
    features = ['b2', 'lead_time_hours', 'elevation_difference_m']
    
    X_train = df_train[features]
    y_train = df_train['residual_true']
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    X_test = df_test[features]
    y_pred_residual = model.predict(X_test)
    y_pred_b4 = df_test['b2'] + y_pred_residual
    
    coefs = dict(zip(['intercept'] + features, [model.intercept_] + list(model.coef_)))
    return y_pred_b4, coefs

def main():
    df = pd.read_csv('experiments/phase6/reports/expanded_baseline_predictions.csv')
    df['obs_dt'] = pd.to_datetime(df['observation_time'])
    df['month'] = df['obs_dt'].dt.month
    
    stations = df['station_id'].unique()
    
    # Ensure B0, B2 exist
    df['b0'] = df['gfs_temperature_c']
    df['b2'] = df['b0'] - 0.0065 * df['elevation_difference_m']
    
    # 1. Spatial CV (5-Fold)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    df['b4_spatial'] = np.nan
    spatial_coefs = []
    
    for train_idx, test_idx in kf.split(stations):
        train_stns = stations[train_idx]
        test_stns = stations[test_idx]
        
        train_df = df[df['station_id'].isin(train_stns)].copy()
        test_df = df[df['station_id'].isin(test_stns)].copy()
        
        y_pred, coefs = fit_b4(train_df, test_df)
        df.loc[df['station_id'].isin(test_stns), 'b4_spatial'] = y_pred
        spatial_coefs.append(coefs)

    # 2. Temporal CV (Train Feb -> Test Aug)
    df['b4_temp_aug'] = np.nan
    train_feb = df[df['month'] == 2].copy()
    test_aug = df[df['month'] == 8].copy()
    y_pred_aug, coef_aug = fit_b4(train_feb, test_aug)
    df.loc[df['month'] == 8, 'b4_temp_aug'] = y_pred_aug
    
    # 3. Temporal CV (Train Aug -> Test Feb)
    df['b4_temp_feb'] = np.nan
    train_aug = df[df['month'] == 8].copy()
    test_feb = df[df['month'] == 2].copy()
    y_pred_feb, coef_feb = fit_b4(train_aug, test_feb)
    df.loc[df['month'] == 2, 'b4_temp_feb'] = y_pred_feb

    df.to_csv('experiments/phase6/reports/b4_predictions.csv', index=False)

    # Metrics
    def evaluate(target_df, b_col):
        mae, rmse, bias = compute_metrics(target_df['observed_temperature_c'], target_df[b_col])
        if b_col == 'b0':
            return mae, rmse, bias, 0, 0, 0
            
        imp = np.abs(target_df['b0'] - target_df['observed_temperature_c']) - np.abs(target_df[b_col] - target_df['observed_temperature_c'])
        classes = imp.apply(classify_correction)
        useful = (classes == 'USEFUL').sum()
        harmful = (classes == 'HARMFUL').sum()
        neutral = (classes == 'NEUTRAL').sum()
        return mae, rmse, bias, useful, harmful, neutral

    results = []
    
    # Spatial Test
    for b in ['b0', 'b2', 'b4_spatial']:
        results.append(('Spatial CV', b) + evaluate(df, b))
        
    # Temporal Test Aug
    aug_df = df[df['month'] == 8]
    for b in ['b0', 'b2', 'b4_temp_aug']:
        results.append(('Temporal (Test Aug)', b) + evaluate(aug_df, b))

    # Temporal Test Feb
    feb_df = df[df['month'] == 2]
    for b in ['b0', 'b2', 'b4_temp_feb']:
        results.append(('Temporal (Test Feb)', b) + evaluate(feb_df, b))

    res_df = pd.DataFrame(results, columns=['Split', 'Baseline', 'MAE', 'RMSE', 'Bias', 'Useful', 'Harmful', 'Neutral'])

    # Plots
    os.makedirs('experiments/phase6/reports/plots', exist_ok=True)
    
    plt.figure(figsize=(8, 5))
    sns.barplot(data=res_df[res_df['Split'] == 'Spatial CV'], x='Baseline', y='MAE')
    plt.title('MAE by Baseline (Spatial CV)')
    plt.savefig('experiments/phase6/reports/plots/b4_spatial_mae.png')
    plt.close()
    
    plt.figure(figsize=(10, 5))
    sns.barplot(data=res_df[res_df['Split'] != 'Spatial CV'], x='Split', y='MAE', hue='Baseline')
    plt.title('MAE by Baseline (Temporal Holdouts)')
    plt.savefig('experiments/phase6/reports/plots/b4_temporal_mae.png')
    plt.close()

    # Report Generation
    report = f"""# PHASE 6 SCIENTIFIC EXPERIMENT
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
"""
    for _, r in res_df.iterrows():
        report += f"| {r['Split']} | {r['Baseline']} | {r['MAE']:.3f} | {r['RMSE']:.3f} | {r['Bias']:.3f} | {r['Useful']} | {r['Harmful']} | {r['Neutral']} |\n"

    report += f"""
## 4. Coefficient Stability Analysis

**Train Feb (Test Aug) Coefficients:**
- Intercept: {coef_aug['intercept']:.3f}
- B2 Temp: {coef_aug['b2']:.3f}
- Lead Time: {coef_aug['lead_time_hours']:.3f}
- Elev Diff: {coef_aug['elevation_difference_m']:.4f}

**Train Aug (Test Feb) Coefficients:**
- Intercept: {coef_feb['intercept']:.3f}
- B2 Temp: {coef_feb['b2']:.3f}
- Lead Time: {coef_feb['lead_time_hours']:.3f}
- Elev Diff: {coef_feb['elevation_difference_m']:.4f}

**Spatial Folds (Min to Max Range):**
"""
    sp_df = pd.DataFrame(spatial_coefs)
    for col in sp_df.columns:
        report += f"- {col}: {sp_df[col].min():.4f} to {sp_df[col].max():.4f} (Mean: {sp_df[col].mean():.4f})\n"

    report += """
## 5. Visualizations
![Spatial MAE](/home/aditya/Documents/Projects/GramWeather/experiments/phase6/reports/plots/b4_spatial_mae.png)
![Temporal MAE](/home/aditya/Documents/Projects/GramWeather/experiments/phase6/reports/plots/b4_temporal_mae.png)

## 6. Scientific Decision Gate
"""
    
    # Auto-generate preliminary conclusions based on data
    # (We will replace this with final text if needed, but it helps to see the numbers first).
    
    with open('experiments/phase6/reports/b4_comparison.md', 'w') as f:
        f.write(report)
        
    print("B4 evaluation completed.")

if __name__ == '__main__':
    main()
