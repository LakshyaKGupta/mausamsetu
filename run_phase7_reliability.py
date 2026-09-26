"""
Phase 7 — Reliability / Fallback Experiment
Objective: Determine when B2 (physical lapse-rate correction) is reliable
           enough to apply versus when to fall back to B0 (raw GFS).

Scientific rules enforced throughout:
 - No future/observed temperature used in reliability decisions
 - All thresholds derived from training data only, applied to test data
 - Temporal and spatial holdouts match Phase 6 design
 - No ML models
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import KFold

# ──────────────────────────────────────────────
# CONSTANTS
# ──────────────────────────────────────────────
THRESHOLD = 0.2          # °C — same as all Phase 6 experiments
RANDOM_STATE = 42

# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────
def compute_metrics(y_true, y_pred):
    err = np.array(y_pred) - np.array(y_true)
    mae  = np.mean(np.abs(err))
    rmse = np.sqrt(np.mean(err**2))
    bias = np.mean(err)
    return mae, rmse, bias

def label_correction(ref_err_abs, b2_err_abs, thr=THRESHOLD):
    diff = ref_err_abs - b2_err_abs   # positive → B2 was better
    if   diff >  thr: return 'USEFUL'
    elif diff < -thr: return 'HARMFUL'
    else:             return 'NEUTRAL'

def label_series(df_):
    ref_abs = np.abs(df_['b0'] - df_['observed_temperature_c'])
    b2_abs  = np.abs(df_['b2'] - df_['observed_temperature_c'])
    return (ref_abs - b2_abs).apply(lambda d: label_correction(d, 0, 0)
                                    if False else
                                    ('USEFUL' if d > THRESHOLD else ('HARMFUL' if d < -THRESHOLD else 'NEUTRAL')))

def gated_b2(df_, rule_fn):
    """Apply reliability rule: use B2 if reliable, else B0."""
    use_b2 = rule_fn(df_)
    return np.where(use_b2, df_['b2'], df_['b0']), use_b2.sum(), (~use_b2).sum()

def summarise(split, strategy, df_, pred_series):
    mae, rmse, bias = compute_metrics(df_['observed_temperature_c'], pred_series)
    return dict(split=split, strategy=strategy, n=len(df_),
                mae=mae, rmse=rmse, bias=bias)

# ──────────────────────────────────────────────
# LOAD DATA
# ──────────────────────────────────────────────
df = pd.read_csv('experiments/phase6/reports/expanded_baseline_predictions.csv')
df['obs_dt'] = pd.to_datetime(df['observation_time'])
df['month']  = df['obs_dt'].dt.month

# Recompute B0 and B2 cleanly (they should already exist)
df['b0'] = df['gfs_temperature_c']
df['b2'] = df['b0'] - 0.0065 * df['elevation_difference_m']

# ──────────────────────────────────────────────
# STEP 1 — FEATURE AUDIT
# ──────────────────────────────────────────────
feature_audit = [
    # (feature, available_at_pred_time, scientifically_plausible, leakage_risk, decision)
    ('b0',                   True,  True,  False, 'KEEP — raw GFS temperature'),
    ('b2',                   True,  True,  False, 'KEEP — lapse-rate corrected temperature'),
    ('elevation_difference_m', True, True, False, 'KEEP — physical driver of lapse-rate correction magnitude'),
    ('lead_time_hours',      True,  True,  False, 'KEEP — forecast lead drives error growth'),
    ('station_lat',          True,  True,  False, 'KEEP — geographic position'),
    ('station_lon',          True,  True,  False, 'KEEP — geographic position'),
    ('station_elevation_m',  True,  True,  False, 'KEEP — station physical context'),
    ('gfs_reference_elevation_m', True, True, False, 'KEEP — GFS orography'),
    ('month',                True,  True,  False, 'KEEP — seasonal/regime indicator'),
    ('forecast_cycle',       True,  True,  False, 'KEEP — 00z vs 12z cycle'),
    ('observed_temperature_c', False, False, True, 'REJECT — future target, leakage'),
    ('b3_spatial',           False, False, True,  'REJECT — uses training observations'),
    ('b3_temporal',          False, False, True,  'REJECT — uses training observations'),
]

# ──────────────────────────────────────────────
# STEP 2 — LABEL EACH PREDICTION
# ──────────────────────────────────────────────
df['ref_abs_err'] = np.abs(df['b0'] - df['observed_temperature_c'])
df['b2_abs_err']  = np.abs(df['b2'] - df['observed_temperature_c'])
df['b2_label']    = label_series(df)
df['b2_improvement'] = df['ref_abs_err'] - df['b2_abs_err']

print("Label distribution:")
print(df['b2_label'].value_counts())
print(f"\nTotal: {len(df)}")

# ──────────────────────────────────────────────
# STEP 3 — EXPLORATORY ANALYSIS BY FEATURE BINS
# ──────────────────────────────────────────────

def useful_harmful_by_bin(df_, col, bins, labels):
    df_ = df_.copy()
    df_['bin'] = pd.cut(df_[col], bins=bins, labels=labels)
    grp = df_.groupby('bin')['b2_label'].value_counts(normalize=True).unstack(fill_value=0)
    grp['n'] = df_.groupby('bin').size()
    grp['mean_improvement'] = df_.groupby('bin')['b2_improvement'].mean()
    return grp

# Elevation difference bins
elev_analysis = useful_harmful_by_bin(
    df, 'elevation_difference_m',
    bins=[-1000, -200, -50, 50, 200, 1500],
    labels=['< -200m', '-200 to -50m', '-50 to 50m', '50 to 200m', '> 200m']
)

# Lead time bins
lead_analysis = useful_harmful_by_bin(
    df, 'lead_time_hours',
    bins=[0, 18, 30, 42, 55],
    labels=['12h', '24h', '36h', '48h']
)

# By month
month_analysis = df.groupby('month').apply(lambda g: pd.Series({
    'n': len(g),
    'USEFUL': (g['b2_label'] == 'USEFUL').mean(),
    'HARMFUL': (g['b2_label'] == 'HARMFUL').mean(),
    'NEUTRAL': (g['b2_label'] == 'NEUTRAL').mean(),
    'mean_improvement': g['b2_improvement'].mean(),
}))

# By elevation_difference bin: check seasonal stability
print("\nElevation Analysis:")
print(elev_analysis.to_string())
print("\nLead Time Analysis:")
print(lead_analysis.to_string())
print("\nMonth Analysis:")
print(month_analysis.to_string())

# ──────────────────────────────────────────────
# STEP 4 — DERIVE SIMPLE RELIABILITY RULES (training data only)
# ──────────────────────────────────────────────
# We will derive thresholds on Feb training data and evaluate on Aug held-out,
# and vice versa. Then aggregate across spatial CV folds.

def derive_threshold(train_df, feature, direction='positive'):
    """
    Find the threshold on `feature` that maximises:
       (harmful_prevented - useful_suppressed) 
    on training data.
    direction='positive' means: use B2 when feature > threshold.
    direction='negative' means: use B2 when feature < threshold.
    """
    candidate_thresholds = np.percentile(train_df[feature].dropna(),
                                         np.arange(10, 91, 5))
    best_score = -np.inf
    best_thr = None
    for thr in candidate_thresholds:
        if direction == 'positive':
            use_b2 = train_df[feature] > thr
        else:
            use_b2 = train_df[feature] < thr
        
        total_b2 = use_b2.sum()
        useful_kept = ((use_b2) & (train_df['b2_label'] == 'USEFUL')).sum()
        harmful_prevented = ((~use_b2) & (train_df['b2_label'] == 'HARMFUL')).sum()
        
        # Score = harmful prevented - useful suppressed (on training set)
        score = harmful_prevented - (use_b2 & (train_df['b2_label'] == 'HARMFUL')).sum()
        if score > best_score:
            best_score = score
            best_thr = thr
    return best_thr

# ──────────────────────────────────────────────
# STEP 5 — TEMPORAL VALIDATION
# ──────────────────────────────────────────────
feb_df = df[df['month'] == 2].copy()
aug_df = df[df['month'] == 8].copy()

rows = []  # collect all result rows

def evaluate_gated(split_name, train_df, test_df, rule_feature, direction, rule_label):
    """Derive rule on train, evaluate on test. Returns dict."""
    thr = derive_threshold(train_df, rule_feature, direction)
    if direction == 'positive':
        use_b2_mask = test_df[rule_feature] > thr
    else:
        use_b2_mask = test_df[rule_feature] < thr
    
    pred_gated = np.where(use_b2_mask, test_df['b2'], test_df['b0'])
    mae_g, rmse_g, bias_g = compute_metrics(test_df['observed_temperature_c'], pred_gated)
    mae_b0, rmse_b0, bias_b0 = compute_metrics(test_df['observed_temperature_c'], test_df['b0'])
    mae_b2, rmse_b2, bias_b2 = compute_metrics(test_df['observed_temperature_c'], test_df['b2'])
    
    # Correction quality on test set
    harmful_b2_total = (test_df['b2_label'] == 'HARMFUL').sum()
    useful_b2_total  = (test_df['b2_label'] == 'USEFUL').sum()
    
    # Of harmful B2 cases: how many did we fall back (avoid)?
    harmful_avoided = ((~use_b2_mask) & (test_df['b2_label'] == 'HARMFUL')).sum()
    # Of useful B2 cases: how many did we suppress?
    useful_suppressed = ((~use_b2_mask) & (test_df['b2_label'] == 'USEFUL')).sum()
    
    fallback_rate = (~use_b2_mask).mean()
    
    return {
        'split': split_name, 'rule': rule_label, 'feature': rule_feature,
        'threshold': round(thr, 3), 'direction': direction,
        'n_test': len(test_df),
        'n_use_b2': int(use_b2_mask.sum()), 'n_fallback': int((~use_b2_mask).sum()),
        'fallback_rate_pct': round(fallback_rate * 100, 1),
        'mae_b0': round(mae_b0, 3), 'mae_b2': round(mae_b2, 3), 'mae_gated': round(mae_g, 3),
        'rmse_b0': round(rmse_b0, 3), 'rmse_b2': round(rmse_b2, 3), 'rmse_gated': round(rmse_g, 3),
        'bias_b0': round(bias_b0, 3), 'bias_b2': round(bias_b2, 3), 'bias_gated': round(bias_g, 3),
        'harmful_b2_total': int(harmful_b2_total),
        'useful_b2_total': int(useful_b2_total),
        'harmful_avoided': int(harmful_avoided),
        'useful_suppressed': int(useful_suppressed),
        'harmful_avoided_pct': round(100 * harmful_avoided / max(harmful_b2_total, 1), 1),
        'useful_suppressed_pct': round(100 * useful_suppressed / max(useful_b2_total, 1), 1),
    }

# Test all candidate features
candidate_rules = [
    ('elevation_difference_m', 'positive', 'Use B2 when elev_diff > threshold'),
    ('elevation_difference_m', 'negative', 'Use B2 when elev_diff < threshold'),
    ('lead_time_hours',        'negative', 'Use B2 for shorter leads'),
    ('b0',                     'positive', 'Use B2 when GFS T > threshold'),
    ('b0',                     'negative', 'Use B2 when GFS T < threshold'),
]

# Temporal: Train Feb → Test Aug
for feat, direction, label in candidate_rules:
    r = evaluate_gated('Temporal (Train Feb, Test Aug)', feb_df, aug_df, feat, direction, label)
    rows.append(r)

# Temporal: Train Aug → Test Feb
for feat, direction, label in candidate_rules:
    r = evaluate_gated('Temporal (Train Aug, Test Feb)', aug_df, feb_df, feat, direction, label)
    rows.append(r)

# ──────────────────────────────────────────────
# STEP 5b — SPATIAL CV VALIDATION
# ──────────────────────────────────────────────
stations = df['station_id'].unique()
kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

spatial_fold_rows = []
for fold_i, (tr_idx, te_idx) in enumerate(kf.split(stations)):
    train_stns = stations[tr_idx]
    test_stns  = stations[te_idx]
    train_df   = df[df['station_id'].isin(train_stns)].copy()
    test_df    = df[df['station_id'].isin(test_stns)].copy()
    
    for feat, direction, label in candidate_rules:
        r = evaluate_gated(f'Spatial Fold {fold_i+1}', train_df, test_df, feat, direction, label)
        r['fold'] = fold_i + 1
        spatial_fold_rows.append(r)

spatial_df = pd.DataFrame(spatial_fold_rows)
# Average across spatial folds
spatial_avg = spatial_df.groupby(['rule', 'feature', 'direction'])[
    ['mae_b0', 'mae_b2', 'mae_gated', 'fallback_rate_pct',
     'harmful_avoided_pct', 'useful_suppressed_pct']].mean().round(3)

# ──────────────────────────────────────────────
# SAVE PREDICTIONS WITH GATED COLUMN
# ──────────────────────────────────────────────
# Choose the best candidate rule found empirically:
# We'll pick elevation_difference_m positive (use B2 when station is higher than GFS)
# on the temporal splits and compute final gated predictions.

# Derive on Feb training data → apply to Aug
best_feat = 'elevation_difference_m'
best_dir  = 'positive'
thr_feb_to_aug = derive_threshold(feb_df, best_feat, best_dir)
thr_aug_to_feb = derive_threshold(aug_df, best_feat, best_dir)

df['use_b2_temporal_feb_to_aug'] = False
df['use_b2_temporal_aug_to_feb'] = False
df.loc[df['month'] == 8, 'use_b2_temporal_feb_to_aug'] = df.loc[df['month'] == 8, best_feat] > thr_feb_to_aug
df.loc[df['month'] == 2, 'use_b2_temporal_aug_to_feb'] = df.loc[df['month'] == 2, best_feat] > thr_aug_to_feb
df['pred_gated_aug'] = np.where(df['use_b2_temporal_feb_to_aug'], df['b2'], df['b0'])
df['pred_gated_feb'] = np.where(df['use_b2_temporal_aug_to_feb'], df['b2'], df['b0'])

df.to_csv('experiments/phase7/predictions/reliability_predictions.csv', index=False)

# ──────────────────────────────────────────────
# PLOTS
# ──────────────────────────────────────────────
os.makedirs('experiments/phase7/plots', exist_ok=True)

# Plot 1: Useful/Harmful rates by elevation difference
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
fig.suptitle('PHASE 7 SCIENTIFIC EXPERIMENT — B2 Correction Quality by Feature', fontsize=12)

ax = axes[0]
elev_plot = elev_analysis[['USEFUL', 'HARMFUL', 'NEUTRAL']].dropna()
elev_plot.plot(kind='bar', ax=ax, color=['#2ecc71', '#e74c3c', '#95a5a6'], rot=30)
ax.set_title('B2 Correction Quality by Elevation Difference Bin')
ax.set_ylabel('Fraction of cases')
ax.set_xlabel('Elevation Difference (station - GFS)')
ax.legend(loc='upper right', fontsize=8)
ax.tick_params(axis='x', labelsize=8)

ax = axes[1]
lead_plot = lead_analysis[['USEFUL', 'HARMFUL', 'NEUTRAL']].dropna()
lead_plot.plot(kind='bar', ax=ax, color=['#2ecc71', '#e74c3c', '#95a5a6'], rot=0)
ax.set_title('B2 Correction Quality by Lead Time')
ax.set_ylabel('Fraction of cases')
ax.set_xlabel('Lead Time')
ax.legend(loc='upper right', fontsize=8)

plt.tight_layout()
plt.savefig('experiments/phase7/plots/useful_harmful_by_feature.png', dpi=150)
plt.close()

# Plot 2: MAE comparison B0 vs B2 vs Gated (Temporal)
results_df = pd.DataFrame(rows)
best_rule_rows = results_df[results_df['feature'] == 'elevation_difference_m']

fig, ax = plt.subplots(figsize=(10, 5))
ax.set_title('PHASE 7 SCIENTIFIC EXPERIMENT — MAE: B0 vs B2 vs Gated-B2 (Temporal Holdouts)')
x = np.arange(len(best_rule_rows))
width = 0.25
ax.bar(x - width, best_rule_rows['mae_b0'], width, label='B0 (Raw GFS)', color='#3498db', alpha=0.8)
ax.bar(x,         best_rule_rows['mae_b2'], width, label='B2 (Lapse Rate)', color='#e67e22', alpha=0.8)
ax.bar(x + width, best_rule_rows['mae_gated'], width, label='Gated B2 (Reliability Rule)', color='#2ecc71', alpha=0.8)
ax.set_xticks(x)
ax.set_xticklabels([f"{r['split']}\n({r['direction']} {r['feature']})"
                    for _, r in best_rule_rows.iterrows()], fontsize=7, rotation=15)
ax.set_ylabel('MAE (°C)')
ax.legend()
plt.tight_layout()
plt.savefig('experiments/phase7/plots/b0_b2_fallback_mae.png', dpi=150)
plt.close()

# Plot 3: Fallback rate by rule
fig, ax = plt.subplots(figsize=(10, 5))
best_rule = results_df[results_df['feature'] == 'elevation_difference_m'].head(4)
ax.bar(range(len(best_rule)), best_rule['fallback_rate_pct'], color='#9b59b6', alpha=0.8)
ax.set_xticks(range(len(best_rule)))
ax.set_xticklabels([f"{r['split'][:30]}\n{r['direction']}" for _, r in best_rule.iterrows()], fontsize=7)
ax.set_ylabel('Fallback Rate (%)')
ax.set_title('PHASE 7 SCIENTIFIC EXPERIMENT — Fallback Rate by Rule and Split')
plt.tight_layout()
plt.savefig('experiments/phase7/plots/fallback_rate.png', dpi=150)
plt.close()

# Plot 4: Spatial fold stability
fig, ax = plt.subplots(figsize=(10, 5))
best_spatial = spatial_df[spatial_df['feature'] == 'elevation_difference_m']
pivot = best_spatial.groupby(['fold', 'direction'])[['mae_b2', 'mae_gated']].mean()
pivot.unstack().plot(kind='bar', ax=ax, rot=0)
ax.set_title('PHASE 7 SCIENTIFIC EXPERIMENT — Spatial Fold Stability')
ax.set_ylabel('MAE (°C)')
ax.set_xlabel('Fold')
plt.tight_layout()
plt.savefig('experiments/phase7/plots/fold_stability.png', dpi=150)
plt.close()

# ──────────────────────────────────────────────
# PRINT SUMMARY STATISTICS
# ──────────────────────────────────────────────
print("\n=== TEMPORAL RESULTS (elev_diff feature) ===")
print(results_df[results_df['feature'] == 'elevation_difference_m'][
    ['split', 'direction', 'threshold', 'mae_b0', 'mae_b2', 'mae_gated',
     'fallback_rate_pct', 'harmful_avoided_pct', 'useful_suppressed_pct']].to_string(index=False))

print("\n=== SPATIAL CV AVERAGE (elev_diff feature) ===")
print(spatial_avg.to_string())

print("\nDone.")
