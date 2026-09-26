# GramWeather MVP Architecture

This diagram illustrates the flow of data through the GramWeather MVP, showing how the frontend, backend, database, and external providers coordinate to generate a localized forecast using the B2 Physical Lapse-Rate correction.

```mermaid
flowchart TD
    %% Frontend
    Client[Next.js Frontend]
    
    %% Backend
    API[FastAPI Backend / Weather API]
    
    %% Database
    DB[(PostgreSQL / PostGIS)]
    
    %% Services
    ForecastService[Forecast Provider]
    ElevationService[Elevation Service]
    B2Engine[B2 Downscaling Engine]
    
    %% External APIs
    OM_Forecast((Open-Meteo Forecast API))
    OM_Elevation((Open-Meteo Elevation API / SRTM 90m))
    
    %% Flow
    Client -->|1. Request Panchayat Forecast| API
    API -->|2. Get coordinates & ID| DB
    DB -.->|Lat, Lon, Meta| API
    
    API -->|3. Fetch Ref Forecast| ForecastService
    ForecastService -->|4. HTTP Request| OM_Forecast
    OM_Forecast -.->|Ref Temp, Ref Elevation| ForecastService
    
    API -->|5. Fetch Target Elevation| ElevationService
    ElevationService -->|6. HTTP Request| OM_Elevation
    OM_Elevation -.->|Target Elevation| ElevationService
    
    API -->|7. Orchestrate inputs| B2Engine
    B2Engine -->|8. Apply Γ = 0.0065 °C/m| B2Engine
    B2Engine -.->|Localized Forecast| API
    
    API -.->|9. Combined Response JSON| Client
    
    %% Styling
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef db fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef external fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    
    class Client frontend;
    class API,ForecastService,ElevationService,B2Engine backend;
    class DB db;
    class OM_Forecast,OM_Elevation external;
```
