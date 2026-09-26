# IMD API Access Requirements

This document outlines the exact mechanisms for accessing official weather data from the India Meteorological Department (IMD) via their API Management Platform (`https://api.imd.gov.in/public/`).

## Access Mechanism & Authentication

**Authentication Requirement:** YES. All public API endpoints currently return `{"error": "API key missing"}` when queried without credentials.
**Access Control Model:** Secure JWT / API Key.
**Registration URL:** `https://api.imd.gov.in/public/register.php`

To consume the IMD API, the following human action is required:
1. Create an account on the IMD API portal.
2. Complete profile validation and generate an API key.
3. Configure the GramWeather environment with the obtained API key.

## Monitored Endpoints

### 1. City Weather Forecast (7 Days)
- **Endpoint:** `/api/v1/cityforecastloc` or `/api/v1/cityforecast`
- **Coordinate Support:** Requires a specific `id` parameter (e.g. `?id=42182`) which maps to a known IMD forecast location/city rather than arbitrary continuous geographic coordinates. A mapping dataset exists at `/api/v1/cityforecast_mapping`.
- **Forecast Horizon:** 7 Days (Today + Day 2 through Day 7).
- **Time Resolution:** Daily max/min temperatures, and current/previous day observations.
- **Fields Returned:** `Date`, `Station_Name`, `Today_Max_temp`, `Today_Min_temp`, `Past_24_hrs_Rainfall`, `Relative_Humidity_at_0830`, `Sunrise_time`, `Todays_Forecast`, `Day_2_Max_Temp`, `Day_2_Forecast`, etc.

### 2. Current Weather (Nowcast)
- **Endpoint:** `/api/v1/current_wx`
- **Coordinate Support:** Requires a specific `id=StationId`.
- **Time Resolution:** Latest available UTC observation time.
- **Fields Returned:** `Temperature`, `Humidity`, `Wind Speed`, `Wind Direction`, `Weather Code`, `Last 24 hrs Rainfall`.

### 3. AWS / ARG Data (Real-time Observations)
- **Endpoint:** `/api/v1/aws_data`
- **State-wise Support:** Can query by state ID (e.g., `?sid=21` for Maharashtra).
- **Coordinate Support:** No direct lat/lon query; requires AWS Mapping Data to locate the nearest station.

## Rate Limiting & Restrictions
While precise rate limits aren't explicitly documented on the public reference page, IMD explicitly controls key-based consumption.
GramWeather must implement:
- Aggressive caching of Daily Forecasts (since they update a few times a day).
- Hourly caching for AWS Current Conditions.
- No direct client-to-IMD API calls (all proxied through FastAPI).

## Action Required
To enable live weather data, obtain the API key and set it in your `.env` file:
```env
IMD_API_KEY=your_key_here
```
