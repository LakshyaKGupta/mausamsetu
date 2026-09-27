import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMap,
  Circle,
  Tooltip,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Radio,
  Mountain,
  CloudRain,
  Wind,
  Droplets,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  X,
  Compass,
  Eye,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import type { PanchayatHierarchyItem, AdvisoryListItem } from '@/types'

// Fix Leaflet marker icons under Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Official Kalmeshwar Block Boundary Coordinates (Nagpur, Maharashtra)
export const KALMESHWAR_BLOCK_POLYGON: [number, number][] = [
  [21.345, 78.825], // NW near Mohpa ridge
  [21.362, 78.868], // North boundary with Saoner
  [21.350, 78.920], // North-East corner
  [21.315, 78.975], // East upper boundary near Adasa
  [21.275, 79.022], // East boundary near Nagpur Rural border
  [21.228, 79.015], // SE corner
  [21.185, 78.965], // South-East near Hingna border
  [21.165, 78.925], // South boundary
  [21.178, 78.865], // South-West corner
  [21.215, 78.805], // West lower boundary
  [21.265, 78.780], // West boundary towards Katol
  [21.305, 78.795], // NW lower slope
  [21.345, 78.825], // Closed loop
]

// Kalmeshwar Block Centroid
export const KALMESHWAR_CENTER: [number, number] = [21.248, 78.895]

// Microclimate Elevation Zones
const ELEVATION_ZONES = [
  {
    name: 'Valley Basin & River Plains (290m–310m)',
    elevation: '290m–310m',
    color: '#0284c7', // Sky blue
    fillColor: '#38bdf8',
    soil: 'Deep Black Cotton Soil (Regur)',
    risk: 'Water accumulation in low spots · High root moisture retention',
    polygon: [
      [21.168, 78.910],
      [21.190, 78.875],
      [21.240, 78.885],
      [21.255, 78.925],
      [21.230, 78.960],
      [21.185, 78.950],
    ] as [number, number][],
  },
  {
    name: 'Midland Agricultural Terraces (311m–335m)',
    elevation: '311m–335m',
    color: '#059669', // Emerald
    fillColor: '#34d399',
    soil: 'Medium Clay Loam',
    risk: 'Optimum drainage · Standard agro-met downscaling zone',
    polygon: [
      [21.230, 78.810],
      [21.275, 78.800],
      [21.315, 78.850],
      [21.305, 78.960],
      [21.265, 78.995],
      [21.220, 78.960],
      [21.235, 78.870],
    ] as [number, number][],
  },
  {
    name: 'Northern Ridge & Escarpment (336m–365m)',
    elevation: '336m–365m',
    color: '#7c3aed', // Purple/Violet
    fillColor: '#c084fc',
    soil: 'Gravelly Clay-Loam (Shallow Basaltic)',
    risk: 'High orographic windward shear · Fast surface runoff',
    polygon: [
      [21.305, 78.795],
      [21.345, 78.825],
      [21.362, 78.868],
      [21.350, 78.920],
      [21.315, 78.975],
      [21.300, 78.920],
      [21.305, 78.840],
    ] as [number, number][],
  },
]

// Automated Weather Stations (AWS) in Kalmeshwar Block
export interface AWSNode {
  id: string
  name: string
  lat: number
  lng: number
  elevation_m: number
  station_type: 'PRIMARY_IMD' | 'AGROMET_NODE' | 'RIDGE_SLOPE'
  temp_c: number
  humidity_pct: number
  wind_kmh: number
  wind_dir: string
  rainfall_24h_mm: number
  last_ping: string
  status: 'ONLINE' | 'CALIBRATING' | 'OFFLINE'
  coverage_radius_m: number
}

const AWS_STATIONS: AWSNode[] = [
  {
    id: 'AWS-104',
    name: 'AWS #104 Kalmeshwar Central',
    lat: 21.2353,
    lng: 78.8617,
    elevation_m: 328,
    station_type: 'PRIMARY_IMD',
    temp_c: 28.6,
    humidity_pct: 64,
    wind_kmh: 11.2,
    wind_dir: 'NW',
    rainfall_24h_mm: 0.0,
    last_ping: '3 mins ago',
    status: 'ONLINE',
    coverage_radius_m: 5500,
  },
  {
    id: 'AWS-105',
    name: 'AWS #105 Dhapewada West Node',
    lat: 21.2820,
    lng: 78.8950,
    elevation_m: 312,
    station_type: 'AGROMET_NODE',
    temp_c: 27.9,
    humidity_pct: 71,
    wind_kmh: 9.8,
    wind_dir: 'WNW',
    rainfall_24h_mm: 1.2,
    last_ping: '1 min ago',
    status: 'ONLINE',
    coverage_radius_m: 4800,
  },
  {
    id: 'AWS-106',
    name: 'AWS #106 Mohpa Ridge Sensor',
    lat: 21.3250,
    lng: 78.8180,
    elevation_m: 345,
    station_type: 'RIDGE_SLOPE',
    temp_c: 26.8,
    humidity_pct: 78,
    wind_kmh: 15.4,
    wind_dir: 'W',
    rainfall_24h_mm: 3.8,
    last_ping: 'Just now',
    status: 'ONLINE',
    coverage_radius_m: 4500,
  },
]

// 24 Master Gram Panchayats in Kalmeshwar Block
export interface MasterGP {
  id: number
  name: string
  lat: number
  lng: number
  elevation_m: number
  registered_farmers: number
  primary_crops: string[]
  telemetry_status: 'FRESH' | 'STALE' | 'OFFLINE'
  last_sync: string
  weather_status_text: string
  advisory_status: 'Pending' | 'Approved' | 'Sent'
  predicted_rainfall_mm: number
  temp_c: number
  advisory_id?: number
}

const KALMESHWAR_24_PANCHAYATS: MasterGP[] = [
  { id: 1, name: 'Dhapewada', lat: 21.282, lng: 78.895, elevation_m: 312, registered_farmers: 82, primary_crops: ['Soybean', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:30 AM', weather_status_text: '3.8 mm (Localized Rain)', advisory_status: 'Pending', predicted_rainfall_mm: 3.8, temp_c: 27.9 },
  { id: 2, name: 'Mohpa', lat: 21.325, lng: 78.818, elevation_m: 345, registered_farmers: 89, primary_crops: ['Cotton', 'Orange'], telemetry_status: 'FRESH', last_sync: '10:30 AM', weather_status_text: '4.5 mm (Ridge Rain)', advisory_status: 'Pending', predicted_rainfall_mm: 4.5, temp_c: 26.8 },
  { id: 3, name: 'Ubali', lat: 21.250, lng: 78.910, elevation_m: 308, registered_farmers: 96, primary_crops: ['Cotton', 'Wheat'], telemetry_status: 'FRESH', last_sync: '10:30 AM', weather_status_text: '0.2 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.2, temp_c: 28.5 },
  { id: 4, name: 'Kalmeshwar Rural', lat: 21.235, lng: 78.862, elevation_m: 320, registered_farmers: 103, primary_crops: ['Soybean', 'Gram'], telemetry_status: 'FRESH', last_sync: '10:30 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.6 },
  { id: 5, name: 'Bokhara', lat: 21.280, lng: 78.930, elevation_m: 330, registered_farmers: 110, primary_crops: ['Cotton', 'Citrus'], telemetry_status: 'FRESH', last_sync: '10:30 AM', weather_status_text: '1.4 mm (Scattered)', advisory_status: 'Approved', predicted_rainfall_mm: 1.4, temp_c: 27.8 },
  { id: 6, name: 'Ghoghali', lat: 21.240, lng: 78.910, elevation_m: 315, registered_farmers: 117, primary_crops: ['Soybean', 'Pulses'], telemetry_status: 'FRESH', last_sync: '10:30 AM', weather_status_text: '0.1 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.1, temp_c: 28.3 },
  { id: 7, name: 'Borgaon', lat: 21.310, lng: 78.880, elevation_m: 325, registered_farmers: 78, primary_crops: ['Soybean', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:25 AM', weather_status_text: '2.1 mm (Light Rain)', advisory_status: 'Approved', predicted_rainfall_mm: 2.1, temp_c: 27.6 },
  { id: 8, name: 'Amgaon', lat: 21.295, lng: 78.950, elevation_m: 318, registered_farmers: 85, primary_crops: ['Orange', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:25 AM', weather_status_text: '0.8 mm (Overcast)', advisory_status: 'Approved', predicted_rainfall_mm: 0.8, temp_c: 28.0 },
  { id: 9, name: 'Khadki', lat: 21.220, lng: 78.890, elevation_m: 310, registered_farmers: 91, primary_crops: ['Soybean', 'Wheat'], telemetry_status: 'FRESH', last_sync: '10:25 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.7 },
  { id: 10, name: 'Seloo', lat: 21.210, lng: 78.940, elevation_m: 305, registered_farmers: 84, primary_crops: ['Cotton', 'Soybean'], telemetry_status: 'FRESH', last_sync: '10:20 AM', weather_status_text: '0.0 mm (Sunny)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.8 },
  { id: 11, name: 'Veltur', lat: 21.265, lng: 78.845, elevation_m: 322, registered_farmers: 94, primary_crops: ['Pulses', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:20 AM', weather_status_text: '0.5 mm (Passing Cloud)', advisory_status: 'Approved', predicted_rainfall_mm: 0.5, temp_c: 28.1 },
  { id: 12, name: 'Kohali', lat: 21.330, lng: 78.855, elevation_m: 338, registered_farmers: 88, primary_crops: ['Soybean', 'Gram'], telemetry_status: 'FRESH', last_sync: '10:20 AM', weather_status_text: '3.2 mm (Ridge Rain)', advisory_status: 'Approved', predicted_rainfall_mm: 3.2, temp_c: 27.2 },
  { id: 13, name: 'Sawangi', lat: 21.260, lng: 78.965, elevation_m: 314, registered_farmers: 76, primary_crops: ['Cotton', 'Orange'], telemetry_status: 'FRESH', last_sync: '10:15 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.4 },
  { id: 14, name: 'Ghorpad', lat: 21.195, lng: 78.880, elevation_m: 302, registered_farmers: 82, primary_crops: ['Wheat', 'Gram'], telemetry_status: 'FRESH', last_sync: '10:15 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 29.0 },
  { id: 15, name: 'Pipla', lat: 21.215, lng: 78.980, elevation_m: 309, registered_farmers: 99, primary_crops: ['Soybean', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:15 AM', weather_status_text: '0.0 mm (Sunny)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.8 },
  { id: 16, name: 'Parsodi', lat: 21.340, lng: 78.890, elevation_m: 340, registered_farmers: 73, primary_crops: ['Orange', 'Pulses'], telemetry_status: 'FRESH', last_sync: '10:10 AM', weather_status_text: '2.8 mm (Ridge Showers)', advisory_status: 'Approved', predicted_rainfall_mm: 2.8, temp_c: 27.0 },
  { id: 17, name: 'Lonkhairi', lat: 21.270, lng: 79.005, elevation_m: 316, registered_farmers: 86, primary_crops: ['Soybean', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:10 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.3 },
  { id: 18, name: 'Brahmani', lat: 21.305, lng: 78.840, elevation_m: 332, registered_farmers: 92, primary_crops: ['Cotton', 'Soybean'], telemetry_status: 'FRESH', last_sync: '10:10 AM', weather_status_text: '2.4 mm (Showers)', advisory_status: 'Approved', predicted_rainfall_mm: 2.4, temp_c: 27.4 },
  { id: 19, name: 'Telgaon', lat: 21.185, lng: 78.920, elevation_m: 298, registered_farmers: 80, primary_crops: ['Wheat', 'Chickpea'], telemetry_status: 'FRESH', last_sync: '10:05 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 29.1 },
  { id: 20, name: 'Chicholi', lat: 21.315, lng: 78.930, elevation_m: 326, registered_farmers: 77, primary_crops: ['Soybean', 'Citrus'], telemetry_status: 'FRESH', last_sync: '10:05 AM', weather_status_text: '1.6 mm (Passing Rain)', advisory_status: 'Approved', predicted_rainfall_mm: 1.6, temp_c: 27.7 },
  { id: 21, name: 'Dahegaon', lat: 21.245, lng: 78.825, elevation_m: 315, registered_farmers: 85, primary_crops: ['Cotton', 'Pulses'], telemetry_status: 'FRESH', last_sync: '10:05 AM', weather_status_text: '0.3 mm (Overcast)', advisory_status: 'Approved', predicted_rainfall_mm: 0.3, temp_c: 28.2 },
  { id: 22, name: 'Wadhona', lat: 21.200, lng: 78.840, elevation_m: 308, registered_farmers: 90, primary_crops: ['Soybean', 'Wheat'], telemetry_status: 'FRESH', last_sync: '10:00 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 28.9 },
  { id: 23, name: 'Nimji', lat: 21.180, lng: 78.860, elevation_m: 295, registered_farmers: 81, primary_crops: ['Gram', 'Cotton'], telemetry_status: 'FRESH', last_sync: '10:00 AM', weather_status_text: '0.0 mm (Clear)', advisory_status: 'Approved', predicted_rainfall_mm: 0.0, temp_c: 29.2 },
  { id: 24, name: 'Adasa', lat: 21.310, lng: 78.970, elevation_m: 352, registered_farmers: 105, primary_crops: ['Orange', 'Soybean'], telemetry_status: 'FRESH', last_sync: '10:00 AM', weather_status_text: '1.9 mm (Hill Mist)', advisory_status: 'Approved', predicted_rainfall_mm: 1.9, temp_c: 26.9 },
]

// Helper to smoothly fly map to targets
function MapFlyController({
  target,
  zoom,
}: {
  target: [number, number] | null
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
    if (target && target[0] && target[1]) {
      map.flyTo(target, zoom, { duration: 1.2 })
    }
  }, [target, zoom, map])
  return null
}

export interface OfficerBlockMapProps {
  className?: string
  blockName?: string
  districtName?: string
  officerName?: string
  panchayats?: PanchayatHierarchyItem[]
  advisories?: AdvisoryListItem[]
  onSelectPanchayat?: (panchayat: PanchayatHierarchyItem) => void
  onReviewAdvisory?: (advisoryId: number) => void
}

export const OfficerBlockMap: React.FC<OfficerBlockMapProps> = ({
  className = '',
  blockName = 'Kalmeshwar',
  districtName = 'Nagpur',
  officerName = 'Rajesh Sharma',
  panchayats = [],
  advisories = [],
  onSelectPanchayat,
  onReviewAdvisory,
}) => {
  // Layer toggles
  const [showBoundary, setShowBoundary] = useState(true)
  const [showPanchayats, setShowPanchayats] = useState(true)
  const [showAWS, setShowAWS] = useState(true)
  const [showElevationZones, setShowElevationZones] = useState(true)
  const [showRainfallIsohyets, setShowRainfallIsohyets] = useState(true)

  // Map state
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [flyZoom, setFlyZoom] = useState<number>(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGP, setSelectedGP] = useState<MasterGP | null>(null)
  const [selectedAWS, setSelectedAWS] = useState<AWSNode | null>(null)
  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'esri' | 'nic-terrain' | 'satellite'>('osm')

  // Merge server-provided panchayats with master list
  const mergedPanchayats = useMemo(() => {
    return KALMESHWAR_24_PANCHAYATS.map((gp) => {
      const serverMatch = panchayats.find(
        (p) => p.name.toLowerCase() === gp.name.toLowerCase()
      )
      const matchingAdvisory = advisories.find(
        (a) =>
          a.panchayat_name?.toLowerCase() === gp.name.toLowerCase() ||
          a.panchayat_id === gp.id
      )

      return {
        ...gp,
        elevation_m: serverMatch?.elevation_m || gp.elevation_m,
        registered_farmers: serverMatch?.registered_farmers || gp.registered_farmers,
        telemetry_status: (serverMatch?.telemetry_status || gp.telemetry_status) as 'FRESH' | 'STALE' | 'OFFLINE',
        last_sync: serverMatch?.last_sync || gp.last_sync,
        weather_status_text: serverMatch?.weather_status_text || gp.weather_status_text,
        advisory_status: matchingAdvisory
          ? (matchingAdvisory.status === 'pending' ? 'Pending' : 'Approved')
          : gp.advisory_status,
        advisory_id: matchingAdvisory?.id,
      }
    })
  }, [panchayats, advisories])

  // Filtered GPs for search
  const filteredGPs = useMemo(() => {
    if (!searchQuery.trim()) return mergedPanchayats
    const q = searchQuery.toLowerCase()
    return mergedPanchayats.filter(
      (gp) =>
        gp.name.toLowerCase().includes(q) ||
        gp.primary_crops.some((c) => c.toLowerCase().includes(q))
    )
  }, [mergedPanchayats, searchQuery])

  // Handle GP click
  const handleSelectGP = (gp: MasterGP) => {
    setSelectedGP(gp)
    setSelectedAWS(null)
    setFlyTarget([gp.lat, gp.lng])
    setFlyZoom(14)

    if (onSelectPanchayat) {
      onSelectPanchayat({
        id: gp.id,
        name: gp.name,
        block: blockName,
        district: districtName,
        state: 'Maharashtra',
        elevation_m: gp.elevation_m,
        registered_farmers: gp.registered_farmers,
        primary_crops: gp.primary_crops,
        telemetry_status: gp.telemetry_status,
        last_sync: gp.last_sync,
        weather_status_text: gp.weather_status_text,
        advisory_status: gp.advisory_status,
      })
    }
  }

  // Handle AWS click
  const handleSelectAWS = (aws: AWSNode) => {
    setSelectedAWS(aws)
    setSelectedGP(null)
    setFlyTarget([aws.lat, aws.lng])
    setFlyZoom(14)
  }

  // Reset to full block view
  const handleResetView = () => {
    setSelectedGP(null)
    setSelectedAWS(null)
    setFlyTarget(KALMESHWAR_CENTER)
    setFlyZoom(12)
  }

  // Generate SVG custom div icon for Panchayats
  const createGPIcon = (gp: MasterGP, isSelected: boolean) => {
    const isPending = gp.advisory_status === 'Pending'
    const isFresh = gp.telemetry_status === 'FRESH'
    const bgColor = isSelected ? '#047857' : isPending ? '#d97706' : '#059669'
    const borderColor = isSelected ? '#34d399' : '#ffffff'

    return L.divIcon({
      className: 'custom-gp-pin',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="
            background: ${bgColor};
            color: white;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid ${borderColor};
            display: flex;
            align-items: center;
            gap: 4px;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.2s ease;
          ">
            <span style="width:7px; height:7px; border-radius:50%; background:${isFresh ? '#4ade80' : '#fbbf24'}; display:inline-block;"></span>
            <span>${gp.name}</span>
            <span style="opacity:0.75; font-size:9px; font-weight:500;">${gp.elevation_m}m</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${bgColor};
          "></div>
        </div>
      `,
      iconSize: [110, 36],
      iconAnchor: [55, 36],
      popupAnchor: [0, -38],
    })
  }

  // Generate SVG custom div icon for AWS Stations
  const createAWSIcon = (aws: AWSNode, isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-aws-pin',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="
            background: #1d4ed8;
            color: white;
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(29, 78, 216, 0.4);
            border: 2px solid ${isSelected ? '#93c5fd' : '#ffffff'};
            display: flex;
            align-items: center;
            gap: 4px;
            transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'};
          ">
            <span>📡</span>
            <span>${aws.name.split(' ')[1] || aws.id}</span>
            <span style="background: #3b82f6; padding: 1px 4px; border-radius: 4px; font-size: 9px;">${aws.temp_c}°C</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid #1d4ed8;
          "></div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [60, 36],
      popupAnchor: [0, -38],
    })
  }

  return (
    <div className={`relative w-full h-full flex flex-col bg-slate-900 overflow-hidden font-sans select-none ${className}`}>
      {/* TOP AGRO-MET METADATA & CONTROL BAR */}
      <div className="z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Block & Officer Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm md:text-base text-slate-100 tracking-tight">
                {blockName} Block Agro-Met Jurisdiction Map
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                LGD #5001 · Pilot Lead
              </span>
            </div>
            <p className="text-xs text-slate-400">
              District {districtName}, Maharashtra · Officer: <span className="text-slate-200 font-semibold">{officerName}</span> · 24 GPs Active
            </p>
          </div>
        </div>

        {/* Center: Search & Quick Jump */}
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search GP or crop (e.g. Dhapewada, Mohpa)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: Quick Stats & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Reset map view to entire Kalmeshwar block"
          >
            <Compass size={13} className="text-emerald-400" />
            <span>Fit Block</span>
          </button>

          {/* Basemap Switcher */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setActiveBasemap('osm')}
              className={`px-2 py-1 rounded transition-colors ${
                activeBasemap === 'osm'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Standard OSM
            </button>
            <button
              onClick={() => setActiveBasemap('esri')}
              className={`px-2 py-1 rounded transition-colors ${
                activeBasemap === 'esri'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ESRI Street
            </button>
            <button
              onClick={() => setActiveBasemap('nic-terrain')}
              className={`px-2 py-1 rounded transition-colors ${
                activeBasemap === 'nic-terrain'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              NIC Terrain
            </button>
            <button
              onClick={() => setActiveBasemap('satellite')}
              className={`px-2 py-1 rounded transition-colors ${
                activeBasemap === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY LAYER TOGGLE CHIPS STRIP */}
      <div className="z-10 bg-slate-900/90 backdrop-blur-xs border-b border-slate-800 px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
          <Layers size={12} /> Layers:
        </span>

        {/* Block Boundary Toggle */}
        <button
          onClick={() => setShowBoundary(!showBoundary)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            showBoundary
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
              : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60'
          }`}
        >
          <span className="w-2 h-2 rounded-sm bg-emerald-500 border border-white/50" />
          <span>Kalmeshwar Boundary</span>
        </button>

        {/* 24 Gram Panchayats Toggle */}
        <button
          onClick={() => setShowPanchayats(!showPanchayats)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            showPanchayats
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
              : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60'
          }`}
        >
          <MapPin size={12} className="text-emerald-400" />
          <span>24 Gram Panchayats ({mergedPanchayats.length})</span>
        </button>

        {/* AWS Stations Toggle */}
        <button
          onClick={() => setShowAWS(!showAWS)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            showAWS
              ? 'bg-blue-900/60 text-blue-300 border border-blue-500/50'
              : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60'
          }`}
        >
          <Radio size={12} className="text-blue-400" />
          <span>3 AWS Weather Stations</span>
        </button>

        {/* Elevation Topo Zones Toggle */}
        <button
          onClick={() => setShowElevationZones(!showElevationZones)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            showElevationZones
              ? 'bg-purple-900/60 text-purple-300 border border-purple-500/50'
              : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60'
          }`}
        >
          <Mountain size={12} className="text-purple-400" />
          <span>Elevation Zones (290m–365m)</span>
        </button>

        {/* Rainfall Isohyets Toggle */}
        <button
          onClick={() => setShowRainfallIsohyets(!showRainfallIsohyets)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            showRainfallIsohyets
              ? 'bg-sky-900/60 text-sky-300 border border-sky-500/50'
              : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60'
          }`}
        >
          <CloudRain size={12} className="text-sky-400" />
          <span>Localized Downscaled Rain</span>
        </button>
      </div>

      {/* MAIN SPATIAL MAP CONTAINER */}
      <div className="relative flex-1 w-full h-full min-h-[500px]">
        <MapContainer
          center={KALMESHWAR_CENTER}
          zoom={11}
          style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
          scrollWheelZoom={true}
        >
          {/* Basemap Tile Layer */}
          {activeBasemap === 'osm' && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
          )}
          {activeBasemap === 'esri' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
            />
          )}
          {activeBasemap === 'nic-terrain' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Topographic Terrain & Relief'
            />
          )}
          {activeBasemap === 'satellite' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          )}

          {/* Dynamic Fly Controller */}
          <MapFlyController target={flyTarget} zoom={flyZoom} />

          {/* 1. KALMESHWAR BLOCK BOUNDARY POLYGON */}
          {showBoundary && (
            <>
              {/* Outer boundary buffer shadow */}
              <Polygon
                positions={KALMESHWAR_BLOCK_POLYGON}
                pathOptions={{
                  color: '#064e3b',
                  weight: 8,
                  opacity: 0.35,
                  fill: false,
                }}
              />
              {/* Primary sharp boundary line */}
              <Polygon
                positions={KALMESHWAR_BLOCK_POLYGON}
                pathOptions={{
                  color: '#059669', // Emerald 600
                  weight: 3.5,
                  dashArray: '8, 6',
                  opacity: 0.95,
                  fillColor: '#10b981',
                  fillOpacity: 0.08,
                }}
              >
                <Tooltip sticky direction="top" className="custom-block-tooltip">
                  <div className="font-bold text-xs text-emerald-950">
                    🏛️ Kalmeshwar Block Boundary (LGD: 5001)
                    <div className="text-[10px] text-slate-600 font-normal">
                      Area: 412 km² · 24 Gram Panchayats · Nagpur District
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            </>
          )}

          {/* 2. MICROCLIMATE ELEVATION ZONES */}
          {showElevationZones &&
            ELEVATION_ZONES.map((zone, idx) => (
              <Polygon
                key={idx}
                positions={zone.polygon}
                pathOptions={{
                  color: zone.color,
                  weight: 1.5,
                  dashArray: '4, 4',
                  opacity: 0.7,
                  fillColor: zone.fillColor,
                  fillOpacity: 0.12,
                }}
              >
                <Popup>
                  <div className="p-1 max-w-xs">
                    <strong className="text-xs font-bold text-slate-900 block" style={{ color: zone.color }}>
                      ⛰️ {zone.name}
                    </strong>
                    <div className="text-[11px] text-slate-700 mt-1">
                      <span className="font-semibold">SRTM Elevation:</span> {zone.elevation}
                    </div>
                    <div className="text-[11px] text-slate-700 mt-0.5">
                      <span className="font-semibold">Soil Profile:</span> {zone.soil}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 p-1 bg-slate-50 rounded border border-slate-100">
                      ℹ️ {zone.risk}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

          {/* 3. AWS WEATHER STATIONS */}
          {showAWS &&
            AWS_STATIONS.map((aws) => {
              const isSelected = selectedAWS?.id === aws.id
              return (
                <React.Fragment key={aws.id}>
                  {/* Coverage radar range circle */}
                  <Circle
                    center={[aws.lat, aws.lng]}
                    radius={aws.coverage_radius_m}
                    pathOptions={{
                      color: '#2563eb',
                      weight: 1,
                      dashArray: '3, 6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.04,
                    }}
                  />

                  {/* Marker Pin */}
                  <Marker
                    position={[aws.lat, aws.lng]}
                    icon={createAWSIcon(aws, isSelected)}
                    eventHandlers={{
                      click: () => handleSelectAWS(aws),
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[210px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <strong className="text-xs font-bold text-blue-700">📡 {aws.name}</strong>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            {aws.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] text-slate-700">
                          <div><span className="text-slate-400">Elevation:</span> <strong>{aws.elevation_m}m</strong></div>
                          <div><span className="text-slate-400">Temp:</span> <strong>{aws.temp_c}°C</strong></div>
                          <div><span className="text-slate-400">Humidity:</span> <strong>{aws.humidity_pct}%</strong></div>
                          <div><span className="text-slate-400">Wind:</span> <strong>{aws.wind_kmh} km/h {aws.wind_dir}</strong></div>
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                          <span>Rain: <strong>{aws.rainfall_24h_mm} mm</strong></span>
                          <span>Synced: {aws.last_ping}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              )
            })}

          {/* 4. GRAM PANCHAYAT MARKERS (ALL 24) */}
          {showPanchayats &&
            filteredGPs.map((gp) => {
              const isSelected = selectedGP?.id === gp.id
              const hasRain = gp.predicted_rainfall_mm > 0.5

              return (
                <React.Fragment key={gp.id}>
                  {/* Rain orographic bubble if rainfall expected */}
                  {showRainfallIsohyets && hasRain && (
                    <Circle
                      center={[gp.lat, gp.lng]}
                      radius={1100}
                      pathOptions={{
                        color: '#0284c7',
                        weight: 1,
                        fillColor: '#38bdf8',
                        fillOpacity: 0.15,
                      }}
                    />
                  )}

                  {/* Marker Pin */}
                  <Marker
                    position={[gp.lat, gp.lng]}
                    icon={createGPIcon(gp, isSelected)}
                    eventHandlers={{
                      click: () => handleSelectGP(gp),
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[230px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">{gp.name} GP</strong>
                            <span className="text-[10px] text-slate-500">Kalmeshwar Block · LGD #{gp.id}</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              gp.advisory_status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {gp.advisory_status === 'Pending' ? 'Review Required' : 'Approved'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] text-slate-700">
                          <div><span className="text-slate-400">Elevation:</span> <strong>{gp.elevation_m}m</strong></div>
                          <div><span className="text-slate-400">Farmers:</span> <strong>{gp.registered_farmers}</strong></div>
                          <div className="col-span-2"><span className="text-slate-400">Crops:</span> <strong>{gp.primary_crops.join(', ')}</strong></div>
                          <div className="col-span-2"><span className="text-slate-400">Downscaled Rain:</span> <strong className="text-emerald-700">{gp.weather_status_text}</strong></div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() => handleSelectGP(gp)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2 rounded cursor-pointer text-center"
                          >
                            Inspect Microclimate
                          </button>
                          {gp.advisory_status === 'Pending' && gp.advisory_id && onReviewAdvisory && (
                            <button
                              onClick={() => onReviewAdvisory(gp.advisory_id!)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] py-1 px-2 rounded cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              )
            })}
        </MapContainer>

        {/* MAP FLOATING LEGEND (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-white text-xs shadow-xl max-w-xs hidden sm:block pointer-events-auto">
          <div className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>🗺️ Map Legend</span>
            <span className="text-[10px] text-emerald-400 font-semibold">{filteredGPs.length}/24 GPs</span>
          </div>

          <div className="mt-2 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 border-t-2 border-dashed border-emerald-500 inline-block" />
              <span className="text-slate-300">Kalmeshwar Block Boundary (LGD: 5001)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white inline-block" />
              <span className="text-slate-300">Verified & Published Advisory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white inline-block" />
              <span className="text-slate-300">Advisory Awaiting Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 border border-white inline-block" />
              <span className="text-slate-300">AWS Weather Station (Real-Time Node)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400/25 border border-sky-400 inline-block" />
              <span className="text-slate-300">Downscaled Rainfall Zone (&gt;0.5 mm)</span>
            </div>
          </div>
        </div>

        {/* FLOATING DETAIL INSPECTOR DRAWER (Right Side when GP or AWS selected) */}
        {(selectedGP || selectedAWS) && (
          <div className="absolute top-4 right-4 z-[1000] w-80 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white animate-in slide-in-from-right-4 duration-200 pointer-events-auto">
            {/* Header */}
            <div className="p-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedGP ? '🏛️' : '📡'}</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    {selectedGP ? `${selectedGP.name} Gram Panchayat` : selectedAWS?.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {selectedGP
                      ? `Kalmeshwar Block · Elevation: ${selectedGP.elevation_m}m`
                      : `Automated Weather Station · ${selectedAWS?.elevation_m}m`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedGP(null)
                  setSelectedAWS(null)
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content for GP */}
            {selectedGP && (
              <div className="p-4 space-y-3 text-xs">
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedGP.advisory_status === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {selectedGP.advisory_status === 'Pending' ? '⚠️ Advisory Pending Review' : '✅ Advisory Published'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    🟢 Telemetry Fresh
                  </span>
                </div>

                {/* Microclimate Telemetry Grid */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/50 pb-1">
                    <CloudRain size={12} className="text-emerald-400" />
                    <span>Downscaled Microclimate</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Predicted Rain</span>
                      <strong className="text-emerald-400 font-bold text-sm">
                        {selectedGP.predicted_rainfall_mm.toFixed(1)} mm
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Adjusted Temp</span>
                      <strong className="text-slate-100 font-bold text-sm">{selectedGP.temp_c}°C</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SRTM Elevation</span>
                      <strong className="text-slate-200">{selectedGP.elevation_m} meters</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lapse Rate Adj.</span>
                      <strong className="text-slate-300">-0.65°C / 100m</strong>
                    </div>
                  </div>
                </div>

                {/* Agricultural Details */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Primary Crops:</span>
                    <strong className="text-slate-200">{selectedGP.primary_crops.join(', ')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Farmers:</span>
                    <strong className="text-slate-200">{selectedGP.registered_farmers} farmers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Weather Station Node:</span>
                    <span className="text-blue-400 font-semibold">AWS #104 Kalmeshwar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telemetry Last Sync:</span>
                    <span className="text-slate-400 font-mono">{selectedGP.last_sync}</span>
                  </div>
                </div>

                {/* Review Advisory CTA if pending */}
                {selectedGP.advisory_status === 'Pending' && selectedGP.advisory_id && onReviewAdvisory && (
                  <button
                    onClick={() => onReviewAdvisory(selectedGP.advisory_id!)}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Verify Advisory for {selectedGP.name}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Content for AWS */}
            {selectedAWS && (
              <div className="p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    🟢 Station {selectedAWS.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedAWS.station_type}
                  </span>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/50 pb-1">
                    <Radio size={12} className="text-blue-400" />
                    <span>Real-Time Sensor Feeds</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Air Temperature</span>
                      <strong className="text-white text-sm">{selectedAWS.temp_c}°C</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Relative Humidity</span>
                      <strong className="text-white text-sm">{selectedAWS.humidity_pct}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Wind Velocity</span>
                      <strong className="text-white text-sm">{selectedAWS.wind_kmh} km/h {selectedAWS.wind_dir}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">24h Cumulative Rain</span>
                      <strong className="text-blue-400 text-sm">{selectedAWS.rainfall_24h_mm} mm</strong>
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 text-[11px] space-y-1">
                  <div>Coverage Radius: <strong className="text-slate-200">{(selectedAWS.coverage_radius_m / 1000).toFixed(1)} km</strong></div>
                  <div>Elevation: <strong className="text-slate-200">{selectedAWS.elevation_m}m MSL</strong></div>
                  <div>Transmission Protocol: <strong className="text-slate-200">MQTT over 4G Cellular</strong></div>
                  <div>Last Telemetry Packet: <strong className="text-slate-200">{selectedAWS.last_ping}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OfficerBlockMap
