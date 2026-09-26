# Scientific Validation Design

## 1. Objective
To define a pre-registered evaluation protocol that prevents dataset-level overfitting for the expanded 1,660-record dataset.

## 2. Methodology: Spatial Block Cross-Validation (Leave-Region-Out)
Because weather data is highly temporally autocorrelated, random Train/Test splitting causes severe data leakage.
We will use **Spatial Holdout**:
- **Train**: N-k stations
- **Validate**: k completely unseen stations

## 3. Optional Temporal Holdout
- **Train**: February 2023
- **Validate**: August 2023 (or vice-versa) to test out-of-season generalization.

## 4. Metric Thresholds
- Improvement must be measured against **Baseline 1 (Bilinear Spatial Interpolation)**.
- ML models (e.g. XGBoost) must outperform B1 across the *unseen* holdout stations, not just minimize training loss.
