import { useEffect, useState, useCallback } from "react";
import { MapContainer, useMap, GeoJSON, Popup, useMapEvents, CircleMarker, WMSTileLayer, LayersControl, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BasemapSelector, BasemapType } from "./BasemapSelector";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface MapPin {
  id: string | number;
  name: string;
  lat: number;
  lon: number;
  type: "DISTRICT" | "PANCHAYAT";
  lgd_code?: number;
  panchayat_count?: number;
  weather_coverage_pct?: number;
  geometry_status?: string;
  weather_status?: string;
  map_status?: string;
  block_name?: string;
  temp?: number;
}

interface MapProps {
  geoJson: any | null;
  lat?: number;
  lon?: number;
  zoom?: number;
  pins?: MapPin[];
  selectedPinId?: string | number;
  onPinClick?: (pin: MapPin) => void;
  selectedPoint?: [number, number] | null;
}

// API_URL removed

function ChangeView({ center, zoom, hasGeoJson }: { center: [number, number]; zoom: number; hasGeoJson: boolean }) {
  const map = useMap();
  const cLat = center[0];
  const cLon = center[1];
  useEffect(() => {
    if (!hasGeoJson && cLat && cLon) {
      map.setView([cLat, cLon], zoom);
    }
  }, [cLat, cLon, zoom, map, hasGeoJson]);
  return null;
}

function FitBounds({
  geoJson,
  selectedPoint,
}: {
  geoJson: any | null;
  selectedPoint?: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedPoint && selectedPoint[0] && selectedPoint[1]) {
      map.flyTo(selectedPoint, 14, { duration: 1.0 });
      return;
    }
    if (geoJson) {
      try {
        const layer = L.geoJSON(geoJson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const dLat = Math.abs(ne.lat - sw.lat);
          const dLng = Math.abs(ne.lng - sw.lng);
          if (dLat < 0.08 && dLng < 0.08) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          } else if (dLat < 0.35 && dLng < 0.35) {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
          } else {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
          }
        }
      } catch (e) {
        console.error("Error fitting bounds", e);
      }
    }
  }, [geoJson, selectedPoint, map]);
  return null;
}

function MapController({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds, zoom: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
    }
  });

  useEffect(() => {
    // Initial fetch
    onBoundsChange(map.getBounds(), map.getZoom());
  }, [map, onBoundsChange]);

  return null;
}

export default function Map({
  geoJson,
  lat,
  lon,
  zoom = 7,
  pins = [],
  selectedPinId,
  onPinClick,
  selectedPoint,
}: MapProps) {
  // Default to Maharashtra center
  const center: [number, number] = [lat || 19.7515, lon || 75.7139];
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('bhuvan');
  const fetchPins = useCallback(async () => {
    // Spatial bounds watcher
  }, []);

  const getMarkerColor = (status?: string) => {
    switch (status) {
      case "WEATHER_AVAILABLE": return "#10b981"; // Emerald
      case "WEATHER_UNAVAILABLE": return "#dc2626"; // Red
      case "GEOGRAPHY_UNAVAILABLE": return "#9ca3af"; // Gray
      case "GEOGRAPHY_REVIEW_REQUIRED": return "#ea580c"; // Orange
      case "WEATHER_CHECK_PENDING": return "#eab308"; // Yellow
      default: return "#059669"; // Deep Emerald
    }
  };

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 z-0 relative">
      <BasemapSelector activeBasemap={activeBasemap} onSelect={setActiveBasemap} />
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <ChangeView center={center} zoom={zoom} hasGeoJson={!!geoJson} />
        <FitBounds geoJson={geoJson} selectedPoint={selectedPoint} />
        <MapController onBoundsChange={fetchPins} />

        {/* Resilient base tile layer guarantees map is never a blank gray canvas */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {activeBasemap === 'bhuvan' && (
          <WMSTileLayer
            url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms"
            layers="india3"
            format="image/png"
            transparent={true}
            attribution='&copy; <a href="https://bhuvan.nrsc.gov.in">Bhuvan (ISRO)</a>'
          />
        )}
        {activeBasemap === 'google-street' && (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
          />
        )}
        {activeBasemap === 'google-satellite' && (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
          />
        )}
        {activeBasemap === 'esri-street' && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        )}
        {activeBasemap === 'esri-satellite' && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        )}
        {(activeBasemap === 'nic-street' || activeBasemap === 'nic-street-lite' || activeBasemap === 'google-street') && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        )}
        {(activeBasemap === 'nic-satellite' || activeBasemap === 'nic-imagery' || activeBasemap === 'drone-map' || activeBasemap === 'hybrid-drone' || activeBasemap === 'google-satellite') && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        )}
        {(activeBasemap === 'nic-terrain' || activeBasemap === 'land-use' || activeBasemap === 'india-aspiration') && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri &mdash; Topo & Terrain"
          />
        )}

        {geoJson && (
          <GeoJSON
            key={JSON.stringify(geoJson)}
            data={geoJson}
            style={(feature: any) => {
              const isGp = Boolean(feature?.properties?.gp_code);
              const isSelected = isGp && String(feature?.properties?.gp_code) === String(selectedPinId);
              if (isGp) {
                return {
                  color: isSelected ? '#047857' : '#059669',
                  weight: isSelected ? 3.5 : 2,
                  opacity: isSelected ? 1 : 0.85,
                  fillColor: isSelected ? '#10b981' : '#34d399',
                  fillOpacity: isSelected ? 0.35 : 0.15,
                };
              }
              return {
                color: '#047857',
                weight: 3.2,
                opacity: 0.95,
                fillColor: '#10b981',
                fillOpacity: 0.14,
              };
            }}
            onEachFeature={(feature: any, layer: any) => {
              const name = feature?.properties?.gp_name || feature?.properties?.B_Pan_Name || feature?.properties?.D_Pan_Name || feature?.properties?.STNAME;
              if (name) {
                layer.bindTooltip(name, {
                  permanent: false,
                  direction: 'top',
                });
              }
              if (feature?.properties?.gp_code && onPinClick) {
                layer.on('click', () => {
                  onPinClick({
                    id: String(feature.properties.gp_code),
                    name: feature.properties.gp_name,
                    lat: layer.getBounds().getCenter().lat,
                    lon: layer.getBounds().getCenter().lng,
                    type: "PANCHAYAT",
                    block_name: feature.properties.blklgdcode,
                  });
                });
              }
            }}
          />
        )}

        {pins.map((pin) => {
          const isSelected = String(pin.id) === String(selectedPinId);
          return pin.type === "DISTRICT" ? (
            <CircleMarker
              key={`d-${pin.id}`}
              center={[pin.lat, pin.lon]}
              radius={8}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup className="rounded-xl">
                <div className="p-1">
                  <h3 className="font-bold text-gray-900">{pin.name} District Panchayat</h3>
                  <p className="text-xs text-gray-500 mb-2">LGD Code: {pin.lgd_code}</p>
                  <div className="bg-blue-50 p-2 rounded text-sm text-blue-900">
                    <span className="font-semibold">{pin.panchayat_count}</span> Panchayats
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ) : (
            <CircleMarker
              key={`p-${pin.id}`}
              center={[pin.lat, pin.lon]}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? '#065f46' : '#ffffff',
                fillColor: isSelected ? '#047857' : getMarkerColor(pin.map_status),
                fillOpacity: 0.95,
                weight: isSelected ? 3 : 2
              }}
              eventHandlers={{
                click: () => onPinClick && onPinClick(pin),
              }}
            >
              <Popup className="rounded-xl">
                <div className="p-2 min-w-[190px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{pin.name}</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      GP
                    </span>
                  </div>
                  {pin.block_name && (
                    <p className="text-xs text-gray-500 mb-2">{pin.block_name} Block</p>
                  )}
                  {pin.temp !== undefined && (
                    <div className="bg-emerald-50 text-emerald-900 p-1.5 rounded-lg flex items-center justify-between text-xs font-semibold mb-2">
                      <span>Forecast</span>
                      <span className="font-bold">{pin.temp}°C</span>
                    </div>
                  )}
                  <button
                    onClick={() => onPinClick && onPinClick(pin)}
                    className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm"
                  >
                    View Downscaled Weather
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
