import React, { useState, useEffect, useCallback } from "react";
import LocationSelector from "./LocationSelector";
import MapWrapper from "./MapWrapper";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/api/client";
import { ChevronDown, ChevronUp, Droplets, Wind, CloudRain, Sun, CloudSun, MapPin } from "lucide-react";

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
    id: number;
    name: string;
    gpcode: number;
    block: string;
    district: string;
    state: string;
    lat?: number;
    lon?: number;
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
  className?: string;
  initialLat?: number;
  initialLon?: number;
  initialZoom?: number;
}> = ({ className, initialLat, initialLon, initialZoom }) => {
  const [selectedGpCode, setSelectedGpCode] = useState<string>("");
  const [interval, setInterval] = useState<number>(3);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [geoJson, setGeoJson] = useState<unknown | null>(null);
  const [pins, setPins] = useState<any[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | number | undefined>(undefined);
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null);
  const [isCardCollapsed, setIsCardCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const mapViewport = {
    lat: initialLat ?? 20.5937,
    lon: initialLon ?? 78.9629,
    zoom: initialZoom ?? 4,
  };

  const API_URL = `${getApiBaseUrl()}/api`;
  const [localBoundaries, setLocalBoundaries] = useState<any>(null);

  useEffect(() => {
    fetch('/data/boundaries_cache.json')
      .then(res => {
        if (!res.ok) throw new Error('Cache not found');
        return res.json();
      })
      .then(data => setLocalBoundaries(data))
      .catch(err => console.debug('Local boundaries cache loading deferred', err));
  }, []);

  const fetchBoundary = useCallback(async (
    level: string,
    code: string,
    stcode?: string,
    dtcode?: string,
    bpcode?: string,
    name?: string
  ) => {
    let layer = 1;
    let where = "";
    let is_bharatmaps = false;

    if (level === "state") {
      layer = 0;
      where = `State_LGD=${code}`;
      setPins([]);
      setSelectedPinId(undefined);
      setSelectedPoint(null);
      if (localBoundaries?.states) {
        const cleanName = (name || "").toLowerCase();
        const match =
          localBoundaries.states[code] ||
          (cleanName && localBoundaries.states[cleanName]) ||
          Object.values(localBoundaries.states).find(
            (s: any) =>
              String(s.state_lgd) === String(code) ||
              (cleanName && s.name && s.name.toLowerCase() === cleanName) ||
              (Array.isArray(s.aliases) &&
                (s.aliases.map(String).includes(String(code)) ||
                  (cleanName && s.aliases.map((a: string) => a.toLowerCase()).includes(cleanName))))
          );
        if (match && (match as any).geometry) {
          setGeoJson({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { State_LGD: Number(code), STNAME: (match as any).name || name, TYPE: "State" },
                geometry: (match as any).geometry,
              },
            ],
          });
          return;
        }
      }
    } else if (level === "district") {
      layer = 1;
      where = `Dist_LGD=${code}`;
      setPins([]);
      setSelectedPinId(undefined);
      setSelectedPoint(null);
      if (stcode) where += ` AND State_LGD=${stcode}`;
      if (name) where += ` AND district='${encodeURIComponent(name)}'`;
      if (localBoundaries?.districts) {
        const cleanName = (name || "").toLowerCase();
        const match =
          (cleanName && localBoundaries.districts[cleanName]) ||
          (cleanName.includes("leh") && localBoundaries.districts["ladakh (leh)"]) ||
          localBoundaries.districts[code] ||
          Object.values(localBoundaries.districts).find(
            (d: any) =>
              String(d.dist_lgd) === String(code) ||
              (cleanName && d.district && d.district.toLowerCase() === cleanName) ||
              (cleanName && d.district && cleanName.includes(d.district.toLowerCase()))
          );
        if (match && (match as any).geometry) {
          setGeoJson({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  Dist_LGD: Number(code),
                  D_Pan_Name: (match as any).district || name,
                  State: (match as any).state,
                },
                geometry: (match as any).geometry,
              },
            ],
          });
          return;
        }
      }
    } else if (level === "block") {
      layer = 2;
      where = `block_lgd=${code}`;
      if (name) where += ` AND block='${name}'`;
      if (dtcode) where += ` AND dist_lgd=${dtcode}`;

      // Concurrently query both block boundary and its Gram Panchayats
      try {
        const blockUrl = `${API_URL}/nic/query?layer_id=2&where=${encodeURIComponent(where)}&outFields=*&returnGeometry=true&f=geojson`;
        const gpUrl = `${API_URL}/nic/query?layer_id=3&where=${encodeURIComponent(`blklgdcode='${code}'`)}&outFields=*&returnGeometry=true&f=geojson`;
        const [blockRes, gpRes] = await Promise.all([fetch(blockUrl), fetch(gpUrl)]);
        const blockData = blockRes.ok ? await blockRes.json() : null;
        const gpData = gpRes.ok ? await gpRes.json() : null;

        const combinedFeatures: any[] = [];
        const newPins: any[] = [];

        if (blockData?.features) {
          combinedFeatures.push(...blockData.features);
        }
        if (gpData?.features && gpData.features.length > 0) {
          combinedFeatures.push(...gpData.features);
          gpData.features.forEach((f: any) => {
            const coords = f.geometry?.coordinates?.[0];
            if (coords && coords.length > 0) {
              let sumLon = 0;
              let sumLat = 0;
              coords.forEach(([lon, lat]: [number, number]) => {
                sumLon += lon;
                sumLat += lat;
              });
              const lat = Number((sumLat / coords.length).toFixed(4));
              const lon = Number((sumLon / coords.length).toFixed(4));
              newPins.push({
                id: String(f.properties?.gp_code),
                name: f.properties?.gp_name || `Gram Panchayat ${f.properties?.gp_code}`,
                lat,
                lon,
                type: "PANCHAYAT",
                block_name: name || "Block",
                map_status: "WEATHER_AVAILABLE",
              });
            }
          });
        }

        setPins(newPins);
        setSelectedPinId(undefined);
        setSelectedPoint(null);
        if (combinedFeatures.length > 0) {
          setGeoJson({ type: "FeatureCollection", features: combinedFeatures });
        }
        return;
      } catch (e) {
        console.error("Failed to fetch block hierarchy", e);
      }
    } else if (level === "gp") {
      layer = 3;
      where = `gp_code='${code}'`;
      if (bpcode) where += ` AND blklgdcode='${bpcode}'`;
      is_bharatmaps = false;
      setSelectedPinId(code);

      // If we already have the block map with GP polygons loaded, simply highlight the GP and focus it
      if (geoJson && (geoJson as any).features && (geoJson as any).features.length > 1) {
        const gpFeat = (geoJson as any).features.find(
          (f: any) => String(f?.properties?.gp_code) === String(code)
        );
        if (gpFeat) {
          const coords = gpFeat.geometry?.coordinates?.[0];
          if (coords && coords.length > 0) {
            let sumLon = 0;
            let sumLat = 0;
            coords.forEach(([lon, lat]: [number, number]) => {
              sumLon += lon;
              sumLat += lat;
            });
            setSelectedPoint([sumLat / coords.length, sumLon / coords.length]);
          }
          return; // Keep outer block boundary and all GP polygons on map, highlighting selected GP
        }
      }

      // Also check pins if coordinates are already known
      const matchedPin = pins.find((p) => String(p.id) === String(code));
      if (matchedPin) {
        setSelectedPoint([matchedPin.lat, matchedPin.lon]);
      }
    }

    try {
      const url = `${API_URL}/nic/query?layer_id=${layer}&where=${encodeURIComponent(
        where
      )}&outFields=*&returnGeometry=true&f=geojson&is_bharatmaps=${is_bharatmaps}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          setGeoJson(data);
          if (level === "gp") {
            const f = data.features[0];
            const coords = f.geometry?.coordinates?.[0];
            if (coords && coords.length > 0) {
              let sumLon = 0;
              let sumLat = 0;
              coords.forEach(([lon, lat]: [number, number]) => {
                sumLon += lon;
                sumLat += lat;
              });
              setSelectedPoint([sumLat / coords.length, sumLon / coords.length]);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch boundary", e);
    }
  }, [API_URL, localBoundaries]);

  // No auto-preload — user must explicitly select a location

  const handleSelectionChange = (
    level: "state" | "district" | "block" | "gp" | "none",
    code: string,
    stcode?: string,
    dtcode?: string,
    bpcode?: string,
    name?: string
  ) => {
    if (level === "none") {
      setGeoJson(null);
      setForecastData(null);
      setSelectedGpCode("");
      setPins([]);
      setSelectedPinId(undefined);
      setSelectedPoint(null);
      return;
    }

    fetchBoundary(level, code, stcode, dtcode, bpcode, name);

    // Weather forecast ONLY shows when user explicitly selects a Gram Panchayat
    if (level === "gp") {
      setSelectedGpCode(code);
    } else {
      // For state/district/block — clear forecast panel, keep map boundary
      setSelectedGpCode("");
      setForecastData(null);
    }
  };

  const handlePinClick = (pin: any) => {
    const gpCodeStr = String(pin.id);
    setSelectedGpCode(gpCodeStr);
    setSelectedPinId(gpCodeStr);
    setSelectedPoint([pin.lat, pin.lon]);
    fetchBoundary("gp", gpCodeStr, undefined, undefined, undefined, pin.name);
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
      .then((data) => {
        setForecastData(data);
        setLoading(false);
      })
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
          pins={pins}
          selectedPinId={selectedPinId}
          onPinClick={handlePinClick}
          selectedPoint={selectedPoint}
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
          isSidebarOpen ? "left-[280px] sm:left-[360px]" : "left-0"
        }`}
        aria-label="Toggle location drawer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
        </svg>
      </button>

      {/* LEFT SIDEBAR (Collapsible) */}
      <div className={`absolute top-0 left-0 h-[65vh] max-h-[600px] bg-white/95 backdrop-blur-md border-r border-b border-slate-200 rounded-br-2xl shadow-2xl transition-transform duration-300 z-[50] flex flex-col w-[280px] sm:w-[360px] max-w-[85vw] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-white rounded-tr-2xl">
          <div className="flex items-center gap-2 text-emerald-700">
            <MapPin className="h-5 w-5" />
            <h2 className="font-bold text-base sm:text-lg">Select Location</h2>
          </div>
        </div>
        
        <div className="p-4 sm:p-5 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-300">
          <LocationSelector 
            onSelectionChange={handleSelectionChange} 
            disabled={loading}
            selectedGpCode={selectedGpCode}
          />
          
          {loading && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* FORECAST BOTTOM RIGHT PANEL (Floating) */}
      {forecastData && (
        <div className="absolute bottom-2 sm:bottom-6 left-2 right-2 sm:left-auto sm:right-6 z-[40] sm:w-[620px] w-auto max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-32px)] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-8">
          
          {/* Header & Interval Tabs */}
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{forecastData.panchayat.name}</h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {forecastData.panchayat.block}, {forecastData.panchayat.district}, {forecastData.panchayat.state} (Code: {forecastData.panchayat.gpcode})
                </p>
              </div>

              {/* Mobile collapse button */}
              <button
                onClick={() => setIsCardCollapsed(!isCardCollapsed)}
                className="sm:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                aria-label="Toggle card"
              >
                {isCardCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex bg-slate-800 rounded-lg p-1">
                {[
                  { val: 1, label: "36h" },
                  { val: 3, label: "5 Days" },
                  { val: 6, label: "10 Days" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setInterval(opt.val)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      interval === opt.val
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Desktop collapse button */}
              <button
                onClick={() => setIsCardCollapsed(!isCardCollapsed)}
                className="hidden sm:flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                title={isCardCollapsed ? "Expand Forecast" : "Minimize Forecast"}
              >
                {isCardCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {!isCardCollapsed && (
            <div className="p-4 sm:p-5 space-y-3.5">
              {forecastData.forecasts && forecastData.forecasts.length > 0 ? (
                <>
                  {/* Current Metric Highlight */}
                  {(() => {
                    const current = forecastData.forecasts[0];
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 p-3 sm:p-4 rounded-xl shadow-xs gap-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl sm:text-4xl">
                            {current.precipitation > 0 ? (
                              <CloudRain className="w-9 h-9 text-blue-600" />
                            ) : current.temperature && current.temperature > 28 ? (
                              <Sun className="w-9 h-9 text-amber-500" />
                            ) : (
                              <CloudSun className="w-9 h-9 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {current.temperature}°C
                              </span>
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                {current.precipitation > 0 ? 'Rain Observed' : 'Clear & Dry'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                              Microclimate Pipeline: {forecastData.downscaling_method || "IMD B2 Elevation-Calibrated"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <div className="bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs text-center flex-1 sm:flex-initial">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold flex items-center justify-center gap-1">
                              <CloudRain className="w-3 h-3 text-blue-500" /> Rain
                            </span>
                            <span className="text-xs font-bold text-blue-600">{current.precipitation} mm</span>
                          </div>
                          <div className="bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs text-center flex-1 sm:flex-initial">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold flex items-center justify-center gap-1">
                              <Droplets className="w-3 h-3 text-emerald-600" /> Humidity
                            </span>
                            <span className="text-xs font-bold text-emerald-700">{current.humidity}%</span>
                          </div>
                          <div className="bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs text-center flex-1 sm:flex-initial">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold flex items-center justify-center gap-1">
                              <Wind className="w-3 h-3 text-slate-500" /> Wind
                            </span>
                            <span className="text-xs font-bold text-slate-800">{current.wind_speed} km/h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hourly Forecast Timeline Carousel */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {interval === 1 ? '36-Hour Continuous' : interval === 3 ? '5-Day Multi-Point' : '10-Day Extended'} Downscaled Timeline
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ● Direct IMD Mausamgram
                      </span>
                    </div>

                    <div className="flex overflow-x-auto pb-2 gap-2.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      {forecastData.forecasts.map((f: any, idx: number) => {
                        const d = new Date(f.valid_time);
                        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        return (
                          <div
                            key={idx}
                            className="min-w-[110px] bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-xl p-2.5 flex flex-col items-center transition-all shadow-2xs"
                          >
                            <span className="text-[11px] font-bold text-slate-800">{timeStr}</span>
                            <span className="text-[10px] text-slate-400 mb-1">{dateStr}</span>
                            <div className="text-xl my-1">
                              {f.precipitation > 0 ? '🌧️' : (f.temperature > 28 ? '☀️' : '⛅')}
                            </div>
                            <span className="text-sm font-black text-slate-900 mb-1.5">{f.temperature}°C</span>
                            <div className="w-full space-y-0.5">
                              <div className="flex justify-between text-[9px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                <span>Rain</span>
                                <span className="font-bold text-blue-600">{f.precipitation}mm</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                <span>Wind</span>
                                <span className="font-bold text-slate-700">{f.wind_speed}km/h</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <h3 className="text-amber-800 font-bold text-sm mb-1">Status: Initializing Spatial Telemetry</h3>
                  <p className="text-amber-700 text-xs">Fetching microclimate grid data for this jurisdiction...</p>
                </div>
              )}
              
              <div className="text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between border-t border-slate-100 pt-2.5 gap-1">
                <span><strong>Source:</strong> {forecastData.source}</span>
                <span><strong>Pipeline:</strong> {forecastData.provenance?.pipeline || "Microclimate Elevation Calibration"}</span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
