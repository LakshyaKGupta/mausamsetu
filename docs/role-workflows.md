# Role workflows

## Farmer: decide what to do today

The Farmer selects Hindi, Marathi or English, then chooses a village manually or
uses the browser's live GPS. The selected location is shown with its source,
accuracy and timestamp and is shared by weather, forecast, advisory, crop and
voice/text-question screens. The primary action card is deliberately simpler
than raw weather telemetry: it explains what action is appropriate today and
offers audio playback of an officer-approved advisory. When GPS hierarchy
resolution is unavailable, the app keeps the actual coordinates and asks the
farmer to select a village; it never substitutes another district.

## Officer: review, decide and document

The Officer uses the same viewing scope to open draft advisories, Weather Watch,
field reports and the block map. They inspect source and research evidence,
edit Hindi/Marathi/English text, provide a rationale and approve or reject the
draft. The system records the action and creates a queued delivery job; queued
does not mean delivered. Changing viewing scope cannot expand the Officer's
server-authorized jurisdiction or permit cross-block approval.

## Admin: govern pilot readiness

The Admin drills from state to district, block and Panchayat to review coverage,
officer workload, advisory queues, provider readiness, model evidence,
fallback readiness and audit history. Database records take precedence. Where a
district is selectable but has no imported operational records, the dashboard
must display `PILOT_DATA` or `NO_RECORDS`, never fabricated live telemetry.

## Model and delivery labels

The bundled Phase 6 artifact is `RESEARCH_DEMO`: it is checksum-versioned,
shows its matched GFS/ISD data limitations, and cannot activate production
Panchayat inference. A fallback drill reports dependency readiness only. SMS,
WhatsApp and IVR delivery are delivered only after a provider worker records a
provider receipt.
