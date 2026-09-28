# Data-source and provider setup

This document separates sources that can be used immediately from integrations
that require a formal account or government agreement. Do not relabel fallback
data as IMD, AWS, or delivered communications.

## Usable now: public forecast fallback

Use **Open-Meteo** for the controlled pilot while no authorised IMD feed is
configured. It requires no key for eligible low-volume/non-commercial usage and
its data is CC BY 4.0. The application must display the attribution `Weather
data by Open-Meteo.com` whenever that source is shown.

- API: `https://api.open-meteo.com/v1/forecast`
- Documentation and licence: <https://open-meteo.com/>
- Operational rule: record provider, fetched time, model/elevation metadata and
  the forecast valid time on every response.
- Limitation: it is a public numerical-weather source, **not IMD**, and cannot
  substantiate an official IMD advisory claim.

## Official geography: LGD

Use the Ministry of Panchayati Raj's **Local Government Directory** catalogue on
data.gov.in for states, districts, blocks and Gram Panchayat codes. It is
released under NDSAP and publishes downloadable/API resources that are updated
monthly.

1. Download or request the appropriate LGD API resource from the catalogue.
2. Store source URL, download time, release date and checksum with each import.
3. Resolve records by LGD code, not name alone; hold unmatched names for human
   review.
4. Import boundary geometry only from a licensed, documented geometry source;
   LGD directory codes are not a substitute for boundary polygons.

Catalogue: <https://data.gov.in/catalog/local-government-directory-lgd>

## Official weather and stations: IMD

IMD publishes API documentation and provides weather forecast/observation APIs,
but a production connection needs its documented endpoint agreement and the
appropriate credentials. Configure `IMD_BASE_URL` and `IMD_API_KEY` only after
an integration test verifies issuance and validity times, station IDs, request
limits and response schema.

References:

- <https://mausam.imd.gov.in/responsive/apis.php>
- <https://mausam.imd.gov.in/imd_latest/contents/api.pdf>

## India-first delivery: MSG91

MSG91 exposes SMS, WhatsApp-template and voice/IVR APIs, including OTP and
delivery-log endpoints. A free trial can help validate a small controlled demo,
but it is not a production entitlement: register a sender, secure user consent,
obtain DLT/WhatsApp template approval where applicable, configure webhook
verification, and store only provider receipts in the delivery status.

References:

- <https://docs.msg91.com/sms/send-sms>
- <https://docs.msg91.com/whatsapp>
- <https://docs.msg91.com/voice>

## Required production evidence

Before changing any status to `CONNECTED`, retain a dated evidence record of:

1. source/provider contract and environment;
2. request and response schema version;
3. data provenance, timestamps and freshness policy;
4. a monitored successful ingestion/delivery run; and
5. a failure-mode test showing that no advisory or delivery is falsely claimed.
