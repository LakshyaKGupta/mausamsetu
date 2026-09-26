import pandas as pd
import numpy as np

def classify_correction(imp, threshold=0.2):
    if imp > threshold: return 'USEFUL'
    elif imp < -threshold: return 'HARMFUL'
    else: return 'NEUTRAL'

def compute_metrics(df, pred_col, true_col):
    return {
        'mae': np.mean(np.abs(df[pred_col] - df[true_col])),
        'rmse': np.sqrt(np.mean((df[pred_col] - df[true_col])**2)),
        'bias': np.mean(df[pred_col] - df[true_col]),
        'median_ae': np.median(np.abs(df[pred_col] - df[true_col]))
    }

df = pd.read_csv('experiments/phase6/reports/baseline4_revised_predictions.csv')
print(f"Total October pairs: {len(df)}")

df['abs_err_B0'] = np.abs(df['baseline0_error_c'])
df['abs_err_B1'] = np.abs(df['baseline1_error_c'])
df['improvement_B1_over_B0'] = df['abs_err_B0'] - df['abs_err_B1']
df['correction_class_b1_vs_b0'] = df['improvement_B1_over_B0'].apply(classify_correction)

m0 = compute_metrics(df, 'baseline0_temperature_c', 'observed_temperature_c')
m1 = compute_metrics(df, 'baseline1_temperature_c', 'observed_temperature_c')

print(f"B0 MAE: {m0['mae']:.3f}, RMSE: {m0['rmse']:.3f}, Bias: {m0['bias']:.3f}")
print(f"B1 MAE: {m1['mae']:.3f}, RMSE: {m1['rmse']:.3f}, Bias: {m1['bias']:.3f}")

counts = df['correction_class_b1_vs_b0'].value_counts()
print(f"USEFUL: {counts.get('USEFUL', 0)}")
print(f"HARMFUL: {counts.get('HARMFUL', 0)}")
print(f"NEUTRAL: {counts.get('NEUTRAL', 0)}")

print("\n--- By Station ---")
for stn in df['station_id'].unique():
    dfs = df[df['station_id'] == stn]
    sm0 = compute_metrics(dfs, 'baseline0_temperature_c', 'observed_temperature_c')
    sm1 = compute_metrics(dfs, 'baseline1_temperature_c', 'observed_temperature_c')
    print(f"Station {stn}: n={len(dfs)}, B0 MAE={sm0['mae']:.3f}, B1 MAE={sm1['mae']:.3f}, Diff={sm0['mae']-sm1['mae']:.3f}")

print("\n--- By Lead Time ---")
for lt in sorted(df['lead_time_hours'].unique()):
    dflt = df[df['lead_time_hours'] == lt]
    lm0 = compute_metrics(dflt, 'baseline0_temperature_c', 'observed_temperature_c')
    lm1 = compute_metrics(dflt, 'baseline1_temperature_c', 'observed_temperature_c')
    print(f"Lead {lt}h: n={len(dflt)}, B0 MAE={lm0['mae']:.3f}, B1 MAE={lm1['mae']:.3f}, Diff={lm0['mae']-lm1['mae']:.3f}")
