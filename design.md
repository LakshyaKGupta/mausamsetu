# SIH 26074 — Product Design & UI/UX Specification

**Project:** Panchayat-Level Weather Downscaling & Agro-Meteorological Advisory Platform  
**Problem Statement ID:** SIH 26074  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Category:** Software  
**Theme:** Agriculture, FoodTech & Rural Development  
**Document:** `design.md`  
**Status:** MVP design baseline  
**Companion documents:** `architecture.md`, `prd.md`, `rules.md`, `phases.md`

---

# 1. Purpose

This document defines the visual language, information architecture, interaction patterns, screen structure, component behavior, responsive behavior, accessibility expectations, and presentation principles for the SIH 26074 MVP.

The product is a **Panchayat-level weather intelligence and agro-meteorological advisory platform**.

The design must communicate a simple story:

> Select a Panchayat → understand the local/reference forecast → see localized information → understand reliability → receive an agricultural action.

The interface must NOT look like a generic weather application.

Its primary visual identity should communicate:

- geospatial intelligence
- local weather context
- agricultural decision support
- scientific transparency
- reliability
- government/public-service usefulness

The MVP is a responsive **Next.js web application / PWA**. A separate native mobile application is out of scope for the MVP.

---

# 2. Design Goals

## 2.1 Primary goals

1. Make Panchayat selection extremely simple.
2. Make the difference between reference and localized forecast understandable.
3. Make reliability/uncertainty visible without overwhelming users.
4. Turn weather information into practical agricultural actions.
5. Make the map a meaningful analytical surface, not decoration.
6. Support both technical officers and non-technical farmers.
7. Make scientific provenance visible.
8. Work on desktop for SIH judging and mobile screens for farmer use.
9. Reduce cognitive load.
10. Avoid dashboard clutter.

## 2.2 Secondary goals

- Show real-time freshness.
- Provide clear historical/validation evidence where appropriate.
- Support future expansion to additional variables.
- Allow the scientific engine to change without redesigning the interface.

## 2.3 Non-goals

The MVP is not intended to be:

- a social network
- a general-purpose weather news application
- a complex GIS workstation
- a chat-heavy AI assistant
- a native mobile app
- an all-India production portal
- a full agricultural management ERP

---

# 3. Core Product Experience

The central user journey is:

```text
Open Platform
      ↓
Choose Location
      ↓
State → District → Block → Panchayat
      ↓
View Panchayat Forecast
      ↓
See Reference vs Localized Weather
      ↓
See Reliability / Uncertainty
      ↓
See Agricultural Advisory
      ↓
Take Decision
```

A secondary officer journey is:

```text
Open Officer Dashboard
      ↓
Select Region / Map
      ↓
Compare Panchayats
      ↓
Inspect forecast
      ↓
Inspect reliability
      ↓
Inspect observations / validation
      ↓
Review advisory
      ↓
Approve / modify / reject where enabled
```

---

# 4. Design Principles

## 4.1 Clarity over decoration

Every visual element must answer a user question.

Do not use:

- decorative charts without interpretation
- excessive gradients
- excessive glassmorphism
- meaningless animations
- giant cards containing redundant information

## 4.2 Information hierarchy

The user should be able to identify in this order:

1. Where am I?
2. What is the weather?
3. What is important?
4. How reliable is it?
5. What should I do?

## 4.3 Scientific transparency

The interface should communicate:

- forecast source
- update time
- whether a value is reference or localized
- reliability status
- uncertainty where available

Avoid technical jargon unless the user is in the Officer view.

## 4.4 Progressive disclosure

Farmers see simple information first.

Officers can expand:

- model details
- source information
- comparisons
- validation
- observations
- reliability reasoning

## 4.5 Stable mental model

Use consistent terminology:

- Reference Forecast
- Localized Forecast
- Reliability
- Advisory
- Panchayat
- Forecast update
- Observation

Do not alternate between synonyms such as:

- AI Forecast
- Smart Forecast
- Prediction
- Hyperlocal Forecast
- Downscaled Forecast

unless the relevant context explicitly requires them.

---

# 5. User Roles

## 5.1 Farmer

Primary needs:

- location-specific weather
- important alerts
- simple agricultural actions
- forecast for the next few days
- minimal technical detail

Farmer view should prioritize:

1. Panchayat/location
2. current condition
3. next 24–72 hour outlook
4. rain
5. temperature
6. critical agricultural action
7. warning/reliability indicator

## 5.2 Officer

Primary needs:

- Panchayat map
- weather comparison
- spatial patterns
- reliability
- uncertainty
- station/observation context
- advisory review
- validation information

Officer view may expose more technical detail.

## 5.3 Admin

Primary needs:

- provider status
- data freshness
- data ingestion status
- model version
- system health
- errors
- configuration

---

# 6. Information Architecture

Recommended application structure:

```text
/
├── dashboard
├── forecast
│   ├── panchayat
│   └── comparison
├── map
├── advisories
├── alerts
├── validation
├── administration
└── settings/about
```

Role-aware navigation may hide irrelevant sections from farmer users.

---

# 7. Main Navigation

## Desktop

Use a left sidebar or compact top navigation depending on screen width.

Recommended desktop structure:

```text
┌──────────────────────────────────────────────────────────┐
│ LOGO / PRODUCT NAME                    Alerts  Profile   │
├───────────────┬──────────────────────────────────────────┤
│ Dashboard     │                                          │
│ Map           │              Main Content                │
│ Forecast      │                                          │
│ Advisories    │                                          │
│ Alerts        │                                          │
│ Validation    │                                          │
│ Admin*        │                                          │
│               │                                          │
│ Help/About    │                                          │
└───────────────┴──────────────────────────────────────────┘
```

`Admin*` is visible only to administrators.

## Mobile

Use:

- compact top bar
- bottom navigation for primary farmer actions
- drawer/sheet for additional officer/admin sections

Recommended farmer mobile navigation:

```text
Home | Map | Forecast | Advisory | More
```

---

# 8. Global Header

The header must display:

- product identity
- selected geography where relevant
- alert access
- user role/profile
- optional data freshness indicator

Example:

```text
┌─────────────────────────────────────────────────────────────┐
│ ☁ GramMausam         Nagpur / [Panchayat]      Alerts   ☰ │
└─────────────────────────────────────────────────────────────┘
```

Do not use a cluttered multi-row header.

---

# 9. Location Selector

The location selector is one of the most important interactions.

## Hierarchy

```text
State
 ↓
District
 ↓
Block
 ↓
Panchayat
```

Use cascading selectors.

## Desktop

A compact horizontal filter bar:

```text
[ State ▼ ] [ District ▼ ] [ Block ▼ ] [ Panchayat ▼ ]
```

## Mobile

Use a step-by-step bottom sheet or full-screen selection flow.

## Requirements

- show loading state when a child level is being retrieved
- disable child selections until parent selection exists
- show "No Panchayats found" clearly
- preserve selected location when navigating between screens
- support search for long Panchayat lists

---

# 10. Dashboard Design

The dashboard should be a summary, not a data dump.

## Officer Dashboard

Recommended structure:

```text
┌──────────────────────────────────────────────────────────┐
│ Dashboard                              Last updated 10m  │
├──────────────────────────────────────────────────────────┤
│ Location: State > District > Block                       │
├──────────────────────────────────────────────────────────┤
│ Key Indicators                                           │
│ [ Panchayats ] [ Rain Alert ] [ Low Reliability ] [ ...]│
├───────────────────────────────┬──────────────────────────┤
│                               │                          │
│          MAP                  │    PRIORITY ALERTS       │
│                               │                          │
│                               │                          │
├───────────────────────────────┴──────────────────────────┤
│ Panchayat Forecast Summary                               │
├──────────────────────────────────────────────────────────┤
│ Weather chart / comparison / advisory summary             │
└──────────────────────────────────────────────────────────┘
```

## Farmer Dashboard

Keep it simpler:

```text
Good morning

[ Selected Panchayat ]

31°C
Partly cloudy

Rain
18 mm
72% chance

Today's Action
Delay irrigation due to expected rainfall.

[ View 3-day forecast ]
```

---

# 11. Panchayat Map

The map is a core feature.

## Required behavior

The map should support:

- Panchayat boundaries
- selected Panchayat
- district/block context
- forecast status
- alert status
- optional observation station locations
- zoom/pan
- search

## Default map state

The map should open centered on the selected region rather than the entire state.

## Panchayat styling

A Panchayat polygon should be visually distinguishable when selected.

Do not rely only on color; use:

- outline
- selection border
- opacity
- optional pattern/label

## Weather thematic layer

Where implemented, polygon fills can represent:

- rainfall category
- temperature range
- reliability
- alert status

The legend must always be visible when a thematic map layer is active.

---

# 12. Map Legend

Example:

```text
RAINFALL — NEXT 24 HOURS

No rain
Light
Moderate
Heavy
Very Heavy
```

The exact categories must come from the actual project's documented/adopted weather classification.

Do not hard-code unsupported government categories into the UI.

---

# 13. Panchayat Detail Page

The Panchayat detail page is the most important application page.

Recommended structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ ABC Gram Panchayat                                         │
│ Block X · District Y                                      │
│ Forecast updated: 14:20 IST                              │
├─────────────────────────────────────────────────────────────┤
│ Reliability:  ● Moderate                                  │
│ "Localized rainfall estimate has elevated uncertainty."  │
├─────────────────────────────────────────────────────────────┤
│ TODAY                                                      │
│                                                            │
│ 32°C         Rain: 18 mm          RH: 78%                 │
│ Tmax         72% probability      Humidity                │
├─────────────────────────────────────────────────────────────┤
│ NEXT 3 DAYS                                                │
│ [ forecast chart ]                                         │
├─────────────────────────────────────────────────────────────┤
│ REFERENCE vs LOCALIZED                                     │
│                                                            │
│ Temperature     32.4°C → 31.7°C                           │
│ Rainfall        12 mm  → 18 mm                            │
├─────────────────────────────────────────────────────────────┤
│ AGRICULTURAL ADVISORY                                     │
│ Delay irrigation                                          │
│ Avoid spraying before expected rain                       │
└─────────────────────────────────────────────────────────────┘
```

---

# 14. Reference vs Localized Forecast

This is a central differentiator of the product.

Never hide the comparison.

Use a dedicated card:

```text
FORECAST REFINEMENT

Reference Forecast       Localized Forecast
32.4°C                    31.7°C
12 mm                     18 mm

Why is it different?
• Panchayat elevation
• spatial context
• local correction
```

The "Why is it different?" section must only display explanations actually available from the underlying model/logic.

Do not invent explanations.

If model explainability is unavailable, show:

> "Localized value generated by the configured downscaling/post-processing method."

---

# 15. Reliability Design

Reliability is a first-class interface element.

## Levels

Use only the levels supported by the implemented reliability system.

Possible display:

```text
● High
● Moderate
● Low
```

Do not imply probability when the backend does not provide calibrated probability.

## Reliability card

```text
Forecast reliability
─────────────────────
MODERATE

The localized estimate has higher
uncertainty because observation
coverage is limited.

Reference forecast remains available.
```

## Reliability details

Officer users can expand:

- distance to nearest observation
- observation density
- model uncertainty
- forecast lead time
- terrain context
- fallback status

Only expose fields the backend genuinely calculates.

---

# 16. Uncertainty Visualization

When a prediction interval exists:

```text
Rainfall
18 mm

Expected range
12–27 mm
```

Use a range bar rather than a complex probability chart for the farmer view.

Officer view may display:

- interval width
- calibration state
- historical reliability
- prediction distribution if available

Do not show false precision.

---

# 17. Fallback State

When the system decides not to trust localized correction:

Display clearly:

```text
LOCALIZATION NOT APPLIED

The system detected elevated uncertainty.
The reference forecast is being used instead.

Reason:
Limited local observational support.
```

This is a positive safety behavior, not an error.

Avoid alarming wording.

---

# 18. Weather Cards

Each weather variable should be represented as a reusable component.

Example:

```text
┌────────────────────┐
│ 🌧 Rainfall        │
│ 18 mm              │
│ 72% chance         │
│ Next 24 hours      │
└────────────────────┘
```

Cards should include:

- variable label
- value
- unit
- time period
- optional status
- optional source/reliability indicator

Do not overuse icons.

---

# 19. Forecast Charts

## Primary chart

Temperature:

- line chart
- day/hour selector
- min/max markers where available

Rainfall:

- bars for precipitation
- probability line only if supported by the provider

Avoid dual-axis charts in the farmer view unless absolutely necessary.

## Chart interactions

- hover/tap for timestamp
- selected forecast period
- unit displayed
- accessible text summary

Every chart should have a plain-language summary below or alongside it.

Example:

> "Highest rainfall is expected tomorrow afternoon."

Only generate this statement from real backend data.

---

# 20. Agricultural Advisory Design

Advisories should be visually distinct from raw weather.

Example:

```text
┌────────────────────────────────────────┐
│ 🌧 IRRIGATION ADVISORY                 │
│                                        │
│ Rain is expected during the next      │
│ forecast window.                      │
│                                        │
│ ACTION                                 │
│ Delay irrigation for now.             │
│                                        │
│ Valid for: Next 24 hours               │
└────────────────────────────────────────┘
```

Each advisory should show:

- category
- condition
- recommended action
- validity period
- severity
- source/rule reference where appropriate

Do not use "AI recommends" wording unless the architecture explicitly supports it and the source is correct.

---

# 21. Alert Design

Alerts should be prioritized.

Possible levels:

- Information
- Advisory
- Warning
- Severe/critical, only if supported by an authoritative source

Use a consistent alert banner.

Example:

```text
⚠ Rainfall advisory

Heavy rainfall is expected during
the selected forecast period.

Review irrigation and spraying plans.
```

Do not independently upgrade an event to a government warning level.

Official warnings and project-generated advisories must be distinguishable.

---

# 22. Officer Comparison View

The officer should be able to compare multiple Panchayats.

Example:

```text
┌──────────────┬──────────┬──────────┬────────────┐
│ Panchayat    │ Rain     │ Temp     │ Reliability│
├──────────────┼──────────┼──────────┼────────────┤
│ ABC          │ 18 mm    │ 31.7°C   │ Moderate   │
│ DEF          │ 6 mm     │ 33.2°C   │ High       │
│ GHI          │ 29 mm    │ 30.9°C   │ Low        │
└──────────────┴──────────┴──────────┴────────────┘
```

Allow sorting/filtering.

Do not add rankings like "best Panchayat" or other unnecessary interpretations.

---

# 23. Validation Screen

The validation page is primarily for officers, evaluators, and technical judges.

It should not be shown as a farmer-facing feature by default.

## Purpose

Demonstrate:

- raw/reference forecast
- baseline
- selected method
- observed target
- error metrics
- spatial/temporal validation
- reliability behavior

## Layout

```text
Validation

Evaluation period: YYYY-MM-DD → YYYY-MM-DD
Region: [ ... ]

┌───────────────────────────────────────┐
│ Raw Forecast     MAE    X.XX          │
│ Baseline         MAE    X.XX          │
│ Selected Method  MAE    X.XX          │
└───────────────────────────────────────┘

[ Error chart ]

[ Useful vs Harmful correction ]

[ Terrain breakdown ]
```

Never display placeholder performance numbers as though they were real.

If experiments are not complete:

> "Validation results unavailable — experimental pipeline not yet completed."

---

# 24. Validation Visualizations

Possible charts:

1. Error comparison
2. station-wise performance
3. terrain-wise performance
4. lead-time performance
5. useful/harmful corrections
6. reliability/fallback trade-off

The frontend should consume saved/verified validation results.

It must not calculate scientific metrics from incomplete or mixed data at display time unless explicitly designed to do so.

---

# 25. Admin Dashboard

Admin screen should focus on system health.

Cards:

```text
Weather Provider
● Healthy

Last Data Update
14:20 IST

Panchayat Data
● Loaded

Model
v0.1.0 — VALIDATED

Database
● Healthy

Last Ingestion
14:15 IST
```

Add:

- ingestion logs
- provider failures
- model version
- data freshness
- fallback counts

Do not expose secrets.

---

# 26. Loading States

Never show an empty screen while waiting.

Use:

- skeleton cards
- map loading overlay
- spinner for short actions
- progress messages for long operations

Example:

```text
Loading Panchayat forecast...
```

Avoid generic:

> "Loading..."

when a more informative message is possible.

---

# 27. Error States

Errors must explain what happened in user language.

Bad:

> Error 500

Better:

> "The forecast provider is temporarily unavailable. Please try again."

Officer view can include technical details behind an expandable section.

---

# 28. Empty States

Example:

```text
No Panchayat data available

The selected district does not currently
have usable Panchayat geometry in the system.
```

Do not display made-up fallback geography.

---

# 29. Data Freshness

Whenever live/reference data is shown, display:

- provider/source
- last update/retrieval time
- applicable forecast period

Example:

```text
Source: Reference Forecast
Updated: 14:20 IST
Forecast period: 19 Sep – 21 Sep
```

Avoid fake "live" labels when data is cached or historical.

---

# 30. Responsive Layout

## Desktop ≥ 1280px

Use:

- sidebar
- wide analytical map
- multi-column cards
- tables/charts

## Tablet 768–1279px

Use:

- narrower sidebar/drawer
- two-column cards
- map/content split

## Mobile < 768px

Use:

- single-column layout
- bottom navigation
- stacked cards
- full-width map
- horizontally scrollable small tables if necessary
- bottom sheets for selection

No critical content should be hidden solely because screen width is small.

---

# 31. Farmer Mobile Priority

Mobile farmer view should be optimized for a quick glance.

Order:

1. Location
2. Current weather
3. Rain risk
4. Critical advisory
5. Next 24 hours
6. Next 3 days
7. Reliability
8. Details

Avoid requiring users to open multiple screens to see the primary action.

---

# 32. Officer Desktop Priority

Officer view should be optimized for analysis.

Order:

1. location/map
2. spatial situation
3. alerts
4. Panchayat forecast
5. reference/localized comparison
6. reliability
7. observations
8. advisory
9. validation

---

# 33. Visual Language

The interface should feel:

- professional
- calm
- scientific
- agricultural
- trustworthy
- modern
- operational

Avoid making it look like:

- gaming UI
- cryptocurrency dashboard
- futuristic sci-fi interface
- generic AI landing page

---

# 34. Color System

Do not hard-code colors into business logic.

Use semantic design tokens.

Suggested semantic roles:

```text
--background
--surface
--surface-muted
--text-primary
--text-secondary
--border
--primary
--success
--warning
--danger
--info
```

Weather-specific colors should be semantic, not arbitrary.

For example:

```text
Rainfall scale
Temperature scale
Reliability scale
Alert scale
```

The exact visual palette can be defined in the implementation theme.

Accessibility must remain a priority.

Do not rely on color alone to communicate status.

---

# 35. Typography

Use a highly readable modern sans-serif.

Recommended hierarchy:

```text
Display
H1
H2
H3
Body
Body Small
Caption
Metric
```

Weather values can use a slightly larger metric style.

Do not use excessive all-caps.

---

# 36. Iconography

Use a consistent icon family.

Icons must:

- have consistent stroke/weight
- support meaning
- have text labels where necessary

Never communicate an important warning only through an icon.

---

# 37. Component System

Build reusable components.

Recommended component groups:

## Navigation

- AppHeader
- Sidebar
- MobileNav
- Breadcrumbs

## Geography

- LocationSelector
- PanchayatSearch
- MapView
- MapLegend
- PanchayatPopup

## Weather

- WeatherCard
- ForecastTimeline
- TemperatureChart
- RainfallChart
- ForecastSummary
- SourceBadge

## Reliability

- ReliabilityBadge
- UncertaintyRange
- ReliabilityCard
- FallbackNotice

## Advisory

- AdvisoryCard
- AdvisoryList
- AlertBanner

## Validation

- MetricCard
- ModelComparison
- ErrorChart
- CorrectionAnalysis

## System/Admin

- ProviderStatus
- DataFreshness
- ModelVersion
- SystemHealth

---

# 38. Component Behavior Rules

Components must receive typed data.

Do not let a component fetch arbitrary third-party API data directly.

For example:

Bad:

```text
WeatherCard → Open-Meteo API
```

Preferred:

```text
Open-Meteo
 ↓
FastAPI
 ↓
NormalizedWeather
 ↓
WeatherCard
```

---

# 39. Frontend Data States

Every data-driven component must support:

1. loading
2. success
3. empty
4. error
5. stale/cached where applicable

Do not design only the happy path.

---

# 40. Accessibility

Minimum requirements:

- keyboard navigation
- visible focus state
- semantic HTML
- accessible button labels
- chart summaries
- sufficient color contrast
- non-color status indicators
- alt text where images carry information
- readable mobile typography

Map interactions should provide an alternate list/selection mechanism.

---

# 41. Localization

The architecture should allow future multilingual content.

MVP language:

- English UI

The product should be structured so future languages can be added without rewriting business logic.

Agricultural advisories should be stored as content/data rather than deeply hard-coded JSX strings.

---

# 42. PWA Behavior

The application should be installable as a PWA where supported.

MVP PWA requirements:

- app manifest
- icons
- responsive layout
- basic offline shell
- cached static assets

Do not claim that weather data is offline-live.

When offline, show cached data with a timestamp.

Example:

```text
You're offline.
Showing last available forecast:
Updated 14:20 IST.
```

---

# 43. Notifications

Push notifications are out of MVP unless explicitly enabled later.

The UI should nevertheless have an architecture-compatible alert surface for future notification functionality.

---

# 44. Data Source Disclosure

A source/provenance panel should be available wherever appropriate.

Example:

```text
Forecast Source
Reference provider: [provider]
Retrieved: [timestamp]
Forecast issue time: [timestamp]

Localized Estimate
Method: [validated method/version]
Generated: [timestamp]
Reliability: [status]
```

Do not display a method/model name that is not actually present in backend metadata.

---

# 45. Scientific Explanation Panel

For officer users, provide an expandable panel:

```text
How was this value generated?

1. Reference forecast retrieved
2. Panchayat/location information resolved
3. Geographic/context features extracted
4. Local correction applied
5. Reliability evaluated
6. Final value selected
```

The content should be generated from real backend metadata/configuration rather than invented by the UI.

---

# 46. Demo Mode

The MVP may include a clearly controlled presentation/demo mode.

It must be visibly identified to administrators/operators.

Demo mode may use:

- preloaded validated historical results
- cached API responses
- fixed pilot Panchayats
- known scenarios

It must never silently pretend historical results are live.

Suggested banner:

```text
DEMONSTRATION DATA
Historical validation scenario
```

Remove the banner only when displaying genuinely live data.

---

# 47. SIH Demo Flow

The design must support a smooth 5–10 minute demonstration.

Recommended path:

```text
Landing/dashboard
 ↓
Select district
 ↓
Select block
 ↓
Select Panchayat
 ↓
Show live/reference forecast
 ↓
Show localized forecast
 ↓
Open "Why different?"
 ↓
Show reliability
 ↓
Show advisory
 ↓
Open validation
 ↓
Show measured comparison
```

The user should not need to navigate through unrelated screens.

A "Demo scenario" shortcut may be implemented later if documented in PRD.

---

# 48. Critical Visual Story

The most important visual story should be:

```text
COARSE / REFERENCE
        ↓
LOCAL CONTEXT
        ↓
LOCALIZED FORECAST
        ↓
RELIABILITY
        ↓
AGRICULTURAL ACTION
```

This story should be apparent within the first few minutes of using the product.

---

# 49. Avoiding Misrepresentation

The UI must never:

- label an external forecast as our ML result
- label reanalysis as observed weather
- present mock data as real
- display unvalidated model performance as validated
- show "accuracy %" without a defined calculation
- display an arbitrary AI confidence number
- display a model as production-ready when it is experimental
- imply that an advisory is official government advice unless appropriately sourced/represented

---

# 50. Error Prevention in UX

For destructive/important officer actions:

- require confirmation
- display current state
- allow cancellation
- record action where backend supports audit logging

Examples:

- rejecting an advisory
- modifying an advisory
- changing active provider
- changing active model version

---

# 51. Performance UX

Target responsive interaction.

Prioritize:

- fast first render
- cached Panchayat data
- progressive map loading
- lazy loading heavy charts
- controlled geographic queries

The frontend should not fetch massive nationwide geometry by default.

Load geography at the selected region level.

---

# 52. Map Performance

Avoid rendering hundreds of thousands of Panchayat polygons simultaneously.

Preferred strategy:

```text
State level
→ simplified/aggregate geometry

District level
→ district/block context

Block level
→ Panchayat polygons

Panchayat selected
→ detailed geometry
```

Use server-side spatial filtering.

---

# 53. Mobile Map Behavior

On mobile:

- keep map interactions simple
- use a bottom sheet for selected Panchayat details
- avoid tiny controls
- maintain a "list view" alternative

Example:

```text
[Map]

-------------------------
ABC Panchayat
Rain: 18 mm
Reliability: Moderate

[View Forecast]
-------------------------
```

---

# 54. Design for Uncertainty

The UI must avoid false precision.

Prefer:

```text
Rainfall: 18 mm
Range: 12–27 mm
```

over:

```text
Rainfall: 18.24791 mm
Confidence: 91.82%
```

unless such precision is scientifically justified.

---

# 55. Forecast Comparison Design

Use side-by-side cards on desktop:

```text
REFERENCE              LOCALIZED
32.4°C                 31.7°C
12 mm                  18 mm
```

On mobile use vertical stacking:

```text
Reference: 32.4°C

Localized: 31.7°C

Difference: -0.7°C
```

Difference calculations must come from backend or verified client logic.

---

# 56. Agricultural Decision Summary

Every advisory should answer:

> What should I do?

Use a clear structure:

```text
CONDITION
Rain expected in next 24h.

ACTION
Delay irrigation.

WHY
Expected rainfall may reduce immediate
irrigation need.

VALIDITY
Next 24 hours.
```

Do not bury the action in a paragraph.

---

# 57. Future Extension Slots

The design should allow future modules without restructuring the application:

- crop selection
- crop stage
- soil information
- irrigation status
- disease risk
- satellite layers
- advanced model explanation
- notifications
- multilingual content
- mobile app wrapper

These are extension points, not MVP requirements.

---

# 58. Design Tokens / Theme Organization

Recommended frontend structure:

```text
frontend/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── geography/
│   ├── weather/
│   ├── reliability/
│   ├── advisory/
│   └── validation/
├── features/
│   ├── dashboard/
│   ├── forecast/
│   ├── map/
│   ├── advisories/
│   └── validation/
├── styles/
│   └── globals.css
└── lib/
```

Theme tokens should remain centralized.

---

# 59. UX Acceptance Checklist

Before a screen is considered complete, verify:

### Clarity
- User knows what page they are on.
- Location context is visible.
- Values have units.
- Time window is visible.

### Trust
- Source is visible.
- Update time is visible.
- Localized/reference distinction is visible.
- Reliability is not fabricated.

### Actionability
- Advisory action is easy to find.
- Alert severity is understandable.

### Accessibility
- Keyboard usable.
- Text readable.
- Color not the only status signal.

### Data States
- loading exists
- empty exists
- error exists
- stale/offline behavior exists

### Responsive
- desktop works
- mobile works
- map works
- charts remain usable

---

# 60. Final MVP Screens

The initial implementation should prioritize these screens:

## 1. Landing / Dashboard

Purpose:
Orient user and expose location selection.

## 2. Panchayat Map

Purpose:
Explore local geography and weather state.

## 3. Panchayat Forecast

Purpose:
View reference and localized weather.

## 4. Agricultural Advisory

Purpose:
Turn weather into action.

## 5. Reliability / Explanation

Purpose:
Show trust level and why.

## 6. Validation / Comparison

Purpose:
Demonstrate scientific evidence.

## 7. Officer Review

Purpose:
Approve/modify/reject advisory where enabled.

## 8. Admin Health

Purpose:
Show provider/data/model system state.

---

# 61. Final MVP User Flow

## Farmer

```text
Open
 ↓
Choose Panchayat
 ↓
Today's weather
 ↓
Rain/temperature outlook
 ↓
Agricultural action
 ↓
Reliability/details
```

## Officer

```text
Open
 ↓
Choose region
 ↓
Map
 ↓
Select Panchayat
 ↓
Reference forecast
 ↓
Localized forecast
 ↓
Reliability
 ↓
Observations/validation
 ↓
Advisory
 ↓
Review
```

## Admin

```text
Open
 ↓
System health
 ↓
Provider status
 ↓
Data freshness
 ↓
Model version
 ↓
Logs / errors
```

---

# 62. Design Invariants

These must remain true across implementation:

1. The product is a responsive PWA for the MVP.
2. Map and Panchayat selection are first-class features.
3. Reference forecast and localized forecast are visually distinguishable.
4. Weather values always display units and applicable time period.
5. Reliability is never fabricated.
6. Mock/demo data is clearly identified.
7. Advisory action is more prominent than technical explanation in farmer view.
8. Officer view exposes more technical information than farmer view.
9. Validation is kept separate from user-facing agricultural interpretation.
10. The UI does not depend directly on third-party weather provider responses.
11. The downscaling method is replaceable.
12. Source/provenance is available for important weather outputs.
13. The design supports fallback when localized correction is unavailable/unreliable.
14. Color is never the sole mechanism for conveying risk/status.
15. The interface remains usable on mobile and desktop.

---

# 63. Open Design Questions

These questions remain intentionally open until the other project documents or implementation evidence resolves them:

- Final product name/branding.
- Final map library between Leaflet and MapLibre if architecture has not frozen it.
- Final semantic color palette.
- Exact pilot district.
- Exact weather variables shown in MVP.
- Exact reliability method.
- Exact advisory catalogue.
- Exact farmer-language strategy.
- Exact officer authentication method.
- Whether a dedicated demo-mode route is necessary.

Do not silently resolve these open questions in implementation if doing so changes product behavior. Record decisions in `memory.md` or the appropriate project documentation.

---

# 64. Final Design Principle

The application should feel like a **weather intelligence system for local agricultural decisions**, not a generic weather app.

The visual hierarchy should continuously reinforce:

```text
WHERE?
   ↓
WHAT WEATHER?
   ↓
HOW LOCAL?
   ↓
HOW TRUSTWORTHY?
   ↓
WHAT ACTION?
```

The product succeeds visually when a farmer can understand the recommended action in seconds, while a technical officer can inspect the underlying forecast source, localization, reliability, and validation without leaving the platform.

The final design must support scientific honesty as strongly as visual quality.
