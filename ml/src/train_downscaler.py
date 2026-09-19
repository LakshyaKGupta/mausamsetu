"""
ML Training, Baseline Comparison, and Calibration Pipeline for MausamSetu.
Trains XGBoost downscaling model on rainfall target.
Strict time-aware split:
- Train: 2014-2021
- Validation/Calibration: 2022
- Held-out Test: 2023
Generates empirical prediction intervals and serializes model artifacts.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

FEATURES = [
    "coarse_rainfall_mm",
    "coarse_temp_max_c",
    "coarse_temp_min_c",
    "lead_time_hours",
    "centroid_lat",
    "centroid_lon",
    "elevation_m",
    "slope_deg",
    "aspect_sin",
    "aspect_cos",
    "terrain_roughness",
    "station_distance_km",
    "day_of_year_sin",
    "day_of_year_cos",
    "historical_rain_7d_mm",
]

TARGET = "observed_rainfall_24h_mm"
BASELINE = "coarse_rainfall_mm"


def train_and_evaluate(
    data_path="ml/data/processed/matched_training_dataset.csv",
    artifacts_dir="backend/app/ml/artifacts",
):
    print("=========================================================")
    print("MausamSetu ML Downscaling: Training & Evaluation Pipeline")
    print("=========================================================\n")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run dataset_generator.py first.")

    df = pd.read_csv(data_path)
    df["date"] = pd.to_datetime(df["date"])

    # Strict Time-Aware Split
    train_df = df[df["year"] <= 2021].copy()
    val_df = df[df["year"] == 2022].copy()
    test_df = df[df["year"] == 2023].copy()

    print(f"Data Split Summary:")
    print(f"  Training Set (2014-2021):     {len(train_df):>6} rows")
    print(f"  Validation Set (2022):        {len(val_df):>6} rows (used for tuning & residual calibration)")
    print(f"  Held-out Test Set (2023):     {len(test_df):>6} rows (used for final benchmark)")
    print("-" * 55)

    X_train = train_df[FEATURES].values
    y_train = train_df[TARGET].values

    X_val = val_df[FEATURES].values
    y_val = val_df[TARGET].values

    X_test = test_df[FEATURES].values
    y_test = test_df[TARGET].values

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # 1. Baseline Benchmark on 2023 Held-out Test Set
    baseline_test_preds = test_df[BASELINE].values
    baseline_mae = mean_absolute_error(y_test, baseline_test_preds)
    baseline_rmse = np.sqrt(mean_squared_error(y_test, baseline_test_preds))
    baseline_bias = float(np.mean(baseline_test_preds - y_test))

    # 2. Train XGBoost Downscaling Regressor
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=300,
        learning_rate=0.03,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(
        X_train_scaled,
        y_train,
        eval_set=[(X_val_scaled, y_val)],
        verbose=False,
    )

    # 3. Model Predictions on 2023 Held-out Test Set
    raw_test_preds = model.predict(X_test_scaled)
    # Rainfall is non-negative
    model_test_preds = np.clip(raw_test_preds, 0.0, None)

    model_mae = mean_absolute_error(y_test, model_test_preds)
    model_rmse = np.sqrt(mean_squared_error(y_test, model_test_preds))
    model_bias = float(np.mean(model_test_preds - y_test))
    model_r2 = r2_score(y_test, model_test_preds)

    mae_improvement = ((baseline_mae - model_mae) / baseline_mae) * 100.0
    rmse_improvement = ((baseline_rmse - model_rmse) / baseline_rmse) * 100.0

    # 4. Calibration: Derive Empirical Validation Residuals (2022)
    val_preds = np.clip(model.predict(X_val_scaled), 0.0, None)
    val_residuals = np.abs(y_val - val_preds)

    e80 = float(np.percentile(val_residuals, 80))
    e90 = float(np.percentile(val_residuals, 90))
    median_error = float(np.median(val_residuals))

    print("\n" + "=" * 55)
    print(f"{'Metric':<25} | {'Official Baseline':<15} | {'MausamSetu (ML)':<15}")
    print("-" * 55)
    print(f"{'Rainfall MAE (mm)':<25} | {baseline_mae:<15.2f} | {model_mae:<15.2f}")
    print(f"{'Rainfall RMSE (mm)':<25} | {baseline_rmse:<15.2f} | {model_rmse:<15.2f}")
    print(f"{'Rainfall Bias (mm)':<25} | {baseline_bias:<15.2f} | {model_bias:<15.2f}")
    print(f"{'R² Score':<25} | {'N/A':<15} | {model_r2:<15.3f}")
    print(f"{'Held-out Test Period':<25} | {'2023':<15} | {'2023':<15}")
    print("=" * 55)
    print(f"MAE Improvement over Baseline: {mae_improvement:+.1f}%")
    print(f"RMSE Improvement over Baseline: {rmse_improvement:+.1f}%\n")

    print(f"Empirical Calibration (from 2022 Validation Residuals):")
    print(f"  Median Absolute Error:         ±{median_error:.2f} mm")
    print(f"  80th Percentile Error (E_80):   ±{e80:.2f} mm")
    print(f"  90th Percentile Error (E_90):   ±{e90:.2f} mm")
    print("-" * 55)

    # 5. Serialize Artifacts
    os.makedirs(artifacts_dir, exist_ok=True)

    joblib.dump(model, os.path.join(artifacts_dir, "model.joblib"))
    joblib.dump(scaler, os.path.join(artifacts_dir, "scaler.joblib"))

    calibration_params = {
        "methodology": "EMPIRICAL_VALIDATION_RESIDUALS",
        "calibration_sample_size": len(val_df),
        "calibration_period": "2022-01-01 to 2022-12-31",
        "median_absolute_error_mm": round(median_error, 2),
        "expected_error_margin_p80_mm": round(e80, 2),
        "expected_error_margin_p90_mm": round(e90, 2),
    }
    with open(os.path.join(artifacts_dir, "calibration_params.json"), "w") as f:
        json.dump(calibration_params, f, indent=2)

    metadata = {
        "model_id": "xgb_rain_v1.0.0",
        "algorithm": "XGBoostRegressor",
        "target_variable": TARGET,
        "training_period": "2014-01-01 to 2021-12-31",
        "validation_period": "2022-01-01 to 2022-12-31",
        "test_period": "2023-01-01 to 2023-12-31",
        "feature_list": FEATURES,
        "test_mae_model": round(model_mae, 3),
        "test_mae_baseline": round(baseline_mae, 3),
        "test_rmse_model": round(model_rmse, 3),
        "test_rmse_baseline": round(baseline_rmse, 3),
        "test_bias_model": round(model_bias, 3),
        "test_bias_baseline": round(baseline_bias, 3),
        "test_r2_model": round(model_r2, 3),
        "mae_improvement_pct": round(mae_improvement, 2),
        "calibration_residuals_p80": round(e80, 2),
        "feature_importances": {
            feat: round(float(imp), 4)
            for feat, imp in zip(FEATURES, model.feature_importances_)
        },
    }
    with open(os.path.join(artifacts_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Artifacts successfully saved to {artifacts_dir}/")
    print("  - model.joblib")
    print("  - scaler.joblib")
    print("  - calibration_params.json")
    print("  - model_metadata.json")


if __name__ == "__main__":
    train_and_evaluate()
