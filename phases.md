# Phases — SIH 26074 MVP Development Roadmap

## 1. Purpose

This document defines the controlled implementation sequence for the SIH 26074 project.

The project must be developed in gated phases. A later phase must not be treated as complete merely because its code exists. Each phase has explicit entry criteria, deliverables, verification requirements, and exit gates.

The core development principle is:

> Research and data reality → validated MVP foundation → scientific engine → reliability → advisory → product integration → testing → showcase.

The system must remain useful even if the final ML/downscaling model changes during experimentation.

---

# 2. Development Philosophy

The project is a modular monolith for the MVP.

The implementation must follow these principles:

1. Build the smallest verifiable component first.
2. Use real data wherever the project claims real-world functionality.
3. Keep mock/demo data explicitly labelled.
4. Never block the entire application because an experimental ML component is unavailable.
5. Do not hard-code a scientific method before experiments justify it.
6. Build the production interfaces so the downscaling engine can be replaced without rebuilding the frontend.
7. Every phase ends with a verification gate.
8. Do not proceed past a failed gate merely to maintain schedule.
9. Record major decisions and rejected approaches.
10. Prioritize a working scientific core over feature volume.

---

# 3. Phase Overview

| Phase | Name | Primary Outcome |
|---|---|---|
| 0 | Documentation & Repository Foundation | Source-of-truth project structure |
| 1 | Environment & Skeleton | Running frontend/backend/database |
| 2 | Data & Provider Foundation | Validated weather/GIS data interfaces |
| 3 | Geographic/Panchayat Foundation | Panchayat hierarchy and map |
| 4 | Live Forecast MVP | Working reference weather experience |
| 5 | Baseline Localization | First localized/post-processed forecast |
| 6 | Scientific Experimentation | Baselines and model comparison |
| 7 | Reliability & Uncertainty | Trust/fallback mechanism |
| 8 | Advisory Engine | Weather-to-agriculture decision layer |
| 9 | Product Integration | Complete farmer/officer/admin workflows |
| 10 | Validation & Hardening | End-to-end tested application |
| 11 | SIH Demonstration | Stable showcase-ready prototype |
| 12 | Post-MVP / Research Expansion | Optional advanced capabilities |

---

# 4. Phase 0 — Documentation & Repository Foundation

## Objective

Establish a common contract before implementation begins.

## Required files

- `architecture.md`
- `prd.md`
- `rules.md`
- `phases.md`
- `design.md`
- `memory.md`

## Tasks

- Create repository.
- Create documentation directory/required root files.
- Ensure all agent-facing documentation is version controlled.
- Establish project terminology.
- Define environment variable strategy.
- Define `.gitignore`.
- Define basic README structure.
- Define ownership of research, backend, frontend, data, and model directories.

## Deliverables

- All six project-control documents.
- Initial repository structure.
- Development environment assumptions documented.

## Exit Gate

The repository contains all required project-control documents and no implementation decision contradicts them.

---

# 5. Phase 1 — Environment & Application Skeleton

## Objective

Create a minimal running application without implementing the scientific engine.

## Backend

Set up:

- Python environment
- FastAPI
- Pydantic
- configuration management
- health endpoint
- structured error handling
- logging

## Frontend

Set up:

- Next.js
- TypeScript
- Tailwind CSS
- component system
- responsive page shell
- navigation
- basic role-aware layout placeholders

## Database

Set up:

- PostgreSQL
- PostGIS
- connection management
- migration framework
- initial connectivity test

## Testing

Create:

- backend health test
- frontend build test
- database connection test

## Deliverables

A local application where:

- frontend loads
- backend runs
- database connects
- frontend can call backend
- tests execute successfully

## Exit Gate

No weather integration or ML work is required to pass this phase.

---

# 6. Phase 2 — Data & Provider Foundation

## Objective

Create the normalized data foundation.

## Weather Provider Abstraction

Implement the interface defined in `architecture.md`.

Potential MVP provider:

- Open-Meteo or another verified provider

Potential future providers:

- IMD
- GFS
- BFS

Only providers with working verified access may be marked active.

## Requirements

The backend must normalize provider output into the internal weather schema.

Store:

- provider
- issue time
- valid time
- lead time
- location
- variable values
- source metadata

## Historical/Research Data

Create separate interfaces for historical/research data.

Do not expose research-only datasets as live production providers unless they are actually appropriate.

## Data Provenance

Every stored weather record must be traceable to a source.

## Deliverables

- provider abstraction
- at least one working live provider
- normalized weather schema
- data validation
- provider error handling
- basic caching/storage
- test fixtures

## Exit Gate

A live forecast can be retrieved through FastAPI without the frontend depending directly on the third-party API.

---

# 7. Phase 3 — Geographic & Panchayat Foundation

## Objective

Create the geographic structure required for Panchayat-level interaction.

## Tasks

Implement:

- state hierarchy
- district hierarchy
- block hierarchy
- Panchayat records
- stable identifiers
- polygon geometry where available
- latitude/longitude
- administrative relationships

## GIS

Integrate:

- PostGIS geometry
- polygon retrieval
- map-ready GeoJSON responses
- coordinate validation

## DEM

Where available for MVP scope, support:

- elevation
- derived terrain metadata

The DEM must not automatically become a model feature until scientifically justified.

## Map

Implement:

- regional map
- Panchayat boundaries
- selection
- highlighting
- hierarchy filtering

## Exit Gate

A user can select:

State → District → Block → Panchayat

and the backend can return the selected Panchayat geometry and metadata.

---

# 8. Phase 4 — Live Forecast MVP

## Objective

Create a complete reference-weather experience using real live forecast data.

## Required Features

For a selected Panchayat:

- current/reference conditions
- hourly forecast where provider supports it
- daily forecast
- temperature
- precipitation
- precipitation probability where available
- humidity where available
- wind where available
- forecast source
- forecast issue/update timestamp

## Important Labeling

The UI must call this something like:

- Reference Forecast
- Live Forecast
- Provider Forecast

It must NOT call third-party provider output:

- AI Prediction
- Our Downscaled Forecast

unless it actually passes through our own downscaling engine.

## Exit Gate

A judge can select a Panchayat and see a real forecast end-to-end.

---

# 9. Phase 5 — Baseline Localization

## Objective

Introduce the first locally derived forecast representation without prematurely committing to ML.

## Baselines

Depending on data availability, implement the scientifically justified subset of:

- raw reference forecast
- nearest-grid/point representation
- bilinear/interpolated representation
- physical correction
- simple historical bias correction

## Important Principle

The baseline must be stronger than a visually attractive but scientifically meaningless transformation.

Every baseline must have:

- name
- formula/logic
- inputs
- assumptions
- output
- provenance

## UI

Show:

Reference Forecast

versus

Localized / Baseline Estimate

and explain the source of the difference.

## Exit Gate

At least one transparent localized method works end-to-end and its output is clearly distinguished from the provider forecast.

---

# 10. Phase 6 — Scientific Experimentation & Model Selection

## Objective

Determine which downscaling/post-processing method should actually become part of the final system.

This phase is the scientific core of the project.

## Required Experiment Order

1. Raw reference forecast
2. Simple spatial method
3. Physical correction
4. Bias correction
5. Simple statistical residual model
6. Random Forest / boosting only if justified
7. More advanced models only if justified by data

## Variables

Evaluate independently.

At minimum investigate:

- temperature
- rainfall

Add other variables only if data and value justify them.

## Validation

Use appropriate:

- temporal holdout
- spatial holdout
- spatiotemporal holdout

Avoid random row splitting as the primary benchmark where temporal/spatial dependence exists.

## Metrics

Use variable-appropriate metrics.

Temperature may include:

- MAE
- RMSE
- bias
- correlation

Rainfall may additionally include:

- POD
- FAR
- CSI
- event-based measures

## Experiments

Include:

- baseline comparison
- feature ablation
- spatial-context tests
- lead-time analysis
- terrain/regime analysis
- harmful/useful correction analysis

## Model Selection Principle

The final model is:

> the simplest method that provides robust, reproducible, practically meaningful improvement.

Not:

> the most sophisticated model tested.

## Exit Gate

The final selected method has documented evidence on held-out data.

If ML does not add sufficient value:

- remove it from the production MVP
- retain the research result
- do not fabricate an AI claim

---

# 11. Phase 7 — Reliability & Uncertainty

## Objective

Make localized predictions safe to use.

## Requirements

The system should distinguish:

- reliable localization
- uncertain localization
- fallback state

Possible methods include, when supported by the selected model:

- calibrated prediction intervals
- conformal prediction
- quantile prediction
- feature-space OOD detection
- cross-validated residual statistics
- observation-density indicators

Do not invent confidence percentages.

## Fallback

Conceptually:

Localized prediction
→ reliability assessment

Reliable:
→ serve localized value

Unreliable:
→ serve fallback/reference value and show a warning/status

## UI

Show:

- reliability status
- uncertainty range when available
- reason/category for reduced reliability
- source/provenance

## Exit Gate

The system demonstrates that reliability handling reduces harmful corrections or otherwise has a defensible calibration rationale.

If the reliability layer fails to provide measurable value:

- simplify it
- or remove it from the claimed core innovation.

---

# 12. Phase 8 — Agricultural Advisory Engine

## Objective

Convert validated Panchayat weather information into transparent agricultural actions.

## Architecture

Weather forecast
+
agricultural context
+
documented rule
→ advisory

## MVP

Keep advisory scope deliberately small.

Possible decisions:

- irrigation timing
- spraying window
- rainfall-related caution
- harvest timing
- extreme weather alert

Only implement rules that have documented authority or an explicitly documented project basis.

## Advisory Structure

Each advisory should contain:

- condition
- observed/forecast inputs
- applicable context
- recommended action
- validity window
- severity
- source/rule reference

## Human Review

Where required by product scope, officers can:

- approve
- reject
- modify

Do not silently present unverified advice as official government advice.

## Exit Gate

The system can demonstrate the full chain:

weather → condition → agricultural recommendation.

---

# 13. Phase 9 — Product Integration

## Objective

Integrate the scientific engine and product workflows.

## Farmer Experience

Prioritize simplicity.

Show:

- Panchayat
- current/next weather
- important alert
- advisory
- reliability when relevant
- action-oriented language

## Officer Experience

Show:

- map
- Panchayat comparison
- forecast values
- reference vs localized forecast
- reliability
- uncertainty
- observations where available
- advisory review
- historical/validation information

## Admin Experience

Show:

- provider status
- data freshness
- model version
- system health
- ingestion status
- errors
- configuration

## Exit Gate

Each role has a coherent end-to-end flow.

---

# 14. Phase 10 — Validation & Hardening

## Objective

Ensure the MVP is robust enough for demonstration.

## Backend Testing

Test:

- forecast endpoints
- Panchayat endpoints
- advisory endpoints
- error responses
- provider failure
- missing data
- invalid Panchayat
- unauthorized access where applicable

## Data Testing

Test:

- timestamps
- units
- missing values
- invalid coordinates
- geometry validity
- duplicate records
- stale forecasts

## Model Testing

Test:

- input schema
- prediction output
- missing feature behavior
- model versioning
- fallback behavior
- uncertainty output

## Frontend Testing

Test:

- mobile width
- desktop width
- map
- filters
- loading
- error
- empty states
- accessibility basics

## Integration Testing

At minimum:

User selection
→ Panchayat
→ forecast
→ localized result
→ reliability
→ advisory

## Exit Gate

The full workflow completes successfully without manual database manipulation or code changes during the demo.

---

# 15. Phase 11 — SIH Demonstration Readiness

## Objective

Create a stable, rehearsed prototype.

## Demo Scenario

A single carefully controlled scenario should demonstrate:

1. Select state.
2. Select district.
3. Select block.
4. Select Panchayat.
5. Load real/reference weather.
6. Show localized/downscaled output.
7. Explain what changed.
8. Show reliability.
9. Show agricultural advisory.
10. Show validation evidence.

## Demo Data

Prefer:

- real live data
- real geographic data
- experimentally validated outputs

Where historical/model outputs are precomputed, clearly identify them as historical/precomputed.

## Failure Handling

Prepare an honest fallback for:

- API unavailable
- network failure
- model failure
- missing observations

Do not falsify real-time operation.

## Exit Gate

The complete demonstration can be executed repeatedly.

---

# 16. Phase 12 — Post-MVP Production-System Scientific Validation

**STATUS: COMPLETE**

**Objective:** Validate the actual production forecast pipeline
(Open-Meteo + Open-Meteo/SRTM + B2) against historical NOAA ISD observations.

**Key findings:**

1. **Production-equivalent historical forecast data IS available.**
   Open-Meteo Historical Forecast API (`historical-forecast-api.open-meteo.com`) provides
   hindcast re-runs using the same model (GFS Seamless / `best_match`) and SRTM elevation
   as the live production API. ERA5 was NOT used.

2. **Elevation difference = 0 for all 18 stations.**
   Both the forecast API and the Elevation API use the same SRTM 90m DEM. When queried
   at the same station coordinates, they return identical elevation values. B2 correction = 0
   for every observation. B2 ≡ B0 in this validation.

3. **This is a structural validation blocker, not a physics failure.**
   The validation could not create conditions where B2 applies a nonzero correction.
   The Phase 6 result (B2 MAE 1.555 °C) was possible because GFS native orography
   diverges significantly from high-resolution SRTM. Open-Meteo already applies SRTM
   internally, eliminating that divergence.

4. **B0 MAE: 1.4221 °C (Open-Meteo reference).**
   Open-Meteo reference forecasts are more accurate than raw GFS GRIB2, consistent
   with their internal bias corrections.

**Scientific Gate: NO-GO (structural blocker)**

**Production impact:** No changes. B2 formula, API, frontend, and disclaimer unchanged.

**Test suite:** 43/43 tests pass (including test isolation fix for `test_weather_api_automatic_b2`).

**Reports:**
- `experiments/phase12/reports/production_validation_report.md`
- `experiments/phase12/reports/production_vs_phase6_comparison.md`
- `experiments/phase12/predictions/production_b0_b2_predictions.csv`

**Scientific chain:**
```
Phase 6 (GFS GRIB2): B2 MAE 1.555 °C, B0 MAE 1.705 °C → GO WITH LIMITATION
Phase 12 (Open-Meteo): B2 = B0 = 1.422 °C → NO-GO (structural, not physics)
Phase 6 result does NOT transfer to production. EXPERIMENTAL label retained.
```

No post-MVP feature should be promoted into the MVP without a clear reason.


---

# 17. Phase Dependencies

The project follows this dependency graph:

Documentation
→ Environment
→ Data Provider
→ GIS
→ Live Forecast
→ Baseline Localization
→ Scientific Validation
→ Reliability
→ Advisory
→ Product Integration
→ Hardening
→ Demonstration

Critical rule:

**Frontend polish must not block scientific experimentation.**

Critical rule:

**Scientific claims must not be made before validation.**

Critical rule:

**Advisory logic must not depend on unverified forecast claims.**

---

# 18. Parallel Workstreams

After Phase 1, teams may work in parallel where dependencies allow.

## Workstream A — Data/Scientific

- providers
- GIS data
- preprocessing
- experiments
- training
- validation

## Workstream B — Backend

- schemas
- database
- APIs
- provider abstraction
- authentication
- reliability service

## Workstream C — Frontend

- shell
- map
- hierarchy selector
- forecast cards
- comparison view
- reliability view

## Workstream D — Advisory/Product

- advisory rule catalogue
- agricultural UX
- officer workflow

The workstreams must converge only through documented interfaces.

---

# 19. Definition of Phase Completion

A phase is complete only when:

1. Its deliverables exist.
2. Its tests/verification pass.
3. Its output is documented.
4. Known limitations are recorded.
5. No unresolved critical blocker is hidden.
6. The next phase has the required inputs.

Code existing in a branch does not constitute phase completion.

---

# 20. Scientific Decision Gates

These gates control the research direction.

## Gate A — Data Viability

If required data cannot be obtained or aligned:
- change dataset strategy
- change pilot scope
- or redefine the claim

Do not manufacture data.

## Gate B — Baseline Viability

If localized baseline does not improve the raw forecast:
- investigate why
- test an alternate scientifically justified baseline
- do not immediately add complex ML

## Gate C — ML Viability

Only introduce ML when:
- enough training data exists
- leakage is controlled
- strong baselines exist
- measurable residual signal exists

If ML fails:
- remove ML from MVP.

## Gate D — Reliability Viability

Only claim reliability-aware innovation if the reliability mechanism is experimentally useful.

## Gate E — Panchayat Claim

If local observations cannot support a strong Panchayat accuracy claim:
- describe the product as Panchayat-location estimation/inference
- disclose validation limitations

## Gate F — Advisory Viability

Only expose agricultural recommendations whose underlying weather inputs and rule logic are validated/documented.

---

# 21. Model Lifecycle

Every production model must have:

- model ID
- version
- training data reference
- feature schema
- training period
- validation period
- metrics
- creation timestamp
- deployment status

Use statuses such as:

- EXPERIMENTAL
- VALIDATED
- ACTIVE
- RETIRED

Only `VALIDATED`/`ACTIVE` models may be used for claims of validated prediction.

---

# 22. Data Lifecycle

Recommended flow:

RAW
→ VALIDATED
→ NORMALIZED
→ PROCESSED
→ FEATURE_READY
→ EXPERIMENTAL
→ PRODUCTION_READY

Raw source data must remain immutable where practical.

Derived data must preserve source provenance.

---

# 23. Environment Separation

Maintain at least:

## Development

For active coding.

## Experimentation

For data science/model development.

## Demonstration

Stable, reproducible configuration for SIH showcase.

Do not allow an experimental model to silently replace the demo model.

---

# 24. MVP Freeze

Before the final demonstration, freeze:

- provider configuration
- database schema
- Panchayat dataset
- advisory rules
- active model version
- frontend navigation
- API contracts

Any change after freeze requires a documented reason and re-test.

---

# 25. What Must NOT Be Done Before MVP

Do not prioritize:

- native Android app
- iOS app
- nationwide deployment
- all-weather-variable support
- deep learning research
- advanced cloud infrastructure
- blockchain
- LLM-based advisory generation
- unnecessary microservices
- complex user-management systems
- non-essential notification infrastructure

unless the documented MVP requirements change.

---

# 26. Recommended MVP Completion Sequence

The shortest viable route is:

1. Create project documents.
2. Create repository structure.
3. Bring up Next.js + FastAPI + PostgreSQL/PostGIS.
4. Implement one real forecast provider.
5. Load a real pilot-region Panchayat dataset.
6. Display Panchayats on the map.
7. Connect selected Panchayat to forecast.
8. Implement reference forecast UI.
9. Implement the first transparent localization baseline.
10. Build the scientific experiment pipeline.
11. Select the validated localization method.
12. Add reliability/fallback only if justified.
13. Add small advisory rule set.
14. Integrate farmer/officer workflows.
15. Add validation/comparison screen.
16. Test failure scenarios.
17. Freeze MVP.
18. Rehearse SIH demonstration.

---

# 27. Final Phase Decision Rule

At the end of development, the team must be able to state exactly:

- What enters the system.
- What transformation occurs.
- What the model/algorithm contributes.
- What the output represents.
- What data supports the output.
- How the output was validated.
- Where the system is uncertain.
- What happens when it is uncertain.
- What agricultural decision it supports.
- What remains unproven.

If any of these are unknown, the project is not scientifically complete even if the UI is finished.

---

# 28. Completion Definition for the SIH MVP

The MVP is considered complete when all of the following are true:

- A real weather provider is integrated.
- Panchayat geography works.
- User can select a Panchayat.
- Forecast is displayed.
- Localized forecast output is generated through the selected MVP method.
- The system distinguishes reference and localized forecast.
- Reliability/fallback behavior is implemented if scientifically justified.
- At least a small documented advisory set works.
- Officer and farmer views are usable.
- Backend and frontend communicate through documented APIs.
- Database persists required data.
- Basic validation evidence is available.
- No major claim depends on fabricated data.
- Demo can run from a stable configuration.
- Known limitations are visible in documentation.

---

# 29. Final Principle

The phases are not a race to build features.

They are a sequence for reducing uncertainty.

The correct project outcome may be:

- a simple physical/statistical system,
- a hybrid ML system,
- a probabilistic system,
- or another validated formulation.

The project is successful when experimentation determines the method rather than the method being decided first and the experiments being shaped around it.

> Build only what can be verified.
> Validate before claiming.
> Simplify before adding complexity.
> Preserve fallback paths.
> Make scientific uncertainty visible.

## Phase 13 — Production B2 Spatial-Difference Validation
**Status:** COMPLETE (RESEARCH PHASE)
**Objective:** Determine whether the Phase 12 zero-elevation-difference result is a validation-design artifact and whether the real production B2 spatial correction can be historically evaluated without leakage.
**Outcome:** SCIENTIFIC GATE: NO-GO (Blocker: Data Geometry). The maximum elevation difference found between the snapped Open-Meteo historical forecast grid and the true station coordinate across all 18 historical validation stations is < 80m. A difference of 80m corresponds to a B2 correction of just ~0.5 °C, which is well below the RMSE noise floor of the forecast (~1.9 °C). There is insufficient signal in this historical dataset to statistically validate the spatial B2 correction in production. Production B2 remains EXPERIMENTAL — GO WITH LIMITATION.
