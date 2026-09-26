import React, { useState, useEffect } from "react";
import LocationSelector from "./LocationSelector";
import MapWrapper from "./MapWrapper";
import { cn } from "@/lib/utils";

interface HourlyRecord {
  valid_time: string;
  temperature: number | null;
  reference_temperature?: number | null;
  temperature_adjustment_c?: number | null;
  precipitation: number;
  humidity: number;
  wind_speed: number;
  wind_direction?: number;
}

interface DailyForecast {
  date: string;
  min_temperature: number;
  max_temperature: number;
  precipitation_total: number;
}

interface ValidationSummary {
  dataset_size: number;
  stations: number;
  b0_overall_mae_c: number;
  b2_overall_mae_c: number;
  harmful_correction_rate_pct: number;
}

interface LocalizedEstimate {
  method: string;
  status: string;
  gamma_c_per_m?: number;
  reference_elevation_m?: number;
  target_elevation_m?: number;
  elevation_difference_m?: number;
  temperature_adjustment_c?: number;
  limitations: string[];
  values: HourlyRecord[];
  validation_summary?: ValidationSummary;
  assumptions?: string[];
  b2_fallback_reason?: string;
}

interface ForecastResponse {
  panchayat: {
    id: number; name: string; gpcode: number; block: string; district: string;
    state: string; lat?: number; lon?: number;
  };
  source: string;
  provider_status: string;
  issue_time: string | null;
  is_stale: boolean;
  forecasts: HourlyRecord[];
  daily_forecasts?: DailyForecast[];
  localized_estimate?: LocalizedEstimate;
  downscaling_method?: string;
  downscaling_elevation_inputs_used?: boolean;
  provenance: { 
    pipeline: string; 
    reference_provider: string; 
    downscaling_method?: string; 
    production_validation_caveat?: string;
  };
}

export const GramWeatherDemo: React.FC<{
  className?: string
  initialLat?: number
  initialLon?: number
  initialZoom?: number
}> = ({ className, initialLat, initialLon, initialZoom }) => {
  const [selectedGpCode, setSelectedGpCode] = useState<string>("");
  const [interval, setInterval] = useState<number>(3);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [geoJson, setGeoJson] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const mapViewport = {
    lat: initialLat ?? 20.5937,
    lon: initialLon ?? 78.9629,
    zoom: initialZoom ?? 4,
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const fetchBoundary = async (level: string, code: string, stcode?: string, dtcode?: string, bpcode?: string) => {
    let layer = 1;
    let where = "";
    let is_bharatmaps = false;

    if (level === "state") {
      layer = 0; where = `State_LGD=${code}`;
    } else if (level === "district") {
      layer = 1; where = `Dist_LGD=${code}`;
    } else if (level === "block") {
      layer = 2; where = `block_lgd=${code}`;
    } else if (level === "gp") {
      layer = 3; where = `gp_code='${code}'`;
      is_bharatmaps = false;
    }

    try {
      const url = `${API_URL}/nic/query?layer_id=${layer}&where=${encodeURIComponent(where)}&outFields=*&returnGeometry=true&f=geojson&is_bharatmaps=${is_bharatmaps}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          setGeoJson(data);
        } else {
          setGeoJson(null);
        }
      }
    } catch (e) {
      console.error("Failed to fetch boundary", e);
      setGeoJson(null);
    }
  };

  const handleSelectionChange = (level: "state" | "district" | "block" | "gp" | "none", code: string, stcode?: string, dtcode?: string, bpcode?: string) => {
    if (level === "none") {
      setGeoJson(null);
      setForecastData(null);
      setSelectedGpCode("");
      return;
    }

    fetchBoundary(level, code, stcode, dtcode, bpcode);

    if (level === "gp") {
      setSelectedGpCode(code);
    } else {
      setSelectedGpCode("");
      setForecastData(null);
    }
  };

  useEffect(() => {
    if (!selectedGpCode) return;
    setLoading(true);
    setError("");

    fetch(`${API_URL}/weather/gp/${selectedGpCode}?interval=${interval}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to fetch forecast");
        }
        return res.json();
      })
      .then((data) => { setForecastData(data); setLoading(false); })
      .catch((err) => {
        console.error(err);
        setError(`Failed to load forecast: ${err.message}`);
        setLoading(false);
      });
  }, [selectedGpCode, interval, API_URL]);

  return (
    <div className={cn("w-full h-[calc(100vh-64px)] relative overflow-hidden bg-slate-50", className)}>
      
      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0 z-0">
        <MapWrapper 
          lat={mapViewport.lat} 
          lon={mapViewport.lon} 
          geoJson={geoJson} 
          zoom={mapViewport.zoom} 
        />
      </div>

      {/* ERROR OVERLAY */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl shadow-lg font-medium">
          {error}
        </div>
      )}

      {/* SIDEBAR TOGGLE BUTTON (Half-curved circle) */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-1/3 -translate-y-1/2 z-[60] w-7 h-14 bg-white border border-slate-200 border-l-0 rounded-r-full shadow-[4px_0_10px_rgb(0,0,0,0.1)] flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition-all duration-300 ${
          isSidebarOpen ? "left-[360px]" : "left-0"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
        </svg>
      </button>

      {/* LEFT SIDEBAR (Collapsible) */}
      <div className={`absolute top-0 left-0 h-[65vh] max-h-[600px] bg-white/95 backdrop-blur-md border-r border-b border-slate-200 rounded-br-2xl shadow-2xl transition-transform duration-300 z-[50] flex flex-col w-[360px] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white rounded-tr-2xl">
          <div className="flex items-center gap-2 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h2 className="font-bold text-lg">Select Location</h2>
          </div>
        </div>
        
        <div className="p-5 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-300">
          <LocationSelector 
            onSelectionChange={handleSelectionChange} 
            disabled={loading} 
          />
          
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          )}
        </div>
      </div>


      {/* FORECAST BOTTOM RIGHT PANEL (Floating) */}
      {forecastData && (
        <div className="absolute bottom-6 right-6 z-[40] w-[600px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-8">
          
          {/* Header & Interval Tabs */}
          <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">{forecastData.panchayat.name}</h2>
              <p className="text-xs text-slate-300">
                {forecastData.panchayat.block}, {forecastData.panchayat.district}, {forecastData.panchayat.state} (GP: {forecastData.panchayat.gpcode})
              </p>
            </div>
            
            <div className="flex bg-slate-800 rounded-lg p-1 self-stretch sm:self-auto">
              {[
                { val: 1, label: "36h" },
                { val: 3, label: "5 Days" },
                { val: 6, label: "10 Days" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setInterval(opt.val)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    interval === opt.val
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {forecastData.provider_status === "AUTHORIZED" && forecastData.forecasts && forecastData.forecasts.length > 0 ? (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Hourly Forecast</h3>
                <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {forecastData.forecasts.map((f: any, idx: number) => {
                    const d = new Date(f.valid_time);
                    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <div key={idx} className="min-w-[120px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-700">{timeStr}</span>
                        <span className="text-[10px] text-slate-400 mb-1">{dateStr}</span>
                        <div className="text-2xl my-1">
                          {f.precipitation > 0 ? '🌧️' : (f.temperature > 28 ? '☀️' : '⛅')}
                        </div>
                        <span className="text-base font-bold text-slate-900 mb-2">{f.temperature}°C</span>
                        <div className="w-full space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-600 bg-white px-1.5 py-0.5 rounded">
                            <span>Rain</span><span className="font-bold text-blue-600">{f.precipitation}mm</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-600 bg-white px-1.5 py-0.5 rounded">
                            <span>Wind</span><span className="font-bold">{f.wind_speed}km/h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <h3 className="text-amber-800 font-bold text-sm mb-1">Integration Status: {forecastData.provider_status}</h3>
                <p className="text-amber-700 text-xs">Waiting for live data integration...</p>
              </div>
            )}
            
            <div className="mt-3 text-[10px] text-slate-400 flex justify-between border-t border-slate-100 pt-3">
              <span><strong>Source:</strong> {forecastData.source}</span>
              <span><strong>Method:</strong> {forecastData.provenance.pipeline}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
