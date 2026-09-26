# Phase 12 vs Phase 6: Scientific Comparison

## Purpose
Document how the switch from NOAA GFS (Phase 6 validation) to Open-Meteo (Phase 12 / production)
affects the interpretation of B2 performance.

## Reference System Comparison

| Property | Phase 6 | Phase 12 (Production) |
|---|---|---|
| Reference NWP | NOAA GFS GRIB2 (0.25° native) | Open-Meteo `best_match` (GFS Seamless, 0.25°) |
| Reference elevation | GFS native orography (smoothed) | SRTM 90m (from OM forecast `elevation` field) |
| Target elevation | GFS orography at station lat/lon | SRTM 90m (Open-Meteo Elevation API) |
| Elevation source consistency | GFS orography for both ✓ | SRTM 90m for both ✓ |
| Elevation magnitude | Mean 60.5 m, max 493.3 m | **Mean 0.0 m, max 0.0 m** |
| Fetch method | Downloaded GRIB2 archives | API call (hindcast re-run) |

## Key Performance Numbers

| Metric | Phase 6 | Phase 12 |
|---|---|---|
| Stations | 18 | 18 |
| Observation pairs | 1,660 | 1,488 |
| B0 MAE | 1.705 °C | 1.422 °C |
| B2 MAE | 1.555 °C | 1.422 °C (= B0) |
| B2 MAE improvement | +0.150 °C | 0.000 °C |
| Records with elev diff > 50 m | 392 (23.6%) | 0 (0%) |
| Gate | GO WITH LIMITATION | NO-GO (structural blocker) |

## The Critical Structural Difference

Phase 6 was able to generate meaningful B2 corrections because GFS native orography
is a **smoothed representation** at 0.25° (~28 km) resolution. GFS cannot represent
individual hill peaks, valley floors, or ridges accurately. This created large
elevation differences between the GFS orography and the true station elevation.

Open-Meteo already applies an **internal SRTM correction** to its forecast temperatures.
The `elevation` field it returns is the SRTM elevation at the snapped grid node — the
same SRTM DEM used by the Elevation API. When both elevation lookups use the same DEM
and are queried at or near the same coordinates, the elevation difference is negligible.

```
Phase 6:
  Station (true SRTM elev) ←→ GFS orography (smoothed ~28km avg)
  = Large elevation differences → B2 applies meaningful correction

Phase 12 (Production):
  Station query → OM snap → SRTM elev (reference)
  Station query → Elevation API → SRTM elev (target)
  Same SRTM source → Same elevation → Zero difference → B2 = B0
```

## What the Phase 6 Evidence Actually Proved

The Phase 6 result (B2 MAE 1.555 °C, B0 MAE 1.705 °C) proved that:

> **When the forecast reference elevation is significantly different from the true target
> elevation, applying a lapse-rate correction reduces MAE.**

This is physically correct and well-established atmospheric science. The environmental
lapse rate is a real physical process.

However, this does **not** directly prove that:

> B2 improves Open-Meteo production forecasts when queried at Panchayat coordinates,
> because Open-Meteo already accounts for elevation via its internal SRTM correction.

## When Does Production B2 Actually Apply?

In the production system, a nonzero B2 correction arises when:

1. A Panchayat location's SRTM elevation (from Elevation API) differs meaningfully
   from the SRTM elevation at Open-Meteo's snapped grid node.
2. This happens when: the Panchayat is on a steep hillside, cliff, narrow ridge, or
   valley that cannot be resolved at Open-Meteo's spatial resolution.
3. For example: a Panchayat at 1,100 m on a ridge, while the nearest grid node SRTM
   shows 800 m → elevation diff = 300 m → B2 correction = 1.95 °C.

No validation dataset for this scenario currently exists.

## Scientific Integrity Summary

- Phase 6 gate: **GO WITH LIMITATION** (valid, on GFS-based data)
- Phase 12 gate: **NO-GO** (structural validation blocker — not physics failure)
- Neither result can be used as proof that Open-Meteo B2 works or fails
- The system correctly labels B2 as **EXPERIMENTAL** in production

---
*Generated: 2026-09-21*