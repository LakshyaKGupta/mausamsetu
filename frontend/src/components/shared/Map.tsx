import { useEffect, useState, useCallback } from "react";
import { MapContainer, useMap, GeoJSON, Popup, useMapEvents, CircleMarker, WMSTileLayer, LayersControl, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BasemapSelector, BasemapType } from "./BasemapSelector";

// Fix leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoJson: any | null;
  lat?: number;
  lon?: number;
  zoom?: number;
}

interface MapPin {
  id: number;
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
}

// API_URL removed

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FitBounds({ geoJson }: { geoJson: any | null }) {
  const map = useMap();
  useEffect(() => {
    if (geoJson) {
      try {
        const layer = L.geoJSON(geoJson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
        }
      } catch (e) {
        console.error("Error fitting bounds", e);
      }
    }
  }, [geoJson, map]);
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

export default function Map({ geoJson, lat, lon, zoom = 7 }: MapProps) {
  // Default to Maharashtra center
  const center: [number, number] = [lat || 19.7515, lon || 75.7139];
  const [pins, setPins] = useState<MapPin[]>([]);
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('bhuvan');
  const fetchPins = useCallback(async () => {
    // Intentionally removed bbox fetching of all panchayats/districts
    // to prevent displaying locations from other states overlapping the view.
    setPins(prev => prev.length === 0 ? prev : []);
  }, []);

  const getMarkerColor = (status?: string) => {
    switch (status) {
      case "WEATHER_AVAILABLE": return "#16a34a"; // Green
      case "WEATHER_UNAVAILABLE": return "#dc2626"; // Red
      case "GEOGRAPHY_UNAVAILABLE": return "#9ca3af"; // Gray
      case "GEOGRAPHY_REVIEW_REQUIRED": return "#ea580c"; // Orange
      case "WEATHER_CHECK_PENDING": return "#eab308"; // Yellow
      default: return "#3b82f6"; // Blue
    }
  };

  // Bounding box for India
  const indiaBounds: L.LatLngBoundsExpression = [
    [6.5, 68.0], // South-West (approx)
    [35.5, 97.5] // North-East (approx)
  ];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 z-0 relative">
      <BasemapSelector activeBasemap={activeBasemap} onSelect={setActiveBasemap} />
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <ChangeView center={center} zoom={zoom} />
        <FitBounds geoJson={geoJson} />
        <MapController onBoundsChange={fetchPins} />

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
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        )}

        {geoJson && (
          <GeoJSON
            key={JSON.stringify(geoJson)}
            data={geoJson}
            style={{ color: '#4f46e5', weight: 3, fillColor: '#4f46e5', fillOpacity: 0.2 }}
          />
        )}

        {pins.map((pin) => (
          pin.type === "DISTRICT" ? (
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
              radius={6}
              pathOptions={{
                color: '#ffffff',
                fillColor: getMarkerColor(pin.map_status),
                fillOpacity: 0.9,
                weight: 1
              }}
            >
              <Popup className="rounded-xl">
                <div className="p-1 max-w-[200px]">
                  <h3 className="font-bold text-gray-900 leading-tight">{pin.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{pin.block_name} Block Panchayat</p>

                  <div className="space-y-1 mt-2 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-500">Geography</span>
                      <span className="font-semibold ml-2 text-right">{pin.geometry_status?.replace("GEOGRAPHY_", "").replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-500">Weather</span>
                      <span className="font-semibold ml-2 text-right">{pin.weather_status?.replace("WEATHER_", "").replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
