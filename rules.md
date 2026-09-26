# SIH 26074 — Engineering, Scientific & Agent Rules

**Project:** Panchayat-Level Weather Downscaling & Agro-Meteorological Advisory Platform  
**Problem Statement ID:** SIH 26074  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Companion documents:** `architecture.md`, `prd.md`  
**Status:** Non-negotiable project rules for all future AI agents, developers, researchers, and automated coding workflows

---

# 1. Purpose

This document defines the rules that every future agent must follow while researching, designing, coding, testing, integrating, documenting, and modifying the SIH 26074 project.

These rules exist to prevent:

- hallucinated datasets
- fake APIs
- fake government integrations
- fabricated weather values
- fabricated ML performance
- false claims of Panchayat-level accuracy
- confusion between live forecasts and project predictions
- data leakage
- over-engineering
- premature ML selection
- unsafe agricultural advice
- architectural drift
- undocumented changes
- broken reproducibility

The system must prioritize:

> **scientific validity + data provenance + reproducibility + practical utility + simplicity + transparency**

The project is a scientific decision-support prototype, not a marketing demonstration disguised as an AI system.

---

# 2. Source-of-Truth Hierarchy

When making project decisions, use this order of authority:

1. `prd.md` — what the product must do.
2. `architecture.md` — how the system is structured.
3. `rules.md` — non-negotiable constraints and agent behavior.
4. `phases.md` — when and in what order work is performed.
5. `design.md` — user experience, visual, and interaction specification.
6. `memory.md` — persistent decisions, terminology, current state, and project context.
7. Verified source documentation/data metadata.
8. Experiment results.
9. Agent inference or assumptions.

If documents conflict:

- do not silently choose one;
- identify the conflict;
- preserve the higher-priority document;
- propose the required document update before changing implementation.

No coding agent may override a project invariant merely because another implementation looks easier.

---

# 3. Documentation-First Rule

The six project control documents must exist before substantial implementation begins:

```text
architecture.md
prd.md
rules.md
phases.md
design.md
memory.md
```

Agents must read the relevant documents before modifying the repository.

Every major architectural/product decision must have a documented source.

Do not create undocumented architectural behavior and later attempt to explain it retrospectively.

---

# 4. Truthfulness and No-Hallucination Rules

## 4.1 Data

Never claim that a dataset exists, is public, is current, or is downloadable unless the claim has been verified.

Never fabricate:

- dataset names
- URLs
- endpoints
- API parameters
- station IDs
- Panchayat IDs
- weather observations
- historical records
- model outputs
- benchmark results
- geographic boundaries
- government services

If a source cannot be verified, label it:

`UNVERIFIED`

If access is partial:

`PARTIALLY VERIFIED`

If confirmed working:

`VERIFIED`

Never silently convert an unverified assumption into a production dependency.

## 4.2 APIs

Never invent an API endpoint.

Never assume a website page is an API.

Never expose provider credentials to the client.

Never claim an API is operational because documentation mentions it; test an actual request where permitted.

If authentication is required but unavailable:

- do not fake the integration;
- use a valid fallback provider only when allowed by the architecture/PRD;
- label the unavailable integration clearly.

## 4.3 Results

Never fabricate:

- MAE
- RMSE
- R²
- correlation
- confidence intervals
- prediction intervals
- calibration
- accuracy percentages
- agricultural benefit
- latency benchmarks

All reported numbers must trace to an executed experiment or authoritative source.

## 4.4 Demo Data

Mock/synthetic data is allowed only for explicitly labeled UI/demo states.

It must be clearly marked as:

`DEMO DATA` / `MOCK DATA` / `SYNTHETIC DATA`

Synthetic data must never be presented as real IMD or observational data.

---

# 5. Forecast Provenance Rules

The system must distinguish at minimum:

```text
LIVE / REFERENCE FORECAST
HISTORICAL OBSERVATION
REANALYSIS / MODEL REFERENCE
DERIVED FEATURE
MODEL PREDICTION
ADVISORY DECISION
```

These categories must never be silently merged.

Every forecast value should preserve provenance where practical:

- provider/source
- product/model if known
- issue time
- valid time
- lead time
- retrieval time
- model version for project-generated output

A third-party forecast is not the project's prediction.

An IMD forecast is not our ML output.

A reanalysis value is not direct ground truth.

An interpolated value is not an observation.

A model-generated value must never be labeled as an observation.

---

# 6. External Weather API Rules

A live weather API may be used in the MVP to provide current/reference forecast information.

The API must be accessed through the backend provider layer.

Frontend code must never directly depend on an external provider response structure.

Internal normalized schemas must be provider-independent.

The UI must distinguish:

```text
Reference Forecast
```

from:

```text
Localized / Downscaled Forecast
```

The external provider must never be credited as performing the project's downscaling unless the provider explicitly performs a transformation that is intentionally part of the project and is documented as such.

If the live provider fails during demonstration, cached or mock data may be used only with explicit labeling.

---

# 7. Scientific Integrity Rules

## 7.1 Downscaling must be defined precisely

Do not use the word "downscaling" for simple administrative relabeling.

Distinguish among:

- interpolation
- spatial disaggregation
- bias correction
- statistical downscaling
- post-processing
- dynamical downscaling
- super-resolution
- advisory generation

The terminology used in technical documentation must reflect the actual method implemented.

## 7.2 Target definition

Do not claim direct Panchayat ground truth unless an observation exists at the relevant location/area.

If the system predicts a Panchayat centroid without direct observation, describe it as an inferred/estimated Panchayat-representative value.

Any extrapolation beyond validated observations must have a clear limitation and, where possible, a reliability indicator.

## 7.3 Model selection

The project must not assume ML is necessary.

The preferred decision order is:

```text
strong baseline
    ↓
physical/statistical method
    ↓
simple residual model
    ↓
lightweight ML
    ↓
advanced ML only if justified
```

A more complex model must earn its place through measurable improvement.

If a simpler method performs as well or better, prefer the simpler method.

---

# 8. Baseline Rules

All scientific models must be evaluated against meaningful baselines.

At minimum, where applicable, compare:

1. raw/reference forecast;
2. simple spatial interpolation;
3. physically motivated correction;
4. bias correction;
5. simple statistical residual correction.

Do not compare a model only against an intentionally weak baseline to manufacture improvement.

The strongest reasonable baseline should be included before claiming a contribution.

---

# 9. Data Leakage Rules

Random row shuffling must not be the primary validation strategy for spatiotemporal weather data.

Agents must actively prevent:

- temporal leakage
- spatial leakage
- station leakage
- target leakage
- future information leakage
- post-observation information entering prediction features
- test-period bias calibration

A forecast used for validation must have been issued before the corresponding verification observation.

Any feature used at inference must have been available at inference time.

Any statistic computed from observations must respect the train/calibration/test boundary.

---

# 10. Validation Rules

Validation must be designed to reflect the intended deployment scenario.

Where data supports it, use:

- temporal holdout
- spatial holdout
- spatiotemporal holdout

The primary deployment-like benchmark should test locations or regions not used to directly train the model whenever possible.

Do not report only aggregate performance.

Inspect performance by:

- station
- geography
- terrain
- season
- weather regime
- forecast lead time
- rainfall intensity/event class where applicable

A model may only be called robust if performance is not being carried by a small number of favorable cases.

---

# 11. Statistical Testing Rules

Do not call two models different merely because one metric is numerically smaller.

Where appropriate, use:

- confidence intervals
- paired bootstrap
- Wilcoxon signed-rank or another suitable paired test
- effect sizes

The statistical test must match the structure of the data.

Statistical significance is not the same as practical significance.

Report both when possible.

---

# 12. Weather-Variable Rules

Weather variables must not automatically share the same modeling method.

Treat at least these separately where relevant:

- temperature
- rainfall
- relative humidity
- wind speed
- wind direction
- cloud cover

Temperature may support physically motivated elevation correction.

Rainfall requires special treatment because of:

- intermittent occurrence
- non-Gaussian distribution
- convective behavior
- extreme events
- spatial discontinuity

Do not force one generic regression approach onto all variables.

---

# 13. Rainfall Rules

Rainfall modeling must distinguish, where appropriate:

1. rain occurrence;
2. rainfall intensity conditional on occurrence;
3. heavy/extreme rainfall events.

Accuracy alone must not be the sole evaluation metric for rainfall.

Use suitable event metrics where relevant, such as:

- POD
- FAR
- CSI
- precision/recall
- MAE/RMSE on wet-day intensity

Never make strong claims about extreme-rainfall prediction if the evaluation sample contains too few extreme events.

---

# 14. Physical Constraints Rules

Physical knowledge may be used as:

- baseline
- feature
- constraint
- correction
- prior

but never as an automatic guarantee of improved accuracy.

For example, an elevation-temperature lapse rate is a hypothesis to test in the target domain, not a universal local truth.

Any empirical physical correction must be evaluated against the raw forecast.

Do not apply rainfall or terrain relationships universally without evidence that they are valid for the target region/season.

---

# 15. Reliability and Uncertainty Rules

Uncertainty must never be fabricated.

Do not display:

`92% confidence`

unless that percentage has a clear statistical meaning and calibration evidence.

Acceptable reliability representations may include:

- prediction intervals
- calibrated quantiles
- conformal intervals
- calibrated probabilistic forecasts
- explicit low/moderate/high reliability labels backed by defined rules
- out-of-distribution indicators

The system should support a fallback mechanism when the localized prediction is insufficiently reliable.

A reliability layer is not automatically an innovation. It must demonstrate measurable benefit.

---

# 16. Fallback Rules

The localized model is not assumed to be better everywhere.

Where the reliability layer indicates insufficient trust, the system may fall back to:

- approved physical baseline
- approved statistical baseline
- authoritative/reference forecast

Fallback must be deterministic, logged, and explainable.

Every fallback event should preserve:

- reason
- timestamp
- model version
- source forecast
- fallback method

Never hide fallback events from officers/admins.

---

# 17. Agricultural Advisory Rules

The advisory engine is separate from the weather prediction engine.

Weather prediction must produce weather information.

The advisory engine converts that information into agricultural decision support.

The MVP advisory layer should be:

- transparent
- deterministic where possible
- based on documented agricultural/agromet guidance
- easy to audit

Do not invent agronomic thresholds without evidence.

Do not allow a general-purpose LLM to independently invent high-impact agricultural advice.

If an LLM is later used for wording, it must not change the underlying rule decision.

Example conceptual flow:

```text
Weather condition
      ↓
Agricultural rule
      ↓
Decision category
      ↓
Human-readable explanation
```

The generated wording must preserve the underlying rule.

---

# 18. Human-in-the-Loop Rules

For officer-facing workflows, important advisories should support review/approval where defined by the PRD.

The system must distinguish:

- generated advisory
- reviewed advisory
- approved advisory
- modified advisory
- rejected advisory

The platform must not imply that an officer approved something when no such action occurred.

All approval/modification events should be auditable.

---

# 19. GIS Rules

Geospatial data is first-class project data.

Do not use place names as the only identifier.

Use stable identifiers wherever available.

Do not assume that similarly named Panchayats are the same entity.

Validate:

- coordinate reference system
- geometry validity
- administrative hierarchy
- polygon-to-identifier mapping

If data from multiple administrative sources uses different identifiers, create an explicit mapping layer rather than silent string matching.

Never invent a Panchayat polygon or coordinate.

---

# 20. Frontend Rules

Frontend responsibilities:

- presentation
- interaction
- visualization
- user workflow

Frontend must not:

- contain weather-provider secrets
- directly query external forecast APIs
- implement scientific model logic
- implement agricultural rules independently of backend/domain logic
- hard-code fake production results

All important data must arrive through typed backend contracts.

The Farmer interface should minimize technical jargon.

The Officer interface may expose:

- provenance
- reliability
- comparison
- validation information
- model/version details

---

# 21. Backend Rules

FastAPI is the primary backend boundary for the MVP.

Backend code should be organized by domain rather than by one large file.

Recommended domains:

```text
providers
weather
gis
downscaling
reliability
advisory
panchayat
validation
database
```

External provider formats must be normalized before reaching the frontend.

Business/scientific logic must not be embedded inside HTTP route handlers when it can be represented as a domain service.

---

# 22. Database Rules

PostgreSQL/PostGIS is the intended production-oriented database for the MVP architecture.

Do not store every external response as an opaque blob and call that a data model.

Store structured, queryable values for the core system.

Retain source/provenance metadata.

Schema changes must be versioned through migrations.

Never alter production database structures manually without documenting the change.

Never delete raw data required for reproducibility without an explicit retention decision.

---

# 23. Provider Abstraction Rules

External weather providers must implement a common internal interface.

The application must be able to replace one provider without rewriting the entire product.

Provider-specific fields must remain inside the provider adapter unless intentionally mapped into the normalized domain schema.

No frontend component should depend on provider-specific names such as `hourly.temperature_2m` directly.

---

# 24. Research-vs-Production Rules

Experimental code must remain separate from production inference.

Use a clear separation such as:

```text
research/
production/
```

Research code may contain:

- notebooks
- experiments
- temporary models
- evaluation scripts
- dataset studies

Production code should contain only approved, reproducible inference components.

A model does not become a production model merely because it exists as a `.pkl`, `.joblib`, `.onnx`, or similar artifact.

It becomes production-approved only after the project's validation criteria are satisfied and the model/version is recorded.

---

# 25. Model Promotion Rules

A candidate model must pass all applicable gates before being promoted:

```text
Data quality
    ↓
Baseline comparison
    ↓
Leakage checks
    ↓
Validation
    ↓
Statistical comparison
    ↓
Generalization check
    ↓
Reliability assessment
    ↓
Operational test
    ↓
Model approval
```

If a candidate fails, it should remain experimental or be rejected.

Do not promote a model because it produces visually pleasing results.

---

# 26. Complexity Rules

Every additional dependency, service, model, library, or data source must justify its complexity.

Prefer:

- one backend
- one frontend
- one database
- one deployment configuration
- small number of domain modules

Avoid unless clearly required:

- Kubernetes
- Kafka
- microservice explosion
- separate ML serving infrastructure
- complex event-driven systems
- blockchain
- unnecessary agent frameworks
- LLM orchestration for deterministic tasks

An SIH prototype must remain understandable to a technically skilled reviewer.

---

# 27. UI/UX Rules

The product should feel like a government/agriculture decision-support system rather than a generic weather app.

Prioritize:

- clarity
- hierarchy
- low cognitive load
- map usability
- visible provenance
- explainable corrections
- visible uncertainty
- clear agricultural action

Avoid visual clutter.

Do not make animation more prominent than forecast information.

Do not use decorative AI elements that do not communicate system behavior.

---

# 28. Accessibility and Language Rules

The MVP should remain usable on low-to-mid-range devices and variable network connections.

Avoid requiring high bandwidth for normal operation.

Future language support may include regional Indian languages, but localization must preserve the meaning of the advisory.

Do not machine-translate safety-critical weather/advisory text without review.

---

# 29. Security Rules

Never commit secrets into source control.

Use environment variables or approved secret-management mechanisms.

Never expose:

- API keys
- database passwords
- authentication secrets
- private provider credentials

Validate all externally supplied inputs.

Use appropriate authentication/authorization for protected officer/admin endpoints.

Do not log secrets or personally sensitive authentication material.

---

# 30. API Rules

All API endpoints must:

- have stable contracts
- validate input
- return structured errors
- document required parameters
- identify data provenance where relevant
- distinguish missing data from zero values

Example principle:

`rainfall = 0`

must never be confused with:

`rainfall = unavailable`

API versions must be introduced deliberately.

Do not silently change response structures if frontend consumers depend on them.

---

# 31. Error Handling Rules

External failures must be handled explicitly.

Examples:

- weather provider unavailable
- GIS service unavailable
- invalid geometry
- incomplete observation data
- model inference failure
- unreliable model output
- database failure

The UI must display an understandable status rather than an uncaught exception.

Do not convert failures into fabricated success values.

---

# 32. Caching Rules

Caching is allowed to improve reliability and demo stability.

Cached forecast data must retain:

- source
- original retrieval time
- valid period
- cache timestamp

Never display stale cached data as if it were live without indicating its age when that matters.

---

# 33. Testing Rules

Every meaningful implementation layer must have tests.

Minimum expectations:

### Unit tests
For domain logic and transformations.

### Integration tests
For provider/database/domain interactions.

### API tests
For route contracts.

### Data validation tests
For imported forecast/observation records.

### GIS tests
For coordinate/geometry transformations.

### Regression tests
For previously fixed bugs.

Scientific code should include reproducible experiment scripts rather than only notebook cells.

---

# 34. Reproducibility Rules

Experiments must record:

- dataset/version
- date range
- feature set
- train/test split
- model algorithm
- hyperparameters
- random seed where applicable
- software/dependency versions
- metrics
- output location

A result that cannot be reproduced should not be used as the sole basis for a project claim.

---

# 35. Logging and Audit Rules

Important events should be logged, including:

- provider fetch
- provider failure
- data validation failure
- model inference
- fallback
- advisory generation
- advisory approval/modification
- admin changes

Logs should be useful for debugging without exposing secrets.

---

# 36. Demo Mode Rules

A dedicated demo mode may exist.

Demo mode may use:

- cached real data
- clearly labeled mock data
- precomputed model outputs

Demo mode must not silently masquerade as live production mode.

The UI should make the state clear when data is simulated or cached.

---

# 37. Performance Rules

Do not optimize prematurely.

First make the system correct.

Then measure actual bottlenecks.

Only introduce:

- asynchronous processing
- background jobs
- advanced caching
- vectorization
- model optimization

when measurements justify them.

Do not assume GPU acceleration is required.

---

# 38. Mobile/PWA Rules

The MVP is a responsive web application/PWA.

Do not create a separate native mobile application unless explicitly approved later.

All critical farmer functionality must remain usable on a mobile-sized viewport.

The desktop officer experience may expose more information than the mobile farmer experience.

---

# 39. Git and Change Management Rules

Do not commit generated secrets, local environment files, or large unintended artifacts.

Commit logically grouped changes.

Commit messages should explain intent.

Do not rewrite project history unless explicitly authorized.

When changing a key architecture decision:

1. update documentation;
2. record the decision;
3. update impacted implementation;
4. run regression tests.

---

# 40. Dependency Rules

Before adding a new package, verify:

- why it is needed;
- whether the existing stack already solves the requirement;
- maintenance/activity status;
- compatibility;
- licensing implications;
- impact on deployment size.

Do not add duplicate libraries for the same task.

Prefer established packages already used elsewhere in the project.

---

# 41. Documentation Rules for Code

Non-obvious code must explain:

- why it exists
- important assumptions
- data units
- coordinate systems
- external constraints

Do not write comments that merely repeat the code.

Scientific formulas should include units and sign conventions where confusion is possible.

---

# 42. Weather Unit Rules

Every weather variable must have a canonical internal unit.

Conversion must happen at the data boundary.

Examples commonly encountered:

- temperature → °C internally unless a later design explicitly says otherwise;
- rainfall → mm;
- wind speed → a single canonical unit;
- coordinates → WGS84 latitude/longitude for API-facing geographic identity unless another CRS is required for calculations.

Never mix units within the same internal schema.

---

# 43. Time Rules

Internally represent timestamps consistently.

Store timezone-aware timestamps where applicable.

Clearly distinguish:

- forecast issue time
- forecast valid time
- observation time
- retrieval time
- generated prediction time

Never compare timestamps without accounting for timezone.

The system must not infer that a forecast is historical merely because it is stored in a database.

---

# 44. Panchayat Identity Rules

A Panchayat must be represented using a stable administrative identifier when available.

Display names are not unique identifiers.

Maintain explicit relationships:

```text
State
  ↓
District
  ↓
Block
  ↓
Panchayat
```

Do not infer administrative hierarchy from spelling when authoritative mappings exist.

---

# 45. Observation Rules

Station observations should retain:

- station ID
- coordinates
- observation time
- variable
- unit
- source
- quality flag if available

Quality checks must be explicit.

Do not silently replace invalid observations with model estimates.

If a value is missing, preserve missingness until a documented imputation step occurs.

---

# 46. Research Experiment Rules

An experiment must state:

- question/hypothesis
- data
- method
- train/calibration/test design
- metrics
- result
- interpretation
- decision

A notebook that outputs a chart without a clear experiment definition does not constitute scientific validation.

Failed experiments must be recorded.

Negative results are valuable and must not be deleted merely because they weaken the project narrative.

---

# 47. Competitive Claims Rules

Never say:

- "best"
- "most accurate"
- "beats IMD"
- "better than Skymet"
- "more accurate than BFS"

unless there is direct, scientifically valid evidence appropriate to the comparison.

Prefer concrete claims such as:

- "improved MAE relative to our raw-forecast baseline on the held-out station set";
- "reduced harmful corrections under the evaluated validation scheme";
- "supports a transparent fallback when localized corrections are unreliable."

Do not compare systems using incompatible datasets or time periods and present the results as directly comparable.

---

# 48. Innovation Rules

A technology is not innovative merely because it uses:

- AI
- ML
- XGBoost
- GIS
- maps
- APIs
- dashboards
- mobile interfaces
- uncertainty labels

A claimed innovation must establish:

```text
Existing limitation
        ↓
Technical change
        ↓
Scientific mechanism
        ↓
Experiment
        ↓
Measured benefit
```

If the measured benefit does not exist, do not claim the innovation.

---

# 49. Agricultural Safety Rules

The system is decision support.

Do not make absolute guarantees about crop outcomes.

Advisories must include enough context for the user to understand the recommended action.

High-impact alerts should prefer conservative wording when forecast uncertainty is high.

Do not fabricate disease diagnosis or pesticide prescriptions.

Do not invent chemical dosage recommendations.

The MVP should focus on weather-linked decision support rather than complete agronomic treatment plans.

---

# 50. Agent Behavior Rules

Every future AI/coding agent must:

1. Read the project documents before changing implementation.
2. Inspect the existing code before creating new code.
3. Reuse working modules rather than duplicating them.
4. Verify assumptions before encoding them.
5. Search documentation/source material when uncertain.
6. Prefer evidence to intuition.
7. Test changes before declaring them complete.
8. Report failures honestly.
9. Never fabricate missing dependencies or results.
10. Never silently change project scope.
11. Keep changes reversible where practical.
12. Explain non-obvious decisions in documentation.

---

# 51. Autonomous Agent Rules

Agents may work autonomously only within the documented project boundaries.

An agent may:

- research;
- run experiments;
- write code;
- refactor code;
- test code;
- generate reports;
- select among documented alternatives based on evidence.

An agent must stop and request/record a decision when:

- required credentials are genuinely unavailable;
- a destructive operation could irreversibly delete project data;
- conflicting requirements cannot be reconciled from project documents;
- an architectural change would materially alter the product's goals.

Otherwise the agent should continue independently rather than repeatedly asking for trivial confirmation.

---

# 52. Scope-Control Rules

The MVP must remain focused on the SIH 26074 core.

A feature may be added only when it satisfies at least one:

1. directly supports downscaling/post-processing;
2. directly supports Panchayat weather interpretation;
3. directly supports reliability/uncertainty;
4. directly supports agricultural advisory;
5. directly supports scientific validation;
6. directly supports the SIH demonstration.

Features outside those categories should be deferred.

---

# 53. Definition of “Done” for an Implementation Task

A task is not complete merely because the code exists.

A task is complete only when applicable:

```text
Implementation
    ↓
Tests
    ↓
Integration
    ↓
Validation
    ↓
Documentation
    ↓
No known regression
```

For a scientific feature:

```text
Implementation
    ↓
Experiment
    ↓
Held-out evaluation
    ↓
Interpretation
    ↓
Decision recorded
```

---

# 54. Mandatory Before-Release Checklist

Before presenting an MVP build:

- [ ] No API secrets committed.
- [ ] External provider status is known.
- [ ] Forecast provenance is visible in the system model.
- [ ] Mock data is labeled.
- [ ] Panchayat identifiers are stable.
- [ ] Map geometry has been validated.
- [ ] Weather units are normalized.
- [ ] Timezones are handled consistently.
- [ ] Frontend does not call external weather providers directly.
- [ ] API errors have graceful handling.
- [ ] Localized forecast and reference forecast are clearly distinguished.
- [ ] Reliability/fallback behavior is deterministic.
- [ ] Advisory logic is documented.
- [ ] No unsupported accuracy claim is displayed.
- [ ] Tests pass.
- [ ] Demo flow works with live data or clearly labeled fallback data.
- [ ] Documentation matches actual implementation.

---

# 55. Mandatory Before Scientific Claim Checklist

Before claiming that the downscaling system improves weather information:

- [ ] Data source verified.
- [ ] Observation target verified.
- [ ] Forecast issued before observation.
- [ ] Train/test boundary enforced.
- [ ] Spatial leakage checked.
- [ ] Temporal leakage checked.
- [ ] Strong baseline included.
- [ ] Held-out evaluation performed.
- [ ] Appropriate metrics reported.
- [ ] Statistical uncertainty assessed where appropriate.
- [ ] Performance failures reported.
- [ ] Geographic/seasonal breakdown inspected.
- [ ] Claim scope matches evidence.

---

# 56. Mandatory Before Claiming an Innovation

The project may call something a core contribution only when:

- [ ] Existing approaches were researched.
- [ ] The limitation is documented.
- [ ] The proposed change is technically specific.
- [ ] The change has been implemented.
- [ ] An experiment tests it.
- [ ] A baseline comparison exists.
- [ ] The benefit is measurable.
- [ ] The result is reproducible.
- [ ] The claim is limited to the tested scope.

---

# 57. Final Non-Negotiable Principles

The following principles override convenience:

### 1. Real before impressive

Real, limited data is preferable to fabricated perfect data.

### 2. Baseline before ML

A model must earn the right to exist.

### 3. Evidence before claims

A feature without measured value is not a contribution.

### 4. Provenance before presentation

Every important number must have a traceable source.

### 5. Uncertainty before false precision

The system must be comfortable saying "not reliable enough."

### 6. Simplicity before complexity

Use the minimum architecture needed to solve the problem.

### 7. Validation before deployment

A model that has not passed the required evaluation remains experimental.

### 8. Transparency before marketing

Failures and limitations must be visible internally and documented honestly.

### 9. Agricultural usefulness before feature count

A technically elegant forecast is not enough if it cannot support a useful agricultural decision.

### 10. The documented system is the source of truth

Implementation must follow the project documents, and significant decisions must update the documents.

---

# 58. Status

`rules.md` is a governing project document.

Future agents must treat its rules as mandatory unless a higher-priority project requirement explicitly supersedes them and the change is documented.
