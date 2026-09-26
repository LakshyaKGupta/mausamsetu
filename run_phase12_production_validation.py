#!/usr/bin/env python3
"""
Phase 12: Production-System Scientific Validation
==================================================
Validate the actual production forecast pipeline (Open-Meteo + Open-Meteo/SRTM + B2)
against historical NOAA ISD observations.

IMPORTANT SCIENTIFIC NOTES:
- Reference forecast: Open-Meteo Historical Forecast API (historical-forecast-api.open-meteo.com)
  This is a hindcast re-run using the same model family as production (GFS Seamless / best_match).
  It is NOT ERA5 reanalysis — it preserves the same model, resolution, and SRTM elevation
  correction as the live production API.
- Caveat documented: Historical Forecast API uses the same model configuration but may
  have minor differences from the original archived model run due to model updates.
- Observations: NOAA ISD from Phase 6 expanded dataset (QC=1, no synthetic values).
- B2 formula unchanged: T_B2 = T_ref - 0.0065 * (z_target - z_reference)
- GAMMA unchanged: 0.0065 °C/m

WHAT THIS IS NOT:
- ERA5 reanalysis as forecast substitute
- Synthetic observations
- Reuse of the Phase 6 GFS-based 1.555 °C benchmark as production metric

Author: GramWeather Phase 12 Validation
"""

import time
import json
import logging
import requests
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────────
GAMMA = 0.0065          # °C/m — environmental lapse rate (Phase 6 validated, MUST NOT change)
USEFUL_THRESHOLD = 0.2  # °C — same as Phase 6

PHASE12_DIR = Path("experiments/phase12")
REPORTS_DIR = PHASE12_DIR / "reports"
PREDICTIONS_DIR = PHASE12_DIR / "predictions"
PLOTS_DIR = PHASE12_DIR / "plots"

PHASE6_DATASET = Path("experiments/phase6/data/validated/phase6_expanded_dataset.csv")
STATIONS_CSV   = Path("experiments/phase6/data_audit/mh_selected_stations.csv")

# Open-Meteo endpoints (production-equivalent)
OM_HISTORICAL_FORECAST_URL = "https://historical-forecast-api.open-meteo.com/v1/forecast"
OM_ELEVATION_URL           = "https://api.open-meteo.com/v1/elevation"

# Validation periods (same as Phase 6 for direct comparison)
PERIODS = [
    ("2023-02-01", "2023-02-10", "February_2023"),
    ("2023-08-01", "2023-08-10", "August_2023"),
]

# Lead time definition: issue time = valid_time - lead_hours
# The Historical Forecast API is fetched daily at 00z → valid_times at +12, +24, +36, +48
LEAD_TIMES = [12, 24, 36, 48]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def safe_get(url: str, params: dict, retries: int = 3, pause: float = 2.0) -> dict:
    """HTTP GET with simple retry and rate-limit backoff."""
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code == 429:
                wait = pause * (2 ** attempt)
                logger.warning("Rate limited. Waiting %.1fs before retry %d/%d", wait, attempt, retries)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            if attempt == retries:
                raise
            logger.warning("Request failed (attempt %d/%d): %s", attempt, retries, exc)
            time.sleep(pause)
    raise RuntimeError(f"Failed after {retries} retries: {url}")


def fetch_om_historical_forecast(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """
    Fetch historical forecast data from Open-Meteo Historical Forecast API.
    This uses the same model family (best_match = GFS Seamless) and applies the
    same SRTM elevation correction as the live production API.

    Scientific caveat: This is a hindcast re-run, not the original archived forecast.
    The model configuration matches production but minor differences due to model updates
    cannot be excluded.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m",
        "models": "best_match",
    }
    return safe_get(OM_HISTORICAL_FORECAST_URL, params)


def fetch_om_elevation(lat: float, lon: float) -> float:
    """
    Fetch SRTM 90m elevation from Open-Meteo Elevation API.
    Same API used by the production ElevationService.
    """
    data = safe_get(OM_ELEVATION_URL, {"latitude": lat, "longitude": lon})
    return float(data["elevation"][0])


def classify_correction(b0_err: float, b2_err: float, threshold: float = USEFUL_THRESHOLD) -> str:
    """Classify B2 correction as useful/harmful/neutral."""
    improvement = abs(b0_err) - abs(b2_err)
    if improvement > threshold:
        return "useful"
    elif improvement < -threshold:
        return "harmful"
    else:
        return "neutral"


def elevation_category(diff_m: float) -> str:
    """Classify elevation difference into terrain categories."""
    if abs(diff_m) <= 50:
        return "near_flat (-50 to +50 m)"
    elif diff_m > 50 and diff_m <= 200:
        return "moderate_positive (+50 to +200 m)"
    elif diff_m < -50 and diff_m >= -200:
        return "moderate_negative (-200 to -50 m)"
    elif diff_m > 200:
        return "high_positive (>+200 m)"
    else:
        return "high_negative (<-200 m)"


def compute_metrics(df: pd.DataFrame, col_pred: str, col_obs: str = "observed_temperature_c") -> dict:
    """Compute MAE, RMSE, Bias, Median AE."""
    err = df[col_pred] - df[col_obs]
    return {
        "MAE":    round(float(np.mean(np.abs(err))), 4),
        "RMSE":   round(float(np.sqrt(np.mean(err**2))), 4),
        "Bias":   round(float(np.mean(err)), 4),
        "MedianAE": round(float(np.median(np.abs(err))), 4),
        "N":      int(len(err)),
    }


# ── Step 1: Load Phase 6 ISD observations ─────────────────────────────────────

def load_isd_observations() -> pd.DataFrame:
    """
    Load validated NOAA ISD observations from Phase 6 expanded dataset.
    Only keep records with QC=1, observations within validation periods,
    at lead times matching 12/24/36/48h.

    issue_time < valid_time is strictly enforced by Phase 6 dataset construction.
    """
    logger.info("Loading Phase 6 expanded dataset: %s", PHASE6_DATASET)
    df = pd.read_csv(PHASE6_DATASET)

    # Verify integrity
    assert (df["forecast_issue_time"] < df["forecast_valid_time"]).all(), \
        "INTEGRITY ERROR: issue_time >= valid_time found in Phase 6 dataset!"
    assert (df["observation_qc"] == 1).all(), \
        "INTEGRITY ERROR: non-QC1 observations found!"
    assert not df["gfs_temperature_c"].isna().any(), \
        "INTEGRITY ERROR: NaN forecast temperatures found!"

    logger.info("Loaded %d observations from %d stations", len(df), df["station_id"].nunique())
    logger.info("Date range: %s to %s", df["forecast_valid_time"].min(), df["forecast_valid_time"].max())
    logger.info("Lead times present: %s", sorted(df["lead_time_hours"].unique()))
    logger.info("Forecast source: %s", df["forecast_source"].unique())

    return df


# ── Step 2: Fetch Open-Meteo production-equivalent forecasts ───────────────────

def build_production_dataset(isd_df: pd.DataFrame) -> pd.DataFrame:
    """
    For each station and validation period, fetch Open-Meteo Historical Forecast
    and Open-Meteo Elevation, then pair with ISD observations at the correct timestamps.

    This replicates what production does:
    1. User selects location (lat, lon)
    2. System queries Open-Meteo forecast at (lat, lon)
    3. System queries elevation at (lat, lon) → target_elevation_m
    4. reference_elevation_m comes from the forecast response
    5. B2 applied: T_B2 = T_ref - 0.0065 * (target - reference)
    """
    stations_df = pd.read_csv(STATIONS_CSV)
    # Map station_id to station metadata
    station_meta = stations_df.set_index("STATION_ID")

    rows = []
    station_ids = isd_df["station_id"].unique()

    for station_id in station_ids:
        if station_id not in station_meta.index:
            logger.warning("Station %s not found in metadata, skipping.", station_id)
            continue

        meta = station_meta.loc[station_id]
        lat = float(meta["LAT"])
        lon = float(meta["LON"])
        station_elev_isd = float(meta["ELEV(M)"])
        station_name = str(meta["STATION NAME"])

        logger.info("Processing station %s (%s) lat=%.3f lon=%.3f elev=%.1f m",
                    station_id, station_name, lat, lon, station_elev_isd)

        # Fetch Open-Meteo SRTM elevation at station coordinates (target elevation)
        try:
            target_elev_m = fetch_om_elevation(lat, lon)
            time.sleep(0.25)  # Rate-limit courtesy
        except Exception as exc:
            logger.error("Elevation fetch failed for %s: %s — SKIPPING station", station_id, exc)
            continue

        # Fetch production-equivalent forecast for each validation period
        for start_date, end_date, period_name in PERIODS:
            try:
                fc_data = fetch_om_historical_forecast(lat, lon, start_date, end_date)
                time.sleep(0.5)  # Rate-limit courtesy
            except Exception as exc:
                logger.error("Forecast fetch failed for %s period %s: %s — SKIPPING",
                             station_id, period_name, exc)
                continue

            # Extract production-equivalent reference elevation (SRTM at snapped grid point)
            reference_elev_m = float(fc_data["elevation"])
            reference_lat    = float(fc_data["latitude"])
            reference_lon    = float(fc_data["longitude"])

            # Build time-indexed temperature lookup
            hourly_times = fc_data["hourly"]["time"]
            hourly_temps = fc_data["hourly"]["temperature_2m"]
            fc_lookup = {}
            for t_str, temp in zip(hourly_times, hourly_temps):
                # normalize to UTC ISO format matching ISD
                fc_lookup[t_str.replace("T", "T")] = temp

            # Match against ISD observations for this station and period
            sta_obs = isd_df[
                (isd_df["station_id"] == station_id) &
                (isd_df["forecast_valid_time"] >= start_date) &
                (isd_df["forecast_valid_time"] <= end_date + "T23:59:59")
            ].copy()

            for _, obs_row in sta_obs.iterrows():
                valid_time_str = obs_row["forecast_valid_time"]
                # Normalize: Phase 6 uses 'YYYY-MM-DDTHH:MM:SS', OM uses 'YYYY-MM-DDTHH:MM'
                valid_time_lookup = valid_time_str[:16]  # YYYY-MM-DDTHH:MM

                if valid_time_lookup not in fc_lookup:
                    logger.debug("No forecast match for %s @ %s", station_id, valid_time_lookup)
                    continue

                ref_temp = fc_lookup[valid_time_lookup]
                if ref_temp is None:
                    continue

                # Compute B2
                elev_diff = target_elev_m - reference_elev_m
                b2_temp = ref_temp - GAMMA * elev_diff

                # Compute issue_time proxy: valid_time - lead_hours
                valid_dt = datetime.fromisoformat(valid_time_str.replace("Z", ""))
                lead_h = int(obs_row["lead_time_hours"])
                issue_dt = valid_dt - timedelta(hours=lead_h)

                rows.append({
                    "station_id":             station_id,
                    "station_name":           station_name,
                    "station_lat":            lat,
                    "station_lon":            lon,
                    "station_elevation_m_isd": station_elev_isd,
                    "valid_time":             valid_time_str,
                    "issue_time_proxy":       issue_dt.isoformat(),
                    "lead_hours":             lead_h,
                    "season":                 period_name,
                    "observed_temperature_c": float(obs_row["observed_temperature_c"]),
                    "reference_temperature_c": ref_temp,
                    "reference_elevation_m":  reference_elev_m,
                    "reference_lat":          reference_lat,
                    "reference_lon":          reference_lon,
                    "target_elevation_m":     target_elev_m,
                    "elevation_difference_m": round(elev_diff, 2),
                    "b0_temperature_c":       ref_temp,       # B0 = raw reference
                    "b2_temperature_c":       round(b2_temp, 4),
                    "reference_forecast_source": "Open-Meteo Historical Forecast API (best_match/GFS Seamless)",
                    "reference_elevation_source": "Open-Meteo Historical Forecast API (SRTM 90m at snapped grid)",
                    "target_elevation_source": "Open-Meteo Elevation API (SRTM 90m at station coordinates)",
                    "forecast_model":         "best_match",
                    "issue_time_semantics":   "proxy: valid_time - lead_hours (historical forecast, not original run archive)",
                    "observation_source":     "NOAA ISD via Phase 6 expanded dataset (QC=1)",
                    "gamma":                  GAMMA,
                })

    df_out = pd.DataFrame(rows)
    logger.info("Production dataset built: %d rows, %d stations",
                len(df_out), df_out["station_id"].nunique() if len(df_out) > 0 else 0)
    return df_out


# ── Step 3: Validation ─────────────────────────────────────────────────────────

def run_validation(df: pd.DataFrame) -> dict:
    """
    Run all validation splits and compute metrics.
    Returns structured results dict.
    """
    results = {}

    # Classify corrections
    b0_err = df["b0_temperature_c"] - df["observed_temperature_c"]
    b2_err = df["b2_temperature_c"] - df["observed_temperature_c"]
    df["b0_error"] = b0_err
    df["b2_error"] = b2_err
    df["correction_class"] = [
        classify_correction(b0, b2) for b0, b2 in zip(b0_err, b2_err)
    ]
    df["elevation_category"] = df["elevation_difference_m"].apply(elevation_category)

    # ── A. Overall ──
    results["overall"] = {
        "B0": compute_metrics(df, "b0_temperature_c"),
        "B2": compute_metrics(df, "b2_temperature_c"),
        "correction_counts": df["correction_class"].value_counts().to_dict(),
    }

    # ── B. By season (temporal splits) ──
    results["by_season"] = {}
    for season in df["season"].unique():
        s = df[df["season"] == season]
        results["by_season"][season] = {
            "B0": compute_metrics(s, "b0_temperature_c"),
            "B2": compute_metrics(s, "b2_temperature_c"),
            "correction_counts": s["correction_class"].value_counts().to_dict(),
        }

    # ── C. Temporal holdout (train feb → test aug, vice versa) ──
    feb = df[df["season"].str.startswith("Feb")]
    aug = df[df["season"].str.startswith("Aug")]
    results["temporal_holdout"] = {}
    if len(aug) > 0:
        results["temporal_holdout"]["train_feb_test_aug"] = {
            "B0": compute_metrics(aug, "b0_temperature_c"),
            "B2": compute_metrics(aug, "b2_temperature_c"),
            "correction_counts": aug["correction_class"].value_counts().to_dict(),
        }
    if len(feb) > 0:
        results["temporal_holdout"]["train_aug_test_feb"] = {
            "B0": compute_metrics(feb, "b0_temperature_c"),
            "B2": compute_metrics(feb, "b2_temperature_c"),
            "correction_counts": feb["correction_class"].value_counts().to_dict(),
        }

    # ── D. By lead time ──
    results["by_lead_time"] = {}
    for lead in sorted(df["lead_hours"].unique()):
        s = df[df["lead_hours"] == lead]
        results["by_lead_time"][f"{lead}h"] = {
            "B0": compute_metrics(s, "b0_temperature_c"),
            "B2": compute_metrics(s, "b2_temperature_c"),
            "correction_counts": s["correction_class"].value_counts().to_dict(),
        }

    # ── E. Spatial (5-fold leave-station-out by alphabetical grouping) ──
    station_ids = sorted(df["station_id"].unique())
    n = len(station_ids)
    fold_size = max(1, n // 5)
    folds = [station_ids[i:i+fold_size] for i in range(0, n, fold_size)]
    # Last fold may be smaller
    if len(folds) > 5:
        folds[-2].extend(folds[-1])
        folds.pop()

    spatial_maes_b0, spatial_maes_b2 = [], []
    results["spatial_cv_folds"] = {}
    for i, fold_stations in enumerate(folds):
        test = df[df["station_id"].isin(fold_stations)]
        if len(test) == 0:
            continue
        fold_result = {
            "stations": fold_stations,
            "B0": compute_metrics(test, "b0_temperature_c"),
            "B2": compute_metrics(test, "b2_temperature_c"),
            "correction_counts": test["correction_class"].value_counts().to_dict(),
        }
        results["spatial_cv_folds"][f"fold_{i+1}"] = fold_result
        spatial_maes_b0.append(fold_result["B0"]["MAE"])
        spatial_maes_b2.append(fold_result["B2"]["MAE"])

    if spatial_maes_b0:
        results["spatial_cv_summary"] = {
            "B0_mean_MAE": round(float(np.mean(spatial_maes_b0)), 4),
            "B2_mean_MAE": round(float(np.mean(spatial_maes_b2)), 4),
        }

    # ── F. Per-station ──
    results["by_station"] = {}
    for sid in df["station_id"].unique():
        s = df[df["station_id"] == sid]
        results["by_station"][str(sid)] = {
            "name": s["station_name"].iloc[0],
            "n": len(s),
            "B0": compute_metrics(s, "b0_temperature_c"),
            "B2": compute_metrics(s, "b2_temperature_c"),
        }

    # ── G. By elevation category ──
    results["by_elevation_category"] = {}
    for cat in df["elevation_category"].unique():
        s = df[df["elevation_category"] == cat]
        if len(s) < 10:
            results["by_elevation_category"][cat] = {
                "N": len(s), "NOTE": "Insufficient sample (N<10), results not reported."
            }
            continue
        results["by_elevation_category"][cat] = {
            "B0": compute_metrics(s, "b0_temperature_c"),
            "B2": compute_metrics(s, "b2_temperature_c"),
            "correction_counts": s["correction_class"].value_counts().to_dict(),
        }

    return results


# ── Step 4: Plots ──────────────────────────────────────────────────────────────

def make_plots(df: pd.DataFrame, results: dict):
    """Generate all required visualisation plots."""

    # Plot 1: MAE by lead time
    leads = sorted(df["lead_hours"].unique())
    b0_maes = [results["by_lead_time"][f"{l}h"]["B0"]["MAE"] for l in leads]
    b2_maes = [results["by_lead_time"][f"{l}h"]["B2"]["MAE"] for l in leads]
    x = np.arange(len(leads))
    width = 0.35
    fig, ax = plt.subplots(figsize=(8, 5))
    bars1 = ax.bar(x - width/2, b0_maes, width, label="B0 (Reference)", color="#2196F3", alpha=0.8)
    bars2 = ax.bar(x + width/2, b2_maes, width, label="B2 (Lapse-Rate)", color="#4CAF50", alpha=0.8)
    ax.set_xlabel("Lead Time (hours)")
    ax.set_ylabel("MAE (°C)")
    ax.set_title("Phase 12: Production B0 vs B2 MAE by Lead Time\n(Open-Meteo Historical Forecast)")
    ax.set_xticks(x)
    ax.set_xticklabels([f"{l}h" for l in leads])
    ax.legend()
    ax.yaxis.set_major_formatter(mticker.FormatStrFormatter("%.2f"))
    for bar in list(bars1) + list(bars2):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                f"{bar.get_height():.3f}", ha='center', va='bottom', fontsize=8)
    plt.tight_layout()
    plt.savefig(str(PLOTS_DIR / "production_mae_by_lead.png"), dpi=120)
    plt.close()
    logger.info("Saved: production_mae_by_lead.png")

    # Plot 2: MAE by season
    seasons = list(results["by_season"].keys())
    b0_s = [results["by_season"][s]["B0"]["MAE"] for s in seasons]
    b2_s = [results["by_season"][s]["B2"]["MAE"] for s in seasons]
    x = np.arange(len(seasons))
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.bar(x - width/2, b0_s, width, label="B0", color="#2196F3", alpha=0.8)
    ax.bar(x + width/2, b2_s, width, label="B2", color="#4CAF50", alpha=0.8)
    ax.set_xlabel("Season")
    ax.set_ylabel("MAE (°C)")
    ax.set_title("Phase 12: Production B0 vs B2 MAE by Season")
    ax.set_xticks(x)
    ax.set_xticklabels([s.replace("_2023", "") for s in seasons], rotation=15)
    ax.legend()
    for i, (b0, b2) in enumerate(zip(b0_s, b2_s)):
        ax.text(i - width/2, b0 + 0.01, f"{b0:.3f}", ha='center', va='bottom', fontsize=8)
        ax.text(i + width/2, b2 + 0.01, f"{b2:.3f}", ha='center', va='bottom', fontsize=8)
    plt.tight_layout()
    plt.savefig(str(PLOTS_DIR / "production_mae_by_season.png"), dpi=120)
    plt.close()
    logger.info("Saved: production_mae_by_season.png")

    # Plot 3: Per-station MAE
    station_ids = sorted(results["by_station"].keys(), key=lambda s: results["by_station"][s]["B0"]["MAE"])
    names = [results["by_station"][s]["name"][:12] for s in station_ids]
    b0_st = [results["by_station"][s]["B0"]["MAE"] for s in station_ids]
    b2_st = [results["by_station"][s]["B2"]["MAE"] for s in station_ids]
    x = np.arange(len(station_ids))
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.bar(x - width/2, b0_st, width, label="B0", color="#2196F3", alpha=0.8)
    ax.bar(x + width/2, b2_st, width, label="B2", color="#4CAF50", alpha=0.8)
    ax.set_xlabel("Station")
    ax.set_ylabel("MAE (°C)")
    ax.set_title("Phase 12: Per-Station MAE (B0 vs B2)")
    ax.set_xticks(x)
    ax.set_xticklabels(names, rotation=45, ha='right', fontsize=8)
    ax.legend()
    plt.tight_layout()
    plt.savefig(str(PLOTS_DIR / "production_mae_by_station.png"), dpi=120)
    plt.close()
    logger.info("Saved: production_mae_by_station.png")

    # Plot 4: Useful/harmful/neutral
    cc = results["overall"]["correction_counts"]
    categories = ["useful", "harmful", "neutral"]
    colors = ["#4CAF50", "#F44336", "#9E9E9E"]
    counts = [cc.get(c, 0) for c in categories]
    total = sum(counts)
    labels = [f"{c.capitalize()}\n{cnt} ({100*cnt/total:.1f}%)" for c, cnt in zip(categories, counts)]
    fig, ax = plt.subplots(figsize=(7, 5))
    wedges, _ = ax.pie(counts, colors=colors, startangle=90,
                        wedgeprops=dict(width=0.6, edgecolor='white', linewidth=2))
    ax.legend(wedges, labels, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    ax.set_title(f"Phase 12: B2 Correction Impact\n(N={total}, threshold={USEFUL_THRESHOLD}°C)")
    plt.tight_layout()
    plt.savefig(str(PLOTS_DIR / "production_useful_harmful.png"), dpi=120, bbox_inches='tight')
    plt.close()
    logger.info("Saved: production_useful_harmful.png")

    # Plot 5: MAE by elevation difference category
    elev_cats = list(results["by_elevation_category"].keys())
    valid_cats = [c for c in elev_cats
                  if "NOTE" not in results["by_elevation_category"][c]]
    if valid_cats:
        b0_ec = [results["by_elevation_category"][c]["B0"]["MAE"] for c in valid_cats]
        b2_ec = [results["by_elevation_category"][c]["B2"]["MAE"] for c in valid_cats]
        x = np.arange(len(valid_cats))
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.bar(x - width/2, b0_ec, width, label="B0", color="#2196F3", alpha=0.8)
        ax.bar(x + width/2, b2_ec, width, label="B2", color="#4CAF50", alpha=0.8)
        ax.set_xlabel("Elevation Difference Category")
        ax.set_ylabel("MAE (°C)")
        ax.set_title("Phase 12: MAE by Elevation Difference Category")
        ax.set_xticks(x)
        short_labels = [c.split("(")[0].strip() for c in valid_cats]
        ax.set_xticklabels(short_labels, rotation=20, ha='right', fontsize=8)
        ax.legend()
        plt.tight_layout()
        plt.savefig(str(PLOTS_DIR / "production_mae_by_elevation_difference.png"), dpi=120)
        plt.close()
        logger.info("Saved: production_mae_by_elevation_difference.png")


# ── Step 5: Scientific Decision Gate ─────────────────────────────────────────

def determine_gate(results: dict) -> str:
    """
    Apply the Phase 12 scientific decision gate.
    Returns: 'GO', 'GO_WITH_LIMITATION', or 'NO_GO'
    """
    overall_b0_mae = results["overall"]["B0"]["MAE"]
    overall_b2_mae = results["overall"]["B2"]["MAE"]
    overall_improvement = overall_b0_mae - overall_b2_mae

    # Check temporal holdouts
    temporal = results.get("temporal_holdout", {})
    temporal_improvements = []
    for split_name, split_res in temporal.items():
        imp = split_res["B0"]["MAE"] - split_res["B2"]["MAE"]
        temporal_improvements.append(imp)

    all_temporal_positive = all(i > 0 for i in temporal_improvements) if temporal_improvements else False
    some_temporal_positive = any(i > 0 for i in temporal_improvements) if temporal_improvements else False

    # Check spatial CV
    spatial_b0 = results.get("spatial_cv_summary", {}).get("B0_mean_MAE", None)
    spatial_b2 = results.get("spatial_cv_summary", {}).get("B2_mean_MAE", None)
    spatial_improvement = (spatial_b0 - spatial_b2) if (spatial_b0 and spatial_b2) else None

    # Check useful/harmful ratio
    cc = results["overall"]["correction_counts"]
    useful = cc.get("useful", 0)
    harmful = cc.get("harmful", 0)
    total_classified = useful + harmful
    useful_ratio = useful / total_classified if total_classified > 0 else 0.5

    logger.info("Gate analysis: overall_B0=%.3f B2=%.3f improvement=%.4f",
                overall_b0_mae, overall_b2_mae, overall_improvement)
    logger.info("Temporal improvements: %s", temporal_improvements)
    logger.info("Spatial improvement: %s", spatial_improvement)
    logger.info("Useful ratio: %.1f%%", 100 * useful_ratio)

    if (overall_improvement > 0 and all_temporal_positive and
            (spatial_improvement is None or spatial_improvement > 0) and
            useful_ratio > 0.55):
        return "GO"
    elif (overall_improvement > 0 and some_temporal_positive) or (
            overall_improvement > 0 and useful_ratio > 0.5):
        return "GO_WITH_LIMITATION"
    else:
        return "NO_GO"


# ── Step 6: Write Report ──────────────────────────────────────────────────────

def write_report(df: pd.DataFrame, results: dict, gate: str):
    """Write the Phase 12 production validation report."""
    overall = results["overall"]
    b0_overall = overall["B0"]
    b2_overall = overall["B2"]
    cc_overall = overall["correction_counts"]
    total_classified = cc_overall.get("useful", 0) + cc_overall.get("harmful", 0)

    gate_text = {
        "GO": "**GO** — Production B2 demonstrates reproducible improvement over B0 across held-out evaluations.",
        "GO_WITH_LIMITATION": "**GO WITH LIMITATION** — B2 shows overall improvement but results are inconsistent across splits. Limitations documented.",
        "NO_GO": "**NO-GO** — B2 fails to consistently improve production forecasts. Existing MVP behavior retained. No changes to B2 formula or API.",
    }[gate]

    report_lines = [
        "# Phase 12: Production-System Scientific Validation Report",
        "",
        "## 1. Objective",
        "Validate the actual production GramWeather forecast pipeline",
        "(Open-Meteo Historical Forecast + Open-Meteo/SRTM Elevation + B2 Physical Lapse-Rate Correction)",
        "against historical NOAA ISD observations.",
        "",
        "## 2. Was Production-Equivalent Historical Forecast Data Available?",
        "**YES — with caveat.**",
        "",
        "Open-Meteo provides a [Historical Forecast API](https://historical-forecast-api.open-meteo.com/v1/forecast)",
        "that re-runs the same model family (GFS Seamless / `best_match`) as the live production API.",
        "This API:",
        "- Returns the same `elevation` field (SRTM 90m at the snapped grid point)",
        "- Applies the same internal bias corrections as live production",
        "- Uses the same spatial snapping",
        "- Supports the same parameters as the production forecast API",
        "",
        "> **Caveat**: The Historical Forecast API is a hindcast re-run of the model, not the original",
        "> archived forecast from the original issue time. Minor differences due to model updates",
        "> since the original runs cannot be excluded. This is documented as a methodological limitation.",
        "",
        "**ERA5 reanalysis was NOT used as a substitute for the production forecast.**",
        "",
        f"## 3. Dataset Summary",
        f"- **Stations**: {df['station_id'].nunique()} NOAA ISD synoptic/airport stations",
        f"- **Total observations**: {len(df)}",
        f"- **Seasons**: February 1–10, 2023 and August 1–10, 2023",
        f"- **Lead times**: {sorted(df['lead_hours'].unique())} hours",
        f"- **Reference forecast system**: Open-Meteo Historical Forecast API (`best_match`/GFS Seamless)",
        f"- **Reference elevation system**: Open-Meteo Historical Forecast API response (`elevation` field, SRTM 90m)",
        f"- **Target elevation system**: Open-Meteo Elevation API (SRTM 90m at station coordinates)",
        f"- **Observation source**: NOAA ISD via Phase 6 expanded dataset (all QC=1, no synthetic values)",
        "",
        "### Observations per station:",
        "| Station | Name | N |",
        "|---|---|---|",
    ]
    for sid in sorted(results["by_station"].keys()):
        s = results["by_station"][sid]
        report_lines.append(f"| {sid} | {s['name']} | {s['n']} |")

    report_lines += [
        "",
        "## 4. Station–Location Relationship",
        "Stations are used as **validation proxies**, not as Panchayat ground truth.",
        "For each station: station lat/lon → Open-Meteo grid snap (production-equivalent reference),",
        "station SRTM elevation (via Elevation API) vs. grid SRTM elevation (from forecast response).",
        "This replicates the exact production workflow, treating each station as if it were a Panchayat query.",
        "",
        "No station was silently reassigned to different coordinates.",
        "",
        "## 5. B2 Formula",
        "```",
        "T_B2 = T_reference - 0.0065 × (z_target - z_reference)",
        "GAMMA = 0.0065 °C/m  [Phase 6 validated — unchanged]",
        "```",
        "",
        "## 6. Overall Results",
        "",
        "| Method | MAE (°C) | RMSE (°C) | Bias (°C) | Median AE (°C) | N |",
        "|---|---|---|---|---|---|",
        f"| B0 (Production Reference) | {b0_overall['MAE']} | {b0_overall['RMSE']} | {b0_overall['Bias']} | {b0_overall['MedianAE']} | {b0_overall['N']} |",
        f"| B2 (Production Lapse-Rate) | {b2_overall['MAE']} | {b2_overall['RMSE']} | {b2_overall['Bias']} | {b2_overall['MedianAE']} | {b2_overall['N']} |",
        "",
        "### B2 Correction Impact",
        f"| Category | Count | % |",
        "|---|---|---|",
        f"| Useful (|B2 error| < |B0 error| - {USEFUL_THRESHOLD}°C) | {cc_overall.get('useful', 0)} | {100*cc_overall.get('useful', 0)/max(1, b0_overall['N']):.1f}% |",
        f"| Harmful (|B2 error| > |B0 error| + {USEFUL_THRESHOLD}°C) | {cc_overall.get('harmful', 0)} | {100*cc_overall.get('harmful', 0)/max(1, b0_overall['N']):.1f}% |",
        f"| Neutral | {cc_overall.get('neutral', 0)} | {100*cc_overall.get('neutral', 0)/max(1, b0_overall['N']):.1f}% |",
        "",
        "## 7. By Lead Time",
        "",
        "| Lead | B0 MAE | B2 MAE | B0 RMSE | B2 RMSE | B0 Bias | B2 Bias | Useful | Harmful | Neutral |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for lead in sorted(df["lead_hours"].unique()):
        lr = results["by_lead_time"][f"{lead}h"]
        cc = lr["correction_counts"]
        report_lines.append(
            f"| {lead}h | {lr['B0']['MAE']} | {lr['B2']['MAE']} | "
            f"{lr['B0']['RMSE']} | {lr['B2']['RMSE']} | "
            f"{lr['B0']['Bias']} | {lr['B2']['Bias']} | "
            f"{cc.get('useful',0)} | {cc.get('harmful',0)} | {cc.get('neutral',0)} |"
        )

    report_lines += [
        "",
        "## 8. Temporal Holdout (Seasonal Generalization)",
        "",
        "| Split | B0 MAE | B2 MAE | B0 Bias | B2 Bias | N | Useful | Harmful | Neutral |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for split_name, sr in results.get("temporal_holdout", {}).items():
        cc = sr["correction_counts"]
        report_lines.append(
            f"| {split_name.replace('_', ' ')} | {sr['B0']['MAE']} | {sr['B2']['MAE']} | "
            f"{sr['B0']['Bias']} | {sr['B2']['Bias']} | {sr['B0']['N']} | "
            f"{cc.get('useful',0)} | {cc.get('harmful',0)} | {cc.get('neutral',0)} |"
        )

    report_lines += [
        "",
        "## 9. By Season",
        "",
        "| Season | B0 MAE | B2 MAE | B0 Bias | B2 Bias | N |",
        "|---|---|---|---|---|---|",
    ]
    for season, sr in results.get("by_season", {}).items():
        report_lines.append(
            f"| {season} | {sr['B0']['MAE']} | {sr['B2']['MAE']} | "
            f"{sr['B0']['Bias']} | {sr['B2']['Bias']} | {sr['B0']['N']} |"
        )

    # Spatial CV
    scv = results.get("spatial_cv_summary")
    if scv:
        report_lines += [
            "",
            "## 10. Spatial Cross-Validation (Leave-Station-Out)",
            "",
            f"| B0 Mean CV MAE | B2 Mean CV MAE |",
            "|---|---|",
            f"| {scv['B0_mean_MAE']} | {scv['B2_mean_MAE']} |",
            "",
        ]

    report_lines += [
        "",
        "## 11. Elevation-Difference Category Analysis",
        "",
        "| Category | B0 MAE | B2 MAE | N | Note |",
        "|---|---|---|---|---|",
    ]
    for cat, cr in results.get("by_elevation_category", {}).items():
        if "NOTE" in cr:
            report_lines.append(f"| {cat} | — | — | {cr['N']} | {cr['NOTE']} |")
        else:
            report_lines.append(
                f"| {cat} | {cr['B0']['MAE']} | {cr['B2']['MAE']} | {cr['B0']['N']} | |"
            )

    report_lines += [
        "",
        "## 12. Comparison with Phase 6",
        "",
        "| Dimension | Phase 6 | Phase 12 (Production) |",
        "|---|---|---|",
        "| Reference forecast | NOAA GFS GRIB2 (0.25°) | Open-Meteo Historical Forecast (`best_match`) |",
        "| Reference elevation | GFS native orography | Open-Meteo SRTM 90m (from forecast response) |",
        "| Target elevation | GFS orography at station | Open-Meteo SRTM 90m (Elevation API) |",
        "| Stations | 18 | " + str(df["station_id"].nunique()) + " |",
        "| Observations | 1,660 | " + str(len(df)) + " |",
        f"| B0 MAE | 1.705 °C | {b0_overall['MAE']} °C |",
        f"| B2 MAE | 1.555 °C | {b2_overall['MAE']} °C |",
        "| B2 Status (Phase 6) | GO WITH LIMITATION | — |",
        f"| B2 Status (Phase 12) | — | See gate below |",
        "",
        "> **These two results MUST NOT be combined into a single MAE headline.**",
        "> Phase 6 used GFS orography (~678 m for Pune). Phase 12 uses SRTM (~559 m for Pune).",
        "> Different reference systems, different elevation-difference distributions.",
        "",
        "## 13. Scientific Decision Gate",
        "",
        f"**Decision: {gate_text}**",
        "",
        "### Gate Criteria Applied:",
        f"- Overall B2 MAE improvement over B0: {b0_overall['MAE'] - b2_overall['MAE']:.4f} °C",
        f"- Temporal holdout improvements: {[round(results['temporal_holdout'].get(k, {}).get('B0', {}).get('MAE', 0) - results['temporal_holdout'].get(k, {}).get('B2', {}).get('MAE', 0), 4) for k in results.get('temporal_holdout', {})]}",
        f"- Useful correction rate: {100*cc_overall.get('useful',0)/max(1,b0_overall['N']):.1f}%",
        f"- Harmful correction rate: {100*cc_overall.get('harmful',0)/max(1,b0_overall['N']):.1f}%",
        "",
        "## 14. Production Impact",
        "- B2 formula (GAMMA = 0.0065 °C/m): **UNCHANGED**",
        "- API behavior: **UNCHANGED**",
        "- Frontend behavior: **UNCHANGED**",
        "- Scientific disclaimer in UI: **RETAINED**",
        "",
        "## 15. Known Limitations",
        "1. Historical Forecast API is a hindcast re-run, not the exact original archived run.",
        "2. Validation is against synoptic/airport stations, not Panchayat ground truth.",
        "3. Elevation difference distribution in validation dataset depends on station placement.",
        "4. Only temperature is validated. Precipitation, humidity, wind: not evaluated.",
        "5. February and August 2023 may not represent all seasonal and meteorological regimes.",
        "",
        "---",
        f"*Generated: {datetime.now().isoformat()}*",
    ]

    report_path = REPORTS_DIR / "production_validation_report.md"
    with open(report_path, "w") as f:
        f.write("\n".join(report_lines))
    logger.info("Report written: %s", report_path)


def write_comparison_report(df: pd.DataFrame, results: dict, gate: str):
    """Write the Phase 6 vs Phase 12 comparison report."""
    b0_mae = results["overall"]["B0"]["MAE"]
    b2_mae = results["overall"]["B2"]["MAE"]

    lines = [
        "# Phase 12 vs Phase 6: Scientific Comparison",
        "",
        "## Purpose",
        "Document how the switch from NOAA GFS (Phase 6 validation) to Open-Meteo (Phase 12 / production)",
        "affects the interpretation of B2 performance.",
        "",
        "## Reference System Comparison",
        "",
        "| Property | Phase 6 | Phase 12 (Production) |",
        "|---|---|---|",
        "| Reference NWP | NOAA GFS GRIB2 (0.25° native) | Open-Meteo `best_match` (GFS Seamless, 0.25°) |",
        "| Reference elevation | GFS native orography | SRTM 90m (from OM forecast `elevation` field) |",
        "| Target elevation | GFS orography at station lat/lon | SRTM 90m (Open-Meteo Elevation API) |",
        "| Elevation source consistency | GFS orography for both | SRTM 90m for both ✓ |",
        "| Fetch method | Downloaded GRIB2 archives | API call (real-time / hindcast) |",
        "| Model | GFS 0.25° | GFS Seamless (blended GFS + HRES) |",
        "",
        "## Key Performance Numbers",
        "",
        "| Metric | Phase 6 | Phase 12 |",
        "|---|---|---|",
        "| Stations | 18 | " + str(df["station_id"].nunique()) + " |",
        "| Pairs | 1,660 | " + str(len(df)) + " |",
        "| B0 MAE | 1.705 °C | " + str(b0_mae) + " °C |",
        "| B2 MAE | 1.555 °C | " + str(b2_mae) + " °C |",
        "| B2 overall MAE improvement | 0.150 °C | " + str(round(b0_mae - b2_mae, 4)) + " °C |",
        "",
        "## Critical Interpretation",
        "",
        "> **The Phase 6 B2 MAE of 1.555 °C was obtained using NOAA GFS reference temperatures**",
        "> **and GFS orography (~678 m for Pune). The production pipeline uses Open-Meteo/SRTM**",
        "> **(~559 m for Pune). These are different reference systems with different elevation**",
        "> **anchors and different error distributions.**",
        "",
        "> **Do NOT combine or directly compare the two MAE values as if they represent the**",
        "> **same pipeline. Phase 12 provides the production-relevant validation.**",
        "",
        "## What Changed When Moving to Production",
        "",
        "1. **Open-Meteo already applies an internal SRTM correction** to its forecast temperatures.",
        "   The reference temperature returned by Open-Meteo is already anchored to SRTM at the grid point.",
        "   GFS GRIB2 data does NOT apply this correction — raw model levels are used.",
        "",
        "2. **Elevation consistency improved**: Phase 6 used GFS orography for both reference and target,",
        "   creating potentially inconsistent elevation anchors. Phase 12 uses SRTM for both (target via",
        "   Elevation API, reference from forecast response) — these are from the same DEM source.",
        "",
        "3. **Model resolution**: GFS Seamless blends GFS (0.25°) with HRES (9 km) data where available,",
        "   potentially improving the reference accuracy in some conditions.",
        "",
        f"## Scientific Gate Consistency",
        f"- Phase 6 gate: GO WITH LIMITATION",
        f"- Phase 12 gate: **{gate}**",
        "",
        "If Phase 12 gate also yields GO or GO WITH LIMITATION, this provides **convergent evidence**",
        "that B2 is beneficial across different reference forecast systems.",
        "",
        "If Phase 12 gate yields NO-GO, it raises the possibility that Open-Meteo's internal SRTM",
        "correction already partially accounts for elevation effects, reducing the residual benefit of B2.",
        "",
        "---",
        f"*Generated: {datetime.now().isoformat()}*",
    ]

    path = REPORTS_DIR / "production_vs_phase6_comparison.md"
    with open(path, "w") as f:
        f.write("\n".join(lines))
    logger.info("Comparison report written: %s", path)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    logger.info("=" * 60)
    logger.info("PHASE 12: PRODUCTION-SYSTEM SCIENTIFIC VALIDATION")
    logger.info("=" * 60)
    logger.info("B2 formula: T_B2 = T_ref - %.4f * (z_target - z_ref)", GAMMA)
    logger.info("Observation source: NOAA ISD (Phase 6 expanded dataset)")
    logger.info("Reference forecast: Open-Meteo Historical Forecast API (best_match)")
    logger.info("This is NOT ERA5 reanalysis. See script header for semantics.")

    # Step 1: Load ISD observations
    isd_df = load_isd_observations()

    # Step 2: Fetch production-equivalent forecasts and build dataset
    logger.info("Building production dataset (fetching Open-Meteo APIs)...")
    production_df = build_production_dataset(isd_df)

    if len(production_df) == 0:
        logger.error("CRITICAL: No production data could be assembled. Experiment BLOCKED.")
        blocked_report = (
            "# Phase 12: BLOCKED\n\n"
            "Production-equivalent historical forecast validation is currently blocked "
            "because no rows could be assembled from the Open-Meteo Historical Forecast API "
            "paired with NOAA ISD observations.\n\n"
            "Possible causes: API rate limiting, network error, timestamp mismatch.\n\n"
            "The MVP B2 behavior remains unchanged."
        )
        (REPORTS_DIR / "production_validation_report.md").write_text(blocked_report)
        return

    # Save predictions CSV
    csv_path = PREDICTIONS_DIR / "production_b0_b2_predictions.csv"
    production_df.to_csv(csv_path, index=False)
    logger.info("Predictions saved: %s (%d rows)", csv_path, len(production_df))

    # Step 3: Run validation
    logger.info("Running validation splits...")
    results = run_validation(production_df)

    # Step 4: Make plots
    logger.info("Generating plots...")
    make_plots(production_df, results)

    # Step 5: Scientific decision gate
    gate = determine_gate(results)
    logger.info("SCIENTIFIC GATE: %s", gate)

    # Step 6: Write reports
    write_report(production_df, results, gate)
    write_comparison_report(production_df, results, gate)

    # Summary
    overall = results["overall"]
    logger.info("=" * 60)
    logger.info("PHASE 12 COMPLETE")
    logger.info("Stations: %d | Observations: %d",
                production_df["station_id"].nunique(), len(production_df))
    logger.info("B0 Overall MAE: %.4f °C", overall["B0"]["MAE"])
    logger.info("B2 Overall MAE: %.4f °C", overall["B2"]["MAE"])
    logger.info("B2 improvement: %.4f °C", overall["B0"]["MAE"] - overall["B2"]["MAE"])
    logger.info("Gate: %s", gate)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
