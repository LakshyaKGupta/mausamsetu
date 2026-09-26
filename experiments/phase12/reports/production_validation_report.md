# Phase 12: Production-System Scientific Validation Report

## 1. Objective
Validate the actual production GramWeather forecast pipeline
(Open-Meteo Historical Forecast + Open-Meteo/SRTM Elevation + B2 Physical Lapse-Rate Correction)
against historical NOAA ISD observations.

## 2. Was Production-Equivalent Historical Forecast Data Available?
**YES — with caveat.**

Open-Meteo provides a [Historical Forecast API](https://historical-forecast-api.open-meteo.com/v1/forecast)
that re-runs the same model family (GFS Seamless / `best_match`) as the live production API.
This API:
- Returns the same `elevation` field (SRTM 90m at the snapped grid point)
- Applies the same internal bias corrections as live production
- Uses the same spatial snapping
- Supports the same parameters as the production forecast API

> **Caveat**: The Historical Forecast API is a hindcast re-run of the model, not the original
> archived forecast from the original issue time. Minor differences due to model updates
> since the original runs cannot be excluded. This is documented as a methodological limitation.

**ERA5 reanalysis was NOT used as a substitute for the production forecast.**

## 3. Dataset Summary
- **Stations**: 18 NOAA ISD synoptic/airport stations
- **Total observations**: 1,488 paired records
- **Seasons**: February 1–10, 2023 and August 1–10, 2023
- **Lead times**: 12h, 24h, 36h, 48h
- **Reference forecast system**: Open-Meteo Historical Forecast API (`best_match`/GFS Seamless)
- **Reference elevation system**: Open-Meteo Historical Forecast API response (`elevation` field, SRTM 90m)
- **Target elevation system**: Open-Meteo Elevation API (SRTM 90m at station coordinates)
- **Observation source**: NOAA ISD via Phase 6 expanded dataset (all QC=1, no synthetic values)

## 4. CRITICAL FINDING: Elevation Difference Is Zero for All Stations

**This is the most important scientific finding of Phase 12.**

In the production pipeline, B2 requires two elevation values:
1. `reference_elevation_m` — SRTM at the Open-Meteo forecast grid node (from forecast response)
2. `target_elevation_m` — SRTM at the target location (from Elevation API)

**What was observed in validation:**

| Station | ISD Elevation (m) | Reference SRTM (m) | Target SRTM (m) | Elevation Diff |
|---|---|---|---|---|
| JALGAON | 201.0 | 197.0 | 197.0 | 0.0 |
| GONDIA ARPT | 300.8 | 302.0 | 302.0 | 0.0 |
| NASHIK ARPT | 598.0 | 598.0 | 598.0 | 0.0 |
| AKOLA | 282.0 | 288.0 | 288.0 | 0.0 |
| WARDHA | 283.0 | 253.0 | 253.0 | 0.0 |
| YEOTMAL | 451.0 | 438.0 | 438.0 | 0.0 |
| AURANGABAD | 582.5 | 581.0 | 581.0 | 0.0 |
| PARBHANI | 422.0 | 403.0 | 403.0 | 0.0 |
| NANDED | 358.0 | 383.0 | 383.0 | 0.0 |
| CHANDRAPUR | 193.0 | 196.0 | 196.0 | 0.0 |
| PUNE | 558.0 | 559.0 | 559.0 | 0.0 |
| BARAMATI | 551.0 | 550.0 | 550.0 | 0.0 |
| RATNAGIRI | 67.0 | 81.0 | 81.0 | 0.0 |
| MAHABALESHWAR | 1382.0 | 1293.0 | 1293.0 | 0.0 |
| SATARA | 612.0 | 641.0 | 641.0 | 0.0 |
| SOLAPUR | 482.8 | 483.0 | 483.0 | 0.0 |
| KOLHAPUR | 608.4 | 608.0 | 608.0 | 0.0 |
| SANGLI | 549.0 | 567.0 | 567.0 | 0.0 |

**Elevation difference = 0.0 m for every station. B2 correction = 0.0 °C for every observation. B2 ≡ B0.**

### Why This Happened (Scientific Root Cause)

The Open-Meteo Historical Forecast API and the Open-Meteo Elevation API both use the **same underlying SRTM 90m DEM**. When both APIs are queried at identical station coordinates:

1. The **Historical Forecast API** snaps the query to its nearest grid node, then returns the SRTM elevation at that snapped node as the `elevation` field.
2. The **Elevation API**, queried at the **same station coordinates**, snaps to the **same SRTM tile and resolution**, returning effectively the same elevation.

Therefore: `target_elevation_m = reference_elevation_m` for every validation station.

This is **not a bug** in the validation script. It is a **fundamental structural constraint** of the validation setup:

> When the validation target (station) and the forecast query location are the same coordinates, and both elevation lookups use the same SRTM source, the B2 elevation difference is necessarily near-zero.

### Contrast with Phase 6

Phase 6 used **GFS native orography** at 0.25° grid resolution (~28 km cells). GFS orography is a **smoothed representation** of terrain at model resolution, not high-resolution SRTM. This creates large elevation differences:

| Dataset | Mean |Elevation Diff| | Max |Elevation Diff| | Records with |diff| > 50 m |
|---|---|---|---|
| Phase 6 (GFS orography) | 60.5 m | 493.3 m | 392 out of 1,660 |
| Phase 12 (OM SRTM) | 0.0 m | 0.0 m | 0 out of 1,488 |

**The Phase 6 result was possible precisely because GFS orography diverges significantly from high-resolution SRTM. Open-Meteo internally applies its own SRTM correction, so the returned `elevation` field already reflects the same DEM as the target lookup.**

## 5. Overall Results

| Method | MAE (°C) | RMSE (°C) | Bias (°C) | Median AE (°C) | N |
|---|---|---|---|---|---|
| B0 (Production Reference) | 1.4221 | 1.9116 | -0.1388 | 1.0613 | 1488 |
| B2 (Production Lapse-Rate) | 1.4221 | 1.9116 | -0.1388 | 1.0613 | 1488 |

**B2 correction = 0 for all observations. B0 MAE = B2 MAE = 1.4221 °C.**

> Note: B0 MAE of 1.4221 °C (vs Phase 6's 1.705 °C) indicates Open-Meteo reference forecasts are more accurate than raw GFS GRIB2, consistent with Open-Meteo's internal bias corrections.

## 6. Scientific Decision Gate

**Decision: NO-GO — with documented structural reason.**

The gate is NO-GO **not because B2 degrades performance**, but because **the validation could not create conditions where B2 applies a nonzero correction**. The test is structurally degenerate: querying both elevation APIs at the same coordinates returns identical SRTM values, yielding zero elevation difference.

This is documented as a **methodological blocker**, not a failure of the B2 physics.

## 7. What This Means for Production

### B2 in Production is NOT Equivalent to B2 in Phase 12 Validation

In production, B2 applies when a **Panchayat location** has different SRTM elevation than the **nearest Open-Meteo forecast grid node**. For example:
- A hill village at 1,100 m SRTM queries Open-Meteo, which snaps to a grid node with SRTM 800 m
- Elevation difference = 300 m → B2 applies a correction of 0.0065 × 300 = **1.95 °C**

This scenario **does arise in production** when Panchayats are at significantly different elevations than their nearest grid snap point. The Phase 12 validation could not test this because airport/synoptic stations are at known, accessible locations that tend to be near-flat relative to grid resolution.

### Consequence for Production Claims

Per the Phase 12 instructions: *"The goal is to establish whether the actual GramWeather production pipeline has evidence behind it."*

**Honest answer:** The production B2 pipeline **cannot be validated against available NOAA ISD data** using Open-Meteo as the reference system, because:
1. ISD stations are at the same coordinates queried for the forecast → zero elevation difference → B2 = B0
2. No independent high-elevation Panchayat observations exist in the current dataset

The **Phase 6 validation remains the only available scientific evidence** for B2's behavior, and it used GFS-based data, not Open-Meteo. Phase 6's 1.555 °C MAE does NOT transfer to the production Open-Meteo pipeline.

## 8. Production Impact (Per Phase 12 Gate)

Per the pre-registered gate rules for NO-GO:

- B2 formula (GAMMA = 0.0065 °C/m): **UNCHANGED**
- API behavior: **UNCHANGED**
- Frontend behavior: **UNCHANGED**
- ML: remains **BLOCKED**
- Reliability modeling: remains **NO-GO**
- Scientific disclaimer in UI: **RETAINED and strengthened** (see §9)

> No new ML is introduced. No reliability model is added. No GAMMA modification.

## 9. Required Documentation Update

The following production note should be updated in the API and UI to reflect this finding:

**Current text:**
> "Phase 6 B2 MAE (1.555 °C) was measured using NOAA GFS data. Production uses Open-Meteo."

**Updated text (reflecting Phase 12 findings):**
> "Phase 6 B2 MAE (1.555 °C) was measured using NOAA GFS data with GFS orography. The
> production Open-Meteo pipeline uses SRTM-corrected temperatures; Phase 12 validation
> demonstrated that B2 elevation differences are near-zero when querying ISD station
> coordinates against Open-Meteo APIs. Production B2 applies only when target Panchayat
> SRTM elevation differs meaningfully from the Open-Meteo grid SRTM. Performance in that
> regime has not been independently validated."

## 10. Known Limitations of This Phase 12 Experiment

1. **Structural degeneracy**: Station = query point → both elevation lookups converge to same SRTM value. B2 = B0 by construction.
2. **Not a failure of B2 physics**: The environmental lapse rate is a real physical process. The validation could not exercise it with the available data.
3. **No Panchayat ground truth exists**: Rural Panchayat temperature observations at known elevations are not available in any accessible historical dataset.
4. **Historical Forecast API is a hindcast re-run**: Not the original archived model run. Minor model-update differences cannot be excluded.
5. **Only temperature validated**: Precipitation, humidity, wind pass through unchanged.

## 11. Scientific Narrative: Complete Phase Chain

```
Pilot (4 stations) → B2 NO-GO
     ↓
Phase 6 Expanded (18 stations, 1,660 pairs, GFS GRIB2)
     → B2 GO WITH LIMITATION (MAE 1.555 °C vs B0 1.705 °C)
     ↓
Phase 7 Reliability → NO-GO (no reliable prediction-time signal)
     ↓
Phase 8 MVP: B2 integrated with EXPERIMENTAL label
     ↓
Phase 9 Elevation: Automatic SRTM lookup integrated
     ↓
Phase 10 Hardening: 43 tests pass, smoke tests clean
     ↓
Phase 11 Demo: SIH presentation ready
     ↓
Phase 12 Production Validation:
     → B0 MAE = 1.4221 °C (Open-Meteo reference; better than GFS B0)
     → B2 = B0 (zero elevation difference — structural validation constraint)
     → Gate: NO-GO (structural blocker, not physics failure)
     → MVP behavior: UNCHANGED
```

---
*Generated: 2026-09-21*
*Phase 12 script: `run_phase12_production_validation.py`*
*Predictions: `experiments/phase12/predictions/production_b0_b2_predictions.csv`*