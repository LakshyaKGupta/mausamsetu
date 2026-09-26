# SIH 26074 — Product Requirements Document (PRD)

**Project:** Panchayat-Level Weather Downscaling & Agro-Meteorological Advisory Platform  
**Problem Statement ID:** SIH 26074  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Category:** Software  
**Theme:** Agriculture, FoodTech & Rural Development  
**Document:** `prd.md`  
**Status:** Product requirements baseline for MVP and future validated downscaling system  
**Companion document:** `architecture.md`

---

# 1. Purpose

This PRD defines what the SIH 26074 product must do, who it serves, what is included in the MVP, what is explicitly out of scope, and how successful implementation will be evaluated.

The product is a **Panchayat-level weather intelligence and agro-meteorological advisory platform**. It is intended to transform available weather forecast information into locally contextualized information for Panchayats and agricultural decision-making.

The product is not intended to replace numerical weather prediction systems operated by IMD or other forecast providers. It provides a **forecast post-processing/downscaling and decision-support layer**.

The MVP is a **responsive web application / PWA**. A separate native mobile application is not required for the MVP.

---

# 2. Product Vision

> **Make forecast information more locally useful for Panchayat-level agricultural decisions by combining forecast data with geographic context, scientifically validated post-processing/downscaling, reliability information, and transparent agro-meteorological advisories.**

The product should answer, for a selected Panchayat:

1. What weather is expected?
2. What does that mean locally compared with the available/reference forecast?
3. How reliable is the localized estimate?
4. What agricultural action may be appropriate?
5. Where did the information come from?

---

# 3. Product Problem

Weather information can be available at a spatial scale that is too coarse or insufficiently contextualized for decisions made at individual Panchayat/locality level.

Agricultural decisions such as irrigation timing, spraying, harvest planning, and response to rainfall events can depend on local conditions.

The product therefore needs to provide a bridge between:

```text
Available Forecast
       ↓
Local Geographic Context
       ↓
Validated Post-processing / Downscaling
       ↓
Panchayat-representative Weather
       ↓
Reliability / Uncertainty
       ↓
Agricultural Decision Support
```

The system must not claim that an external forecast provider itself is performing the project's downscaling.

---

# 4. Product Goals

## 4.1 Primary Goals

1. Provide an easy way to select a State → District → Block → Panchayat.
2. Display current/reference weather and forecast information for the selected Panchayat.
3. Provide a separate localized/post-processed forecast representation when such a method is available.
4. Clearly show the source and provenance of every forecast.
5. Show a reliability/uncertainty status for localized predictions when scientifically supported.
6. Support a safe fallback to the authoritative/reference forecast when a localized correction is not considered reliable.
7. Generate transparent, rule-based agro-meteorological advisories for the MVP.
8. Provide an officer-oriented view for examining forecasts, local corrections, reliability, and advisories.
9. Provide a simple farmer-oriented view focused on actions rather than technical details.
10. Keep the production application modular so the validated scientific downscaling model can be introduced or replaced without redesigning the product.

## 4.2 Scientific Goals

1. Preserve a strict distinction between forecasts, observations, reanalysis, derived values, and model predictions.
2. Allow comparison of an unmodified/reference forecast against a localized method.
3. Support validation results from the research pipeline.
4. Avoid presenting unsupported accuracy claims.
5. Allow model/version provenance to be surfaced to authorized users.

## 4.3 Engineering Goals

1. Use a maintainable modular monolith for the MVP.
2. Keep frontend independent of external weather provider response formats.
3. Keep model inference independent of UI implementation.
4. Make external providers replaceable.
5. Ensure the system remains functional in a demo environment even when live external data is temporarily unavailable by using clearly labeled cached/demo data.
6. Keep sensitive credentials on the backend only.

---

# 5. Non-Goals / Explicitly Out of Scope for MVP

The following are NOT required for the initial MVP:

- A native Android application.
- A native iOS application.
- India-wide operational deployment.
- A full numerical weather prediction model.
- Running the Bharat Forecast System itself.
- A supercomputer-scale dynamical downscaling system.
- Deep-learning weather super-resolution unless experiments later justify it.
- A chatbot as the primary advisory mechanism.
- Blockchain.
- Unnecessary microservices.
- Nationwide real-time data ingestion for every Panchayat.
- Automatic claims of Panchayat-level truth when validation observations do not exist.
- Automatic claims that third-party API data is the project's own prediction.
- Unverified government/API integrations.
- A massive farmer social network.
- Payments, e-commerce, marketplace functionality, or unrelated agricultural services.

---

# 6. Target Users

## 6.1 Farmer

### Needs

- Simple local weather information.
- Clear rainfall/temperature information.
- Action-oriented advisory.
- Alerts for relevant weather conditions.
- Minimal technical terminology.

### Product behavior

The farmer view should prioritize:

- selected Panchayat
- today's weather
- short forecast
- rainfall probability/amount where available
- major alerts
- recommended action
- advisory explanation

The farmer should not be required to understand ML models, forecast grids, model versions, or statistical validation.

---

## 6.2 Agriculture Officer / Extension Worker

### Needs

- Detailed Panchayat forecasts.
- Compare forecasts across Panchayats.
- Inspect localized corrections.
- Inspect reliability.
- Review advisories.
- Understand source/provenance.
- See validation information.
- Identify low-confidence forecasts requiring caution.

### Product behavior

The officer view should expose more technical detail than the farmer view.

---

## 6.3 Administrator

### Needs

- Provider health.
- Data ingestion status.
- Model/version status.
- System health.
- Audit information.
- Configuration.

### Product behavior

Admin functionality should be limited to operational controls required for the MVP.

---

## 6.4 API / System Consumer

Potential future consumers include:

- government portals
- agriculture applications
- research systems
- approved third-party applications

The API must be designed so future consumers can use the same normalized forecast/advisory data as the PWA.

---

# 7. User Journey

## 7.1 Farmer Journey

```text
Open platform
    ↓
Choose location / use configured Panchayat
    ↓
View today's weather
    ↓
View next days
    ↓
View alert
    ↓
View agricultural advisory
    ↓
Take action
```

## 7.2 Officer Journey

```text
Login / Officer mode
    ↓
Choose State
    ↓
District
    ↓
Block
    ↓
Panchayat
    ↓
View map + forecast
    ↓
Compare reference vs localized forecast
    ↓
Inspect reliability / uncertainty
    ↓
Review advisory
    ↓
Approve / modify / flag advisory when the workflow is enabled
```

## 7.3 Admin Journey

```text
Admin login
    ↓
System dashboard
    ↓
Provider status
    ↓
Data status
    ↓
Model status
    ↓
Logs / audit information
```

---

# 8. MVP Scope

The MVP should demonstrate the complete product chain for a limited pilot geography.

## 8.1 Geographic Scope

- One pilot region/district selected based on data availability.
- Panchayat hierarchy must be represented.
- Approximately 15–50 Panchayats are sufficient for demonstration.
- The product must not imply that all Indian Panchayats are currently supported unless they actually are.

## 8.2 Weather Scope

Initial MVP variables:

- Temperature
- Rainfall / precipitation

The system may display additional variables from the live/reference provider when useful, but temperature and rainfall are the core validated demonstration variables.

## 8.3 Forecast Horizon

Target MVP:

- current conditions where available
- hourly forecast where provider supports it
- daily forecast
- approximately 1–3 day localized demonstration

A provider may expose a longer horizon for the reference forecast. The MVP does not need to localize every day of a long-range forecast.

## 8.4 Main MVP Capabilities

1. Location hierarchy.
2. Interactive Panchayat map.
3. Panchayat details.
4. Live/reference forecast.
5. Localized/post-processed forecast layer.
6. Raw vs localized comparison.
7. Reliability status.
8. Basic uncertainty representation.
9. Agricultural advisory.
10. Officer review interface.
11. Basic system/admin status.
12. Forecast provenance.
13. Validation/experiment summary page using real project results when available.

---

# 9. MVP Feature Requirements

## FR-001 — Location Selection

The system shall allow a user to navigate:

```text
State → District → Block → Panchayat
```

### Acceptance Criteria

- Each supported location has a stable internal identifier.
- Panchayat names alone are not treated as unique identifiers.
- Selecting a Panchayat updates the forecast and map state.
- Unsupported locations are clearly indicated.

---

## FR-002 — Panchayat Map

The system shall display an interactive map with Panchayat boundaries for the supported pilot region.

### Acceptance Criteria

- Panchayat boundary is visible for the selected Panchayat.
- Selected Panchayat is visually distinguishable.
- User can navigate among supported Panchayats.
- Map data source/provenance can be identified internally.

---

## FR-003 — Live / Reference Weather

The system shall retrieve weather data through a backend provider adapter.

### Acceptance Criteria

- Frontend never calls the external weather provider directly.
- Provider is identified in the response.
- Forecast issue/retrieval/valid time is retained where available.
- External provider data is labeled as reference/provider forecast.
- API failures are handled gracefully.

---

## FR-004 — Forecast Provider Abstraction

The system shall support a provider abstraction with a normalized internal schema.

### Acceptance Criteria

- Provider-specific response structures are not exposed to the frontend.
- At least one real provider may be active for the MVP.
- Additional providers can be added without rewriting the UI.
- Provider credentials remain server-side.

---

## FR-005 — Localized Forecast

The system shall support a separate localized/post-processed forecast representation.

### Acceptance Criteria

- The localized forecast is clearly distinguished from the reference forecast.
- The result identifies the method/model version when available.
- If no validated localized model is available, the system must not label the reference forecast as a downscaled prediction.
- A placeholder/demo localized layer, when used during early development, must be explicitly marked as DEMO / NOT VALIDATED.

---

## FR-006 — Raw vs Localized Comparison

The system shall provide a comparison view when both reference and localized predictions are available.

### Acceptance Criteria

The view should show, where available:

- reference value
- localized value
- absolute difference
- weather variable
- valid time
- source/model label
- reliability status

The system must not imply that a difference is necessarily an improvement.

---

## FR-007 — Reliability / Uncertainty

The system shall expose reliability information for localized predictions when supported by the scientific pipeline.

### MVP behavior

The system may use:

- High reliability
- Moderate reliability
- Low reliability

only when these labels are backed by the implemented reliability method.

### Acceptance Criteria

- No arbitrary confidence percentage is shown.
- Reliability has an identifiable basis in the backend.
- Low reliability can trigger fallback behavior.

---

## FR-008 — Fallback

The system shall support fallback from localized prediction to a reference/base forecast.

### Acceptance Criteria

- Fallback reason is internally recorded.
- UI indicates that fallback occurred when appropriate.
- The system remains usable if the localized engine is unavailable.
- The reference forecast is not mislabeled as a model prediction.

---

## FR-009 — Weather Advisory

The system shall generate an agricultural advisory using transparent rules for the MVP.

Possible advisory areas:

- irrigation timing
- spraying window
- rainfall-related caution
- harvest timing
- basic extreme-weather caution

### Acceptance Criteria

- Advisory is linked to a Panchayat and forecast period.
- Advisory identifies relevant weather condition(s).
- Advisory rule can be identified internally.
- Unsupported or unverified agricultural thresholds are not fabricated.
- Advisory content is understandable to the intended user.

---

## FR-010 — Advisory Review

Officer workflows should support review of an advisory before it is treated as approved operational content, if officer approval is enabled in the implementation.

The product should support statuses such as:

- Draft
- Pending Review
- Approved
- Modified
- Rejected

The exact workflow may be finalized in `design.md` and `rules.md`.

---

## FR-011 — Forecast History / Timeline

The user shall be able to inspect the forecast for selected dates/times supported by the provider.

### Acceptance Criteria

- Time labels are unambiguous.
- Local time display is separated from stored UTC time.
- Forecast issue/valid time information is retained where available.

---

## FR-012 — Panchayat Weather Summary

The product shall display a concise Panchayat summary.

Example structure:

```text
Panchayat
Today
Temperature
Rainfall
Rain Probability (if available)
Humidity (if available)
Wind (if available)
Reliability
Advisory
```

Only fields actually supported by the data source/model should be rendered.

---

## FR-013 — Alerts

The system shall surface important forecast/advisory conditions.

Examples may include:

- heavy rainfall warning
- high temperature condition
- strong wind condition
- rainfall expected during planned spraying

The exact thresholds must come from the approved advisory/rules specification.

---

## FR-014 — Validation View

The officer/admin experience shall support a validation summary when scientific evaluation data exists.

The page should be capable of showing:

- raw forecast metrics
- baseline metrics
- localized model metrics
- variable-specific metrics
- spatial/temporal validation coverage
- harmful/useful correction analysis

The page must not contain fabricated values.

If experiments have not yet been completed, display a clear status such as:

**Validation not yet available.**

---

## FR-015 — Data Provenance

Every forecast/prediction shown to a user must have provenance metadata available to the backend and, where relevant, the UI.

At minimum:

- source/provider
- retrieved/generated timestamp
- valid time
- model/method identifier where applicable
- data status

---

## FR-016 — Provider Failure Handling

When the live/reference provider cannot be reached:

- show a clear unavailable status;
- use a recent cached forecast only if it is still valid and clearly labeled;
- otherwise show a demo/static dataset only when explicitly configured as demo mode.

Never silently substitute demo data for a live result.

---

## FR-017 — Admin Health

The admin experience shall be able to inspect basic system status:

- weather provider health
- backend health
- database availability
- last successful ingestion
- active model version
- last model/fallback event

---

# 10. Forecast Data Contract

The application should use a normalized internal weather schema.

Conceptually:

```text
ForecastRecord
├── provider
├── location_id
├── valid_time
├── issue_time
├── lead_time
├── temperature
├── precipitation
├── humidity
├── wind_speed
├── wind_direction
├── cloud_cover
├── weather_code
└── provenance
```

The actual implementation must only include fields supported by the selected provider/model.

Provider-specific fields must remain in provider-specific adapters or metadata.

---

# 11. Localized Forecast Contract

A localized forecast record should conceptually contain:

```text
LocalizedForecast
├── panchayat_id
├── valid_time
├── variable
├── reference_value
├── localized_value
├── unit
├── method_id
├── model_version
├── reliability_status
├── uncertainty
├── fallback_used
├── fallback_reason
└── provenance
```

The exact schema will be finalized during implementation.

---

# 12. Advisory Contract

A Panchayat advisory should conceptually contain:

```text
Advisory
├── panchayat_id
├── generated_time
├── valid_from
├── valid_to
├── crop/context (if available)
├── condition
├── recommendation
├── severity
├── rule_id
├── source/reference
├── approval_status
└── provenance
```

The system must preserve the reason for the advisory.

---

# 13. Farmer Experience Requirements

The farmer experience should be designed around **actionability**, not technical complexity.

## Required

- selected Panchayat
- simple weather summary
- short forecast
- important rainfall/temperature information
- clear advisory
- alert state
- source/last-updated information

## Avoid in Farmer View

- raw model feature vectors
- ML hyperparameters
- complex validation plots
- technical jargon
- unnecessary dashboards
- raw API response data

---

# 14. Officer Experience Requirements

The officer experience should provide:

- map
- Panchayat selection
- forecast timeline
- reference/localized comparison
- reliability
- uncertainty
- observation/station context where available
- advisory review
- validation summary
- source metadata

The officer should be able to understand not only the prediction, but also whether it should be trusted.

---

# 15. Admin Experience Requirements

The admin MVP should remain simple.

Required:

- provider health
- data ingestion state
- model state
- system logs/status

Not required:

- complex billing
- user analytics suite
- enterprise configuration platform
- unnecessary infrastructure dashboards

---

# 16. Notifications

Notifications are optional for the MVP.

If implemented, they should be limited to major weather/advisory conditions relevant to the supported region.

Do not build a complex notification infrastructure unless required.

---

# 17. Authentication & Authorization

MVP roles:

- Farmer
- Officer
- Admin

For a hackathon demonstration, authentication may be simplified provided the role boundaries and intended authorization model are clearly represented.

Production credentials, API secrets, and admin configuration must never be exposed to the frontend.

---

# 18. Performance Requirements

The MVP should feel responsive on normal laptop and mobile hardware.

Target behavior:

- common navigation interactions should feel near-instant after data is loaded;
- forecast retrieval should not block the entire page unnecessarily;
- maps should remain usable for the pilot region;
- historical/large datasets should be queried selectively rather than loaded entirely into the browser;
- expensive scientific calculations should not execute directly in the browser.

Exact performance benchmarks may be added after implementation profiling.

---

# 19. Reliability Requirements

The system should gracefully handle:

- external provider failure
- incomplete weather data
- unavailable Panchayat geometry
- unavailable model output
- unreliable localized prediction
- missing advisory context
- malformed external responses
- database errors

The application should fail explicitly rather than display misleading values.

---

# 20. Data Integrity Requirements

The following classifications are mandatory:

### Observation
Direct measurement from an observation station.

### Forecast
Prediction generated by an external weather provider.

### Reanalysis / Reference
Historical model-derived reconstruction.

### Derived Data
Computed from another dataset.

### Model Prediction
Output generated by the project's downscaling/post-processing engine.

### Advisory
Decision-support output generated from forecast and agricultural rules.

These categories must not be silently conflated.

---

# 21. Scientific Product Requirements

The product must be compatible with a research workflow in which the final downscaling methodology is selected experimentally.

The product therefore requires:

1. A model-provider abstraction.
2. Model/version identifiers.
3. Baseline/reference comparison.
4. Validation metadata.
5. Reliability/fallback support.
6. Ability to disable an unvalidated model.
7. Ability to display the source used for the result.

The product must never depend on an unvalidated ML model merely to make the UI look intelligent.

---

# 22. MVP Weather API Policy

A live weather API may be used during MVP development and demonstration to provide real/reference weather information.

This is permitted and encouraged for the live presentation layer, subject to the provider's terms.

However:

- external forecast data must be labeled as provider/reference data;
- it must not be called the project's downscaled output;
- the project must maintain a separate localized forecast abstraction;
- if no validated project model exists yet, the localized section must clearly show that the model is unavailable, demo-only, or under validation;
- no fabricated AI result may be presented as production output.

---

# 23. MVP Dashboard Pages

The initial application should contain approximately these pages:

## 23.1 Dashboard / Overview

- map
- region summary
- important alerts
- selected Panchayat
- high-level forecast

## 23.2 Panchayat Weather

- current/reference weather
- localized weather
- forecast timeline
- reliability
- advisory

## 23.3 Forecast Comparison

- reference vs localized
- difference
- reliability/fallback state
- provenance

## 23.4 Advisory Center

- Panchayat advisories
- reason
- validity
- severity
- approval state for officer workflow

## 23.5 Validation / Model Performance

- baseline comparison
- experiment status
- variable-specific metrics
- validation coverage
- harmful/useful correction summary

## 23.6 Admin / System Status

- provider health
- data state
- model state
- system logs/status

The exact visual design is defined in `design.md`.

---

# 24. MVP Acceptance Criteria

The MVP will be considered functionally complete only if all required capabilities below can be demonstrated in one end-to-end flow.

### End-to-end acceptance scenario

```text
Select State
  ↓
Select District
  ↓
Select Block
  ↓
Select Panchayat
  ↓
Display Panchayat boundary
  ↓
Retrieve/display reference forecast
  ↓
Display localized forecast when available
  ↓
Display reliability/fallback status
  ↓
Generate/display advisory
  ↓
Show provenance
```

### Minimum acceptance conditions

- A real/reference weather provider works.
- Panchayat geographic selection works for the supported pilot region.
- The backend normalizes provider data.
- The frontend does not call the provider directly.
- The localized model layer is architecturally separated.
- Localized values are not falsely represented as provider values.
- Advisory generation is deterministic/traceable.
- A provider failure is handled without crashing the application.
- Demo/mock data, when used, is clearly labeled.
- The system can be demonstrated on desktop and mobile-sized screens.

---

# 25. Scientific Acceptance Criteria

Scientific acceptance is separate from UI completion.

The final downscaling method may be considered production-ready for the SIH prototype only when the research pipeline has produced sufficient evidence under the project's validation rules.

The evidence should include, where the data permits:

- comparison against the raw/reference forecast;
- comparison against simpler baselines;
- temporal holdout validation;
- spatial holdout validation;
- appropriate variable-specific metrics;
- analysis of harmful vs useful corrections;
- uncertainty/reliability evaluation where implemented.

No performance number should be placed in the product until it comes from an actual executed experiment.

---

# 26. Demo Mode

A dedicated demo mode may exist to ensure reliable SIH presentation.

Demo mode requirements:

- must be explicitly identified as DEMO MODE internally;
- may use cached data or a controlled dataset;
- must never be mislabeled as a live government feed;
- must preserve the same API contracts as the production-like path;
- should allow the complete product flow to be demonstrated without depending on unstable external network conditions.

---

# 27. Product Success Measures

## 27.1 Product Success

- Complete location selection works.
- Live/reference weather displays correctly.
- Localized forecast can be displayed separately.
- Reliability/fallback behavior is understandable.
- Advisory can be traced to weather/context/rule.
- Officer and farmer views provide appropriate levels of detail.

## 27.2 Scientific Success

Measured only through actual experiments.

Key outcomes:

- localized method vs raw forecast;
- localized method vs strong baseline;
- spatial generalization;
- temporal generalization;
- reliability/harmful-correction behavior.

## 27.3 Demonstration Success

A judge should be able to understand within a few minutes:

1. what the problem is;
2. what data enters the system;
3. what the system changes;
4. how the Panchayat result is produced;
5. how the system expresses uncertainty;
6. what agricultural action is suggested;
7. what evidence supports the method.

---

# 28. Product Constraints

1. MVP must remain implementable by a small student team.
2. MVP must run on ordinary development hardware.
3. External providers must be abstracted.
4. External API credentials must remain server-side.
5. The product must not require GPU infrastructure for normal MVP inference unless later justified.
6. The product must support a replaceable scientific engine.
7. The product must remain useful even when advanced ML is disabled.
8. All real vs demo data must be distinguishable.
9. No unsupported official integrations may be represented as working.
10. No fabricated performance or accuracy claims.

---

# 29. Future Product Scope

Potential future features, only after MVP validation:

- more weather variables
- 5–7 day localized forecasts
- additional states/districts
- richer agricultural context
- advanced probabilistic forecasts
- improved uncertainty maps
- automated observation ingestion
- more sophisticated advisory workflows
- additional government provider integrations
- native mobile applications
- multilingual farmer experience
- offline/low-bandwidth support
- broader API access

These are future scope and are not MVP acceptance requirements.

---

# 30. Product Dependency on Research Pipeline

The product has two related but distinct development tracks.

## Track A — Product / MVP

```text
Provider
  ↓
Normalized forecast
  ↓
Panchayat/GIS
  ↓
Localized layer
  ↓
Advisory
  ↓
API
  ↓
PWA
```

## Track B — Scientific Research

```text
Historical forecast
  ↓
Observations/reference data
  ↓
Feature engineering
  ↓
Baselines
  ↓
Candidate models
  ↓
Validation
  ↓
Reliability
  ↓
Selected model
```

The selected scientific output from Track B may later be promoted to the production localized layer in Track A.

---

# 31. Required Product Behavior When Scientific Model Is Not Ready

This requirement is critical.

During early MVP development, the product may have:

### Reference forecast available
### Scientific localized model unavailable

In that situation the UI should say something equivalent to:

> **Localized downscaling model: Not yet available / Under validation**

The product can still demonstrate:

- Panchayat map
- reference weather
- advisory workflow
- architecture
- data provenance
- future localized comparison design

Alternatively, a clearly labeled demo prediction may be shown.

It must never be silently presented as a validated result.

---

# 32. Product Principles

## Principle 1 — Local relevance

Every forecast should be associated with a specific geographic context.

## Principle 2 — Transparency

Users should be able to understand the source and status of information.

## Principle 3 — Scientific honesty

The system must not claim accuracy that has not been demonstrated.

## Principle 4 — Safe fallback

A localized prediction should never be trusted merely because it exists.

## Principle 5 — Explainable advisory

An advisory should have a reason.

## Principle 6 — Provider independence

The product should not be hard-wired to one weather provider.

## Principle 7 — MVP discipline

Build the smallest complete product that demonstrates the scientific concept.

---

# 33. Requirements Traceability

The PRD must remain traceable to the architecture and later implementation documents.

| Requirement Area | Primary Source |
|---|---|
| System boundaries | `architecture.md` |
| User functionality | `prd.md` |
| Agent/engineering constraints | `rules.md` |
| Implementation sequence | `phases.md` |
| UI/UX behavior | `design.md` |
| Persistent context/decisions | `memory.md` |

If a later document conflicts with this PRD, the conflict must be explicitly identified rather than silently resolved by guessing.

---

# 34. Open Product Decisions

The following remain intentionally open and must be resolved through research/implementation:

1. Final pilot district.
2. Final live weather provider(s).
3. Final validated downscaling model.
4. Final uncertainty/reliability methodology.
5. Exact Panchayat representation for inference.
6. Final agricultural rule catalogue.
7. Whether officer approval is mandatory in the final MVP flow or only demonstrated conceptually.
8. Exact notification mechanism, if any.
9. Final map library if not yet fixed in `architecture.md`.
10. Exact localization scope for the first demonstration.

No agent should invent answers to these questions without evidence or an explicit project decision.

---

# 35. Definition of Done — MVP

The MVP is DONE when:

### Product

- [ ] responsive PWA works on desktop and mobile layouts;
- [ ] State → District → Block → Panchayat navigation works;
- [ ] Panchayat map works for supported geography;
- [ ] real/reference weather data is displayed;
- [ ] forecast provenance is retained;
- [ ] localized forecast contract exists;
- [ ] localized model can be enabled/disabled without UI redesign;
- [ ] reliability/fallback behavior is implemented or clearly represented as not-yet-enabled;
- [ ] advisory engine works for the supported rule set;
- [ ] Farmer experience works;
- [ ] Officer experience works;
- [ ] basic Admin status works.

### Engineering

- [ ] frontend communicates through FastAPI;
- [ ] external providers are abstracted;
- [ ] secrets are server-side;
- [ ] errors are handled;
- [ ] logs exist for major ingestion/inference/fallback events;
- [ ] database and geospatial persistence work;
- [ ] tests exist for critical APIs and core business logic.

### Scientific

- [ ] data provenance is retained;
- [ ] no fabricated performance numbers exist;
- [ ] any localized model shown as validated is backed by actual experiment results;
- [ ] unsupported scientific claims are excluded from the demo.

### Demonstration

- [ ] complete end-to-end flow works;
- [ ] live/reference weather can be shown;
- [ ] Panchayat context is visible;
- [ ] localized-vs-reference comparison can be shown when model output exists;
- [ ] advisory can be explained;
- [ ] demo remains usable if an external API temporarily fails through explicit demo/cached mode.

---

# 36. Summary

The SIH 26074 MVP is a **responsive Panchayat-level weather intelligence and agricultural advisory web platform** with a modular scientific downscaling layer.

The MVP should demonstrate:

```text
Panchayat Selection
       ↓
Reference/Live Forecast
       ↓
Localized/Post-processed Forecast
       ↓
Reliability / Fallback
       ↓
Agricultural Advisory
       ↓
Farmer / Officer Experience
```

The external weather API is a **data source**, not the project's scientific contribution.

The project's scientific contribution must come from the independently developed and validated localization/downscaling/post-processing method and the way its reliability and usefulness are demonstrated.

The product is deliberately designed so that a simple scientifically validated method can ship, while a more advanced ML method can be introduced later without changing the overall application architecture.

---

# 37. PRD Change Policy

Any change to a requirement must:

1. identify the requirement being changed;
2. explain why the change is needed;
3. update this file;
4. update affected companion documents where applicable;
5. avoid silently breaking architecture, rules, design, or memory assumptions.

`prd.md` is a living product contract, not an informal notes file.
