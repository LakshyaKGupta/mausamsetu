# SIH 26074 — Architecture Specification

**Project:** Panchayat-Level Weather Downscaling & Agro-Meteorological Advisory Platform  
**Problem Statement ID:** SIH 26074  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Category:** Software  
**Theme:** Agriculture, FoodTech & Rural Development  
**Document:** `architecture.md`  
**Status:** Architecture baseline for MVP and future validated downscaling engine

---

## 1. Purpose

This document defines the architectural structure, boundaries, interfaces, responsibilities, technology direction, and non-negotiable invariants for the SIH 26074 solution.

The system is designed as a **Panchayat-level weather intelligence and agro-meteorological advisory platform**. It receives a weather forecast from an available provider, combines it with geographic and historical/contextual information, optionally applies a validated downscaling/post-processing method, estimates reliability/uncertainty, and exposes the resulting Panchayat-level information to officers and farmers.

The MVP is a **responsive web application / Progressive Web App (PWA)** backed by FastAPI and PostgreSQL/PostGIS. A separate native Android/iOS application is explicitly out of scope for the MVP.

The architecture is intentionally **model-agnostic**. The final scientific downscaling method is not hard-coded into the architecture. It must be selected through experimentation and validation in the research pipeline.

---

# 2. Problem Interpretation

The platform addresses the practical gap between an available weather forecast and the level of local information required for Panchayat-scale agricultural decisions.

The architecture treats the core scientific task as:

> **Forecast input → spatial/physical/statistical post-processing → Panchayat-representative weather estimate + reliability/uncertainty**

This is not a replacement for numerical weather prediction. The system is a **post-processing/downscaling layer** around an authoritative/reference forecast source.

The architecture therefore separates:

1. **Forecast generation/provider data**
2. **Historical observations and scientific training data**
3. **Geospatial context**
4. **Downscaling/post-processing**
5. **Reliability and uncertainty**
6. **Agricultural advisory interpretation**
7. **User presentation**

---

# 3. High-Level Architecture

```text
                             ┌─────────────────────────┐
                             │       DATA SOURCES       │
                             └────────────┬────────────┘
                                          │
                   ┌──────────────────────┼──────────────────────┐
                   │                      │                      │
                   ▼                      ▼                      ▼
            Weather Providers      Historical Weather       Geospatial Data
             IMD / GFS / API       Observations / Research  Panchayat / DEM
                   │                      │                      │
                   └──────────────────────┼──────────────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │     DATA INGESTION      │
                             └────────────┬────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │     DATA PROCESSING     │
                             └────────────┬────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │ GIS + FEATURE ENGINE    │
                             └────────────┬────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │ DOWNSCALING ENGINE      │
                             │ model-agnostic module   │
                             └────────────┬────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │ RELIABILITY / UNCERTAINTY      │
                         └────────────────┬────────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │ PANCHAYAT FORECAST      │
                             └────────────┬────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │ AGRICULTURAL ADVISORY   │
                             │ ENGINE                  │
                             └────────────┬────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │ POSTGRESQL + POSTGIS    │
                             └────────────┬────────────┘
                                          ▼
                             ┌─────────────────────────┐
                             │       FASTAPI API       │
                             └────────────┬────────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         ▼                                 ▼
                ┌───────────────────┐             ┌──────────────────┐
                │     PWA FRONTEND  │             │   API CLIENTS     │
                └─────────┬─────────┘             └──────────────────┘
                          │
                 ┌────────┼─────────┐
                 ▼        ▼         ▼
              Farmer   Officer    Admin
```

---

# 4. Architectural Principles

## 4.1 Data provenance first

Every forecast/prediction must retain information about where it came from.

The system must distinguish:

- live/reference forecast
- historical observation
- reanalysis/reference data
- derived feature
- model prediction
- advisory decision

These must never be silently mixed.

## 4.2 Model independence

The UI, API, database, and advisory engine must not depend on a particular ML algorithm.

The downscaling engine is a replaceable module.

Possible future implementations may include:

- physical correction
- interpolation
- statistical correction
- linear residual correction
- tree-based residual ML
- probabilistic downscaling
- hybrid physical + ML

Only a scientifically validated implementation should be promoted to the production inference path.

## 4.3 Live API is not the model

A third-party weather API may provide live/reference weather for the MVP.

Its output must be labeled as the provider's forecast/reference information.

It must not be represented as the project's AI/downscaling output unless an actual project model transforms it.

## 4.4 Fail safely

When a local correction cannot be considered reliable, the system should be capable of falling back to the authoritative/reference forecast or another approved baseline.

## 4.5 Evidence before complexity

The architecture supports advanced ML but does not require it.

A simpler validated method must remain capable of being the final production method if it outperforms a more complex method.

## 4.6 Modular monolith for MVP

The MVP uses a modular monolith rather than microservices.

This minimizes infrastructure complexity while keeping domain modules clearly separated.

---

# 5. Logical Components

## 5.1 Weather Provider Layer

### Responsibility

Abstract all external weather forecast providers behind one internal interface.

### Core interface

```text
ForecastProvider
├── get_current_weather()
├── get_forecast()
├── get_provider_metadata()
└── health_check()
```

### Candidate adapters

```text
ForecastProvider
├── OpenMeteoProvider      # MVP/reference provider where permitted
├── IMDProvider            # official integration when credentials/access are available
└── GFSProvider            # research/alternate forecast source
```

Only verified, working integrations may be marked active.

### Provider metadata

Every retrieved forecast should carry, where available:

- provider name
- provider version/product
- issue time
- valid time
- forecast lead time
- location/grid information
- retrieval time
- source request identifier or URL reference

---

# 6. Historical Weather / Observation Layer

## Responsibility

Manage datasets used for:

- scientific experiments
- model training
- model validation
- bias estimation
- reliability calibration

Examples may include official station observations and research datasets, but the exact datasets are controlled by the research/data pipeline and must be verified before use.

### Separation requirement

Historical observations must never be confused with the live forecast layer.

The research system must preserve whether a value is:

- direct observation
- reanalysis
- derived/interpolated reference

---

# 7. Geospatial Data Layer

## Responsibility

Provide authoritative geographic context for the forecast and Panchayat representation.

### Required logical data

- state
- district
- block
- Panchayat
- Panchayat geometry
- administrative identifiers
- coordinates
- elevation/DEM-derived information

### Future optional spatial features

- slope
- aspect
- terrain ruggedness
- land cover
- soil information
- vegetation indices
- distance to water bodies

These must only be added when they have a demonstrated scientific/use-case benefit.

---

# 8. Data Ingestion Layer

## Responsibility

Acquire, validate, normalize, cache, and persist external data.

### Pipeline

```text
External Source
      ↓
Fetcher
      ↓
Schema Validation
      ↓
Timestamp Validation
      ↓
Unit Normalization
      ↓
Geospatial Validation
      ↓
Quality Checks
      ↓
Cache / Database / File Store
```

### Requirements

- API/network failures must be logged.
- Invalid records must not silently enter the production dataset.
- Raw source records should be retained where practical for reproducibility.
- Ingestion must be idempotent where practical.
- Frontend must never directly call external weather providers.

---

# 9. Data Processing Layer

## Responsibility

Convert raw data into standardized internal representations.

### Responsibilities

- timezone normalization
- timestamp alignment
- forecast lead-time derivation
- unit normalization
- missing-value handling
- duplicate detection
- range validation
- geographic coordinate validation
- accumulation handling for precipitation
- historical/current data tagging

### Provenance fields

Each normalized record should retain source/provenance metadata wherever possible.

---

# 10. GIS and Feature Engineering Layer

## Responsibility

Build the spatial context used by the downstream forecast/downscaling engine.

### Examples

For a Panchayat/location:

```text
Panchayat
   ↓
Geometry
   ↓
Centroid / representative location
   ↓
Forecast grid relationship
   ↓
DEM extraction
   ↓
Elevation / slope / aspect / terrain metrics
   ↓
Model features
```

The final set of features is determined experimentally.

No feature is mandatory solely because it is easy to calculate.

---

# 11. Downscaling Engine

## 11.1 Purpose

Transform available forecast information into a localized Panchayat-representative weather estimate.

## 11.2 Interface

```text
DownscalingEngine
├── prepare_features(context)
├── predict(input)
├── estimate_uncertainty(input, prediction)
├── explain_prediction(input, prediction)
└── get_model_metadata()
```

## 11.3 Design requirement

The rest of the system must not need to know whether the engine uses:

- interpolation
- statistical correction
- physical correction
- regression
- Random Forest
- XGBoost
- neural network
- ensemble
- another validated method

This allows research experimentation without changing the application architecture.

## 11.4 Production rule

Only a model/method supported by validation results may become the default production engine.

The research pipeline may contain many experimental models; production inference must expose exactly one approved default plus explicitly configured fallback methods.

---

# 12. Reliability and Uncertainty Layer

## Responsibility

Determine whether a localized prediction can be trusted sufficiently for its intended use and provide uncertainty/reliability metadata.

### Conceptual flow

```text
Localized Prediction
        +
Uncertainty / Reliability Evidence
        ↓
Reliability Decision
      /       \
   Reliable   Unreliable
      ↓            ↓
Serve local   Fallback to approved
prediction    base/reference estimate
```

### Candidate evidence

Depending on final research results:

- prediction interval width
- calibration evidence
- observation distance
- observation density
- terrain variability
- feature-space distance / OOD signal
- forecast lead time
- historical residual behavior
- model disagreement

### Important rule

The system must not generate arbitrary confidence numbers such as `93% confidence` unless the underlying model has a valid statistical interpretation.

The UI may instead use controlled labels such as:

- High reliability
- Moderate reliability
- Low reliability

when supported by explicit rules or calibrated statistical methods.

---

# 13. Fallback Strategy

Fallback is a first-class architectural capability.

### Preferred flow

```text
Reference Forecast
       ↓
Local Correction
       ↓
Reliability Assessment
       ↓
 ┌───────────────┐
 │ Reliable?     │
 └──────┬────────┘
        │
   Yes  │  No
    ↓   │   ↓
 Local  │  Base/reference
 estimate│ forecast
```

Fallback policy must be configurable by model/version and use case.

No production feature may assume that the ML/local correction is always better than the original forecast.

---

# 14. Panchayat Forecast Service

## Responsibility

Convert the selected localized prediction into a stable Panchayat-level service object.

### Logical output

```text
PanchayatForecast
├── panchayat_id
├── panchayat_name
├── block_id
├── district_id
├── location / geometry reference
├── forecast_period
├── variables
├── source_forecast_reference
├── localization_method
├── model_version
├── prediction_timestamp
├── reliability_status
├── uncertainty information
└── fallback_used
```

The exact schema will be finalized in `prd.md` and implementation design.

---

# 15. Agricultural Advisory Engine

## Responsibility

Translate weather information into documented, understandable agricultural actions.

### Architectural rule

The advisory engine is separate from the weather prediction engine.

```text
Panchayat Weather
      +
Agricultural Context
      +
Documented Advisory Rules
      ↓
Advisory
```

### Initial context may include

- crop
- crop stage
- planned irrigation
- spraying activity
- harvesting activity

### Example advisory categories

- irrigation
- spraying window
- rainfall precaution
- harvest timing
- extreme-weather precaution

### MVP rule

The MVP should use a small transparent rule set based on approved/project documentation.

Do not make an LLM responsible for safety-critical agricultural recommendations in the MVP.

If natural-language generation is introduced later, it must operate only after deterministic eligibility/rule logic has decided what advice is permitted.

---

# 16. Database Architecture

## Technology

**PostgreSQL + PostGIS**

## Main logical entities

```text
states
 districts
  blocks
   panchayats

forecast_sources
forecast_runs
forecast_values

observations
geographic_features

downscaled_predictions
prediction_uncertainty

advisories
advisory_rules

model_versions
validation_results

system_events
```

## Spatial requirements

Use PostGIS for:

- Panchayat polygon storage
- spatial relationships
- coordinate queries
- nearest-location operations
- geometry-based filtering

The exact relational schema belongs in the implementation/design stage.

---

# 17. Backend Architecture

## Technology

**Python + FastAPI + Pydantic**

## Logical modules

```text
backend/app/
├── api/
├── core/
├── providers/
├── weather/
├── gis/
├── downscaling/
├── reliability/
├── advisory/
├── database/
├── schemas/
└── services/
```

## Responsibilities

### `providers/`
External weather and data-provider adapters.

### `weather/`
Normalized weather business logic.

### `gis/`
Panchayat and spatial operations.

### `downscaling/`
Model-independent downscaling interfaces and production inference.

### `reliability/`
Uncertainty and fallback decision logic.

### `advisory/`
Deterministic agriculture advisory logic.

### `database/`
ORM, repositories, migrations, PostGIS access.

### `schemas/`
Pydantic request/response models.

### `services/`
Application-level orchestration.

---

# 18. Frontend Architecture

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- component library approach such as shadcn/ui
- PWA support
- Leaflet or MapLibre for geospatial visualization

## Architectural concept

```text
Next.js UI
   ↓
Typed API Client
   ↓
FastAPI
```

The frontend must not directly access:

- weather-provider APIs
- database
- model files
- internal Python services

## Frontend role separation

### Farmer

Simple, actionable information:

- current/local weather
- short forecast
- rainfall alerts
- agricultural advisory
- reliability indicator where useful

### Officer

Detailed information:

- district/block/Panchayat map
- weather layers
- forecast comparison
- localized forecast
- reliability
- observation/reference information
- advisories
- validation information

### Admin

Operational information:

- provider status
- data ingestion status
- model version
- service health
- system logs/status

Role capabilities are controlled by the eventual authentication/authorization design.

---

# 19. PWA and Mobile Strategy

The MVP is a responsive web application with PWA support.

A separate native mobile application is not part of the MVP.

The architecture must be mobile-friendly through responsive design.

If the project later requires native capabilities, the backend APIs should already allow a mobile application to become an additional client without rewriting the core domain services.

---

# 20. Map Architecture

Maps are a primary feature rather than decoration.

### MVP layers

1. Panchayat boundaries
2. Selected Panchayat
3. Weather status
4. Advisory status
5. Reliability status where available

### Optional later layers

- observation stations
- rainfall raster
- elevation
- uncertainty surface
- coarse forecast grid
- localized forecast grid

### Map interaction

```text
State
  ↓
District
  ↓
Block
  ↓
Panchayat
  ↓
Panchayat weather
  ↓
Advisory / reliability
```

---

# 21. Research and Production Separation

Scientific experimentation must not be tightly coupled to production application code.

Recommended logical structure:

```text
research/
├── data/
├── experiments/
├── training/
├── validation/
└── notebooks/

models/

backend/
└── app/
    └── downscaling/
        └── production inference adapters
```

Research code may test multiple methods.

Production code should load only approved/versioned artifacts and configurations.

---

# 22. External API Architecture

The MVP may use a real live/reference weather provider for presentation purposes.

The recommended architecture is:

```text
WeatherProvider interface
        │
        ├── MVP provider
        ├── IMD adapter
        └── GFS/other adapter
```

### Required behavior

The external provider response must be normalized before it enters application logic.

The API response exposed by FastAPI must be provider-neutral.

### Example conceptual transformation

```text
External API response
        ↓
Provider Adapter
        ↓
NormalizedForecast
        ↓
Downscaling / Post-processing
        ↓
PanchayatForecast
```

A provider may be used to show live data during demonstrations without implying that it is part of the project's scientific contribution.

---

# 23. Security Architecture

## Rules

- credentials only in environment/configuration secrets
- no API keys in frontend code
- validate API inputs
- authenticate protected administration endpoints
- implement authorization for role-sensitive operations
- sanitize/log external data carefully
- protect administrative actions
- do not expose internal model files through public endpoints

## Secrets

Never commit:

- API keys
- passwords
- tokens
- database credentials
- private certificates

---

# 24. Observability and Auditability

The application must be able to reconstruct the origin of an output.

Log major events such as:

- provider request
- provider failure
- data validation failure
- forecast ingestion
- model execution
- fallback activation
- advisory generation
- officer approval/modification/rejection
- API errors
- administrative changes

Each model-generated forecast should be traceable to:

- source forecast
- model/method
- version
- execution timestamp
- reliability decision

---

# 25. Error Handling

## External provider failure

Use configured fallback provider/cache where available.

## Downscaling failure

Fall back to configured reference/base forecast.

## Missing geographic data

Do not fabricate geometry.

Mark the location/data as unavailable or use an explicitly approved fallback.

## Missing model artifact

Fail safely and do not silently generate fake model output.

## Advisory failure

Do not show a fabricated agricultural recommendation. Return a controlled unavailable state.

---

# 26. MVP Architecture Scope

The MVP should be small enough to complete while demonstrating the central idea.

### Geographic scope

- one pilot district/region selected through actual data availability
- multiple blocks/Panchayats where data permits

### Weather scope

Initial priority:

- temperature
- rainfall

Additional variables may be added only if they have adequate data and implementation time.

### Forecast scope

Approximately 1–3 days, subject to provider capability and scientific validation.

### MVP capabilities

- Panchayat selection
- interactive map
- live/reference weather forecast
- localized/post-processed forecast representation
- raw/reference vs localized comparison
- reliability indicator
- basic uncertainty representation where scientifically supported
- agricultural advisory rules
- Farmer view
- Officer view
- basic Admin/health view
- validation/comparison page

---

# 27. Non-Goals for MVP

Do not include the following unless a later requirement explicitly promotes them into scope:

- nationwide Panchayat deployment
- separate native mobile apps
- full numerical weather prediction
- supercomputer-scale atmospheric simulation
- huge deep-learning architectures without evidence
- blockchain
- unnecessary microservices
- Kubernetes
- Kafka
- real-time streaming infrastructure without need
- LLM-based weather prediction
- LLM-only agricultural safety decisions
- unsupported IMD integrations
- fabricated Panchayat-level ground truth
- fabricated model metrics

---

# 28. Deployment Architecture

## MVP

```text
Next.js / PWA
      ↓
FastAPI
      ↓
PostgreSQL + PostGIS
      ↑
Python data/model services
      ↑
External forecast providers
```

This may be deployed as a small number of services/processes while keeping the domain architecture modular.

## Principle

Use the simplest deployment capable of demonstrating the system.

Cloud choice is intentionally left open until `prd.md` and `phases.md` establish operational requirements.

---

# 29. Repository Structure

```text
project-root/
│
├── architecture.md
├── prd.md
├── rules.md
├── phases.md
├── design.md
├── memory.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── providers/
│   │   ├── weather/
│   │   ├── gis/
│   │   ├── downscaling/
│   │   ├── reliability/
│   │   ├── advisory/
│   │   ├── database/
│   │   ├── schemas/
│   │   └── services/
│   │
│   └── tests/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   └── public/
│
├── research/
│   ├── data/
│   ├── experiments/
│   ├── training/
│   ├── validation/
│   └── notebooks/
│
├── models/
├── data/
│   ├── raw/
│   ├── processed/
│   └── metadata/
│
├── scripts/
├── config/
├── docs/
└── README.md
```

The final implementation may adjust this structure only when an architectural reason exists and the corresponding decision is documented.

---

# 30. Architecture Data Flow

## Live/reference forecast flow

```text
Weather Provider
      ↓
Provider Adapter
      ↓
Normalized Forecast
      ↓
Panchayat/Coordinate Matching
      ↓
Optional Downscaling/Post-processing
      ↓
Reliability Check
      ↓
Panchayat Forecast
      ↓
API
      ↓
Frontend
```

## Research flow

```text
Historical Forecast
      +
Observations
      +
Geospatial Data
      ↓
Dataset Alignment
      ↓
Quality Control
      ↓
Feature Engineering
      ↓
Baseline Experiments
      ↓
Candidate Models
      ↓
Spatial/Temporal Validation
      ↓
Model Selection
      ↓
Versioned Model Artifact
      ↓
Production Inference Adapter
```

## Advisory flow

```text
Panchayat Forecast
      +
Crop / Agricultural Context
      +
Documented Rule Set
      ↓
Advisory Decision
      ↓
Human review where required
      ↓
Published Advisory
```

---

# 31. API Boundary Principle

The frontend communicates only with FastAPI.

FastAPI is the stable application boundary.

External provider-specific schemas must never leak into the frontend.

The API should expose domain concepts such as:

```text
Panchayat
Forecast
LocalizedForecast
Reliability
Advisory
ValidationResult
ProviderStatus
```

rather than raw provider-specific response structures.

The detailed endpoint contract belongs in `prd.md` and implementation design.

---

# 32. Versioning

The following should be versionable:

- forecast provider configuration
- preprocessing pipeline
- downscaling method/model
- model parameters/artifact
- reliability method
- advisory rule set

A prediction should be traceable to the model/method and rule-set versions used to generate it.

---

# 33. Architectural Invariants

The following rules MUST remain true even if implementation details change.

1. The frontend does not directly call external weather providers.
2. Weather providers are abstracted behind internal interfaces.
3. Provider-specific schemas do not leak into application/domain logic.
4. The downscaling engine is replaceable.
5. Experimental models remain separate from production inference.
6. A model is not considered the project's scientific method merely because it exists in the codebase.
7. Live/reference API output is never mislabeled as project-generated downscaled output.
8. Real, reanalysis, derived, interpolated, and synthetic data are explicitly distinguished.
9. Geographic/Panchayat information is treated as a first-class domain concern.
10. Reliability/fallback is independent of the prediction algorithm.
11. The system must be able to fall back when a localized correction is not trustworthy.
12. Agricultural advisory generation is separate from weather prediction.
13. Agricultural recommendations must originate from documented rules or approved logic.
14. No unsupported government API, dataset, or integration may be fabricated.
15. No performance metric may be fabricated.
16. No confidence value may be fabricated.
17. No production component may depend on a secret embedded in source code.
18. MVP infrastructure remains intentionally simple.
19. Every major architectural change must be documented.
20. Scientific claims must be backed by validation evidence before being exposed as product claims.

---

# 34. Open Architectural Questions

These questions are intentionally unresolved and must be decided by later project documents/experiments.

1. Which exact live forecast provider will be the primary operational source for the MVP?
2. Which official IMD integration will be used when access is available?
3. Which district/region will be selected as the pilot?
4. What exact historical forecast/observation dataset will form the primary training/validation corpus?
5. What exact spatial prediction representation is scientifically defensible for the MVP?
6. Which variables can be validated robustly enough to include?
7. Which downscaling method wins against the baseline experiments?
8. Whether ML provides measurable value beyond simpler methods.
9. Whether a reliability gate materially reduces harmful corrections.
10. Which uncertainty technique is appropriate for the selected model/data.
11. Which exact agricultural advisory rule catalogue will be included in the MVP.
12. Which map library (Leaflet or MapLibre) provides the best balance for the final implementation if this has not yet been finalized.
13. Exact authentication and role-management requirements.
14. Exact deployment provider/environment.

No open question should be resolved by assumption when it can be answered through data, experimentation, or an explicit project decision.

---

# 35. Architecture Decision Records

## ADR-001 — Responsive PWA instead of separate native mobile app for MVP

**Decision:** Use a responsive Next.js web application with PWA support.

**Reason:** The MVP is map/dashboard oriented and must work across laptop, tablet, and mobile while minimizing duplicate implementation effort.

**Alternatives considered:** Separate Android app, separate iOS app, separate web + native apps.

**Status:** Accepted for MVP.

---

## ADR-002 — FastAPI backend

**Decision:** Use Python FastAPI as the primary backend API framework.

**Reason:** The system's data-processing, geospatial, experimentation, and ML components are Python-oriented and benefit from a direct API boundary.

**Alternatives considered:** Node.js backend, Java/Spring Boot backend.

**Status:** Accepted for MVP.

---

## ADR-003 — PostgreSQL + PostGIS

**Decision:** Use PostgreSQL with PostGIS for the main application database.

**Reason:** The project requires hierarchical administrative data plus spatial geometry and spatial operations.

**Alternatives considered:** SQLite, PostgreSQL without PostGIS.

**Status:** Accepted as target application database.

---

## ADR-004 — Forecast Provider Abstraction

**Decision:** External forecast sources must be accessed through a provider interface.

**Reason:** Data availability may vary between MVP, research, and eventual government integration.

**Alternatives considered:** Hard-code a single weather provider directly into the frontend/backend.

**Status:** Accepted.

---

## ADR-005 — Replaceable Downscaling Engine

**Decision:** The prediction method is implemented behind a stable downscaling interface.

**Reason:** Scientific experimentation must be allowed to compare simple baselines and ML methods without rewriting the application.

**Alternatives considered:** Hard-code XGBoost or another specific model as the architecture.

**Status:** Accepted.

---

## ADR-006 — Separate Reliability/Fallback Layer

**Decision:** Reliability and fallback are independent of the prediction model.

**Reason:** The system must be able to abstain from a localized correction when evidence is weak.

**Alternatives considered:** Always trust the ML model, confidence generated only by the model.

**Status:** Accepted as architectural capability; final method remains experimental.

---

## ADR-007 — Separate Agricultural Advisory Engine

**Decision:** Advisory generation is a separate application domain component.

**Reason:** Weather prediction and agricultural decision logic have different validation requirements and should not be conflated.

**Alternatives considered:** Generate advisory text directly from the weather model or an LLM.

**Status:** Accepted.

---

## ADR-008 — Modular Monolith for MVP

**Decision:** Use a modular monolith rather than microservices.

**Reason:** The MVP prioritizes scientific validation and demonstrability over distributed infrastructure.

**Alternatives considered:** Microservices, event-driven architecture, Kubernetes deployment.

**Status:** Accepted for MVP.

---

## ADR-009 — Research/Production Separation

**Decision:** Keep research, training, validation, and production inference logically separate.

**Reason:** Experimental work changes frequently while production interfaces must remain stable and auditable.

**Alternatives considered:** Place all ML experimentation directly inside the application backend.

**Status:** Accepted.

---

# 36. Final Architectural Contract

This project is a **weather intelligence and decision-support platform**, not simply a weather dashboard and not automatically an ML system.

The architecture must remain capable of supporting this lifecycle:

```text
REAL FORECAST DATA
        ↓
NORMALIZATION + VALIDATION
        ↓
GEO-SPATIAL CONTEXT
        ↓
VALIDATED LOCALIZATION / DOWNSCALING
        ↓
RELIABILITY / UNCERTAINTY
        ↓
PANCHAYAT-LEVEL INFORMATION
        ↓
DOCUMENTED AGRICULTURAL ADVISORY
        ↓
OFFICER / FARMER EXPERIENCE
```

The final scientific method, pilot geography, data sources, uncertainty method, advisory rule set, and implementation details are intentionally governed by later project documents and experimental evidence.

The architecture must not be altered merely to make the project appear more advanced. Changes should be made only when they improve scientific validity, data feasibility, maintainability, usability, or deployment feasibility.
