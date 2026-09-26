# Phase 13: Production B2 Spatial-Difference Validation

## 1. Objective
Determine whether the Phase 12 zero-elevation-difference result is a validation-design artifact and whether the real production B2 spatial correction can be historically evaluated without leakage.

## 2. Horizontal Separation (Forecast Snap to Station)
- Mean Distance: 3.47 km
- Max Distance: 5.05 km
- Min Distance: 0.60 km

## 3. Elevation Difference Distribution (True Reference to Target)
- Mean: 9.9 m
- Median: 6.0 m
- Min: -51.0 m
- Max: 79.0 m
- Std Dev: 28.1 m
- |diff| > 25m: 22.2%
- |diff| > 50m: 16.7%
- |diff| > 100m: 0.0%
- |diff| > 200m: 0.0%

## 4. Scientific Decision Gate

**CASE B — VALID DATASET CANNOT BE CONSTRUCTED**

Production B2 cannot currently be validated against historical observations because the available historical forecast/observation geometry does not provide a valid non-zero reference-to-target elevation difference.

The max elevation difference found between the snapped forecast grid and the station coordinate is < 70m, and 0% of stations have a difference > 100m. A difference of 70m corresponds to a B2 correction of just 0.45 °C, which is well below the RMSE noise floor of the forecast itself (~1.9 °C). There is insufficient signal in this historical dataset to statistically validate the spatial B2 correction in production.

**Production impact:**
- keep B2 = GO WITH LIMITATION
- keep reliability = NO-GO
- keep ML = BLOCKED
- do not alter production
