# Phase 7: Reliability / Fallback Comparison Report

## 1. Objective
Compare three operational strategies across temporal and spatial holdouts:
1. **Always B0** — raw GFS reference
2. **Always B2** — physical lapse-rate correction applied unconditionally
3. **Gated B2** — use B2 only when elevation difference signal indicates reliability; otherwise fall back to B0

---

## 2. Best Candidate Rule: `elevation_difference_m > threshold`
Derived from training data only. Threshold derived on Feb data and applied to Aug holdout (and vice versa).
- **Derived threshold (Feb → Aug)**: elevation_difference_m > 30.78 m
- **Derived threshold (Aug → Feb)**: elevation_difference_m > 30.78 m

The rule says: **apply B2 when the station is substantially higher than the GFS reference grid cell**. This is physically sensible — a fixed lapse rate adds most value where the elevation gradient is large and unambiguous.

---

## 3. Temporal Holdout Results

| Split | Strategy | n | MAE (°C) | RMSE (°C) | Bias (°C) |
|---|---|---|---|---|---|
| Train Feb → **Test Aug** | B0 | 785 | 1.531 | 1.838 | -1.048 |
| Train Feb → **Test Aug** | B2 | 785 | 1.364 | 1.651 | -1.150 |
| Train Feb → **Test Aug** | Gated B2 (elev > 30.78m) | 785 | **1.467** | 1.726 | -1.088 |
| Train Aug → **Test Feb** | B0 | 875 | 1.861 | 2.550 | +0.912 |
| Train Aug → **Test Feb** | B2 | 875 | 1.726 | 2.422 | +0.822 |
| Train Aug → **Test Feb** | Gated B2 (elev > 30.78m) | 875 | **1.700** | 2.391 | +0.833 |

### Correction Impact (Temporal Holdouts)

| Split | Strategy | Fallback Rate | Harmful Avoided | Useful Suppressed |
|---|---|---|---|---|
| Test Aug | Gated B2 | **90.3%** | 68.5% | 78.5% |
| Test Feb | Gated B2 | **91.2%** | 92.0% | 59.7% |

### Interpretation (Temporal)
- The gated strategy improves MAE over B2 only in February (1.726 → 1.700), producing a modest genuine improvement.
- In August, the gated strategy **degrades** MAE relative to always-B2 (1.364 → 1.467), meaning the fallback is too aggressive — it withholds a beneficial correction too often.
- The fallback rate of ~90% means the rule is almost always falling back to B0, severely suppressing useful B2 corrections (78.5% of useful cases suppressed in August).

---

## 4. Spatial Cross-Validation Results (5-Fold, Averaged)

| Rule | Feature | Direction | Avg MAE B0 | Avg MAE B2 | Avg MAE Gated | Fallback Rate | Harmful Avoided | Useful Suppressed |
|---|---|---|---|---|---|---|---|---|
| Use B2 when elev_diff > threshold | elevation_difference_m | positive | 1.647 | 1.531 | **1.559** | 91.3% | 47.0% | 51.8% |
| Use B2 when GFS T < threshold | b0 | negative | 1.647 | 1.531 | 1.634 | 88.8% | 48.2% | 69.4% |
| Use B2 when elev_diff < threshold | elevation_difference_m | negative | 1.647 | 1.531 | 1.615 | 88.0% | 60.0% | 60.0% |
| Use B2 for shorter leads | lead_time_hours | negative | 1.647 | 1.531 | 1.647 | 100.0% | 80.0% | 80.0% |
| Use B2 when GFS T > threshold | b0 | positive | 1.647 | 1.531 | 1.648 | 89.5% | 75.9% | 77.1% |

### Interpretation (Spatial CV)
- In the spatial fold CV, the `elevation_difference_m > threshold` rule achieves an average MAE of 1.559 — better than B0 (1.647) but slightly worse than always-B2 (1.531). The fallback rate of 91% is still very high, indicating that the rule is gating away 51.8% of useful B2 cases.
- No rule improves on always-B2 across all spatial folds.

---

## 5. Lead-Time Stratification

The lead-time feature provides no discriminative power for reliability. USEFUL and HARMFUL correction rates are nearly identical across 12h, 24h, 36h, and 48h leads. Lead-time gating is not a viable strategy.

---

## 6. February vs August Breakdown

B2 is slightly more consistent in August (USEFUL 23.7%, HARMFUL 13.8%) vs February (USEFUL 17.6%, HARMFUL 15.7%). However, the difference is insufficient to justify season-based on/off switching as a reliable rule.

---

## 7. Station-Level Variation

The key discriminating factor is **elevation difference magnitude**. Stations with large elevation offsets from the GFS grid (e.g., high-elevation plateau stations) benefit most from B2, while stations near sea level or with small terrain differences receive near-neutral or harmful corrections from a fixed lapse rate.

---

## 8. Dependence and Robustness Limitations
- The 18 stations represent closely co-located airport/synoptic sites; they are **not** independent geographic samples.
- The `elevation_difference_m > 30.78m` threshold was derived from only 90-day equivalents of training data across a few elevation clusters, making it sensitive to station composition.
- Spatial fold results show the rule is consistent in direction (always closer to B2 than B0) but never achieves a decisive win.

---

## 9. Safety Check
- The gated strategy does not simply maximise fallback. At 90% fallback rate, it is essentially a near-full fallback to B0 with only occasional B2 applications.
- The useful correction suppression rate (59.7–78.5%) is too high for the rule to be called operationally useful.

---

## 10. Scientific Decision Gate

### Result: **NO-GO FOR CURRENT RULE SET**

The tested elevation-difference-based reliability rule does **not** provide a genuine, reproducible operational advantage:

- In the August temporal test: the rule degrades MAE versus always-B2 (1.364 → 1.467).
- In the February temporal test: the rule marginally improves MAE (1.726 → 1.700) — a 0.026 °C improvement that is within noise for this dataset.
- Spatial CV shows the rule sits between B0 and B2 but never beats B2.
- The rule suppresses too many useful B2 corrections (60–78%) while leaving a substantial fraction of harmful ones untouched.

### Current Operational Recommendation
- **B2 (Physical Lapse Rate)** remains the best available correction method.
- **B2 should not be applied unconditionally in production** without explicit acknowledgement of its limitations (245 harmful corrections in 1,660 evaluated records = 14.8% harmful rate).
- No simple prediction-time signal reliably discriminates useful from harmful corrections in this dataset.

### Path Forward
A reliable gating rule would require:
1. More geographic diversity (especially at extreme elevations — the >200m cluster has only 80 records).
2. Longer temporal coverage to distinguish stable elevation-correction relationships from seasonal anomalies.
3. Possibly non-linear gating based on terrain complexity or boundary-layer stability proxies — but these require physically justified input data not yet available in the pipeline.

**Phase 7 gate: NO-GO for automated reliability rule. B2 remains an experimental physical correction.**

---

## 11. Provenance
- **Dataset**: `experiments/phase6/reports/expanded_baseline_predictions.csv`
- **Prediction output**: `experiments/phase7/predictions/reliability_predictions.csv`
- **Script**: `run_phase7_reliability.py`
- **Timestamp**: 2023-09-20
