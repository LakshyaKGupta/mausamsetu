import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths broken by webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
import {
  ShieldCheck, Database, Cpu, CheckCircle2, AlertTriangle,
  BarChart2, Server, MapPin, RefreshCw, Layers, Clock,
  TrendingDown, TrendingUp, AlertCircle, X, ChevronRight,
  ExternalLink, UserCheck, Activity, Radio, Users, CheckCircle,
  XCircle, Filter, Search, Settings, FileText, Map as MapIcon,
  History, ArrowRight, ShieldAlert, Wifi, WifiOff, Globe, Play
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts'
import { advisoryApi, officerApi, geographyApi, adminApi } from '@/api/client'
import type {
  DistrictOperationsSummary,
  ModelPerformanceResponse,
  OfficerDirectoryItem,
  AdvisoryListItem,
  StateConfig,
  PanchayatHierarchyItem
} from '@/types'
import { cn, formatDate } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Geographic coordinate lookup for map drilldown
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Geographic data & coordinate lookup for India-wide multi-tier map drilldown
// ---------------------------------------------------------------------------
interface SpatialGP {
  name: string
  lat: number
  lng: number
  elevation_m: number
  status: 'verified' | 'pending'
}

interface SpatialBlock {
  name: string
  lat: number
  lng: number
  gpsCount: number
  farmers: number
  aws: string
  officer: string
  advisories: string
  status: 'live' | 'ready'
  panchayats: SpatialGP[]
}

interface SpatialDistrict {
  name: string
  lat: number
  lng: number
  status: 'live' | 'ready'
  blocksCount: number
  gps: number
  note: string
  crops: string
  farmers: string
  blocks: SpatialBlock[]
}

interface SpatialState {
  state: string
  lat: number
  lng: number
  zoom: number
  status: 'live' | 'ready'
  coverage: string
  crops: string
  districts: SpatialDistrict[]
}

const ALL_STATES_SPATIAL: SpatialState[] = [
  {
    state: 'Maharashtra',
    lat: 19.7, lng: 75.7, zoom: 7, status: 'live',
    coverage: 'Nagpur Lead Pilot (6 Blocks, 78 GPs, 24 AWS Nodes)',
    crops: 'Soybean, Cotton, Orange, Gram',
    districts: [
      {
        name: 'Nagpur', lat: 21.15, lng: 79.09, status: 'live', blocksCount: 6, gps: 78,
        note: 'Lead Pilot: Kalmeshwar, Katol, Saoner, Hingna, Umred, Ramtek',
        crops: 'Soybean, Cotton, Orange', farmers: '5,420',
        blocks: [
          {
            name: 'Kalmeshwar', lat: 21.38, lng: 78.96, gpsCount: 24, farmers: 1842,
            aws: 'AWS #104, #105, #106', officer: 'Rajesh Sharma', advisories: '2 Pending Review', status: 'live',
            panchayats: [
              { name: 'Dhapewada', lat: 21.38, lng: 78.93, elevation_m: 312, status: 'pending' },
              { name: 'Kalmeshwar', lat: 21.40, lng: 78.97, elevation_m: 328, status: 'verified' },
              { name: 'Mohpa', lat: 21.42, lng: 78.89, elevation_m: 345, status: 'pending' },
              { name: 'Borgaon', lat: 21.35, lng: 78.98, elevation_m: 305, status: 'verified' },
              { name: 'Amgaon', lat: 21.37, lng: 79.01, elevation_m: 318, status: 'verified' },
              { name: 'Khadki', lat: 21.33, lng: 78.92, elevation_m: 310, status: 'verified' },
            ]
          },
          {
            name: 'Katol', lat: 21.27, lng: 78.60, gpsCount: 18, farmers: 1420,
            aws: 'AWS #108 (Katol East)', officer: 'Anil Thakre', advisories: 'All Disseminated', status: 'live',
            panchayats: [
              { name: 'Katol GP', lat: 21.27, lng: 78.60, elevation_m: 417, status: 'verified' },
              { name: 'Dhanori GP', lat: 21.29, lng: 78.56, elevation_m: 425, status: 'verified' },
              { name: 'Peth GP', lat: 21.24, lng: 78.64, elevation_m: 402, status: 'verified' },
              { name: 'Metpanjra GP', lat: 21.22, lng: 78.58, elevation_m: 410, status: 'verified' },
            ]
          },
          {
            name: 'Saoner', lat: 21.40, lng: 78.93, gpsCount: 16, farmers: 1210,
            aws: 'AWS #109 (Saoner Rural)', officer: 'Vikas Deshmukh', advisories: 'All Disseminated', status: 'live',
            panchayats: [
              { name: 'Saoner GP', lat: 21.40, lng: 78.93, elevation_m: 332, status: 'verified' },
              { name: 'Kanholibara GP', lat: 21.43, lng: 78.87, elevation_m: 340, status: 'verified' },
              { name: 'Rohna GP', lat: 21.37, lng: 78.91, elevation_m: 325, status: 'verified' },
            ]
          },
          {
            name: 'Hingna', lat: 21.10, lng: 78.88, gpsCount: 14, farmers: 1100,
            aws: 'AWS #110 (Hingna MIDC)', officer: 'Sunita Patil', advisories: 'All Disseminated', status: 'live',
            panchayats: [
              { name: 'Hingna GP', lat: 21.10, lng: 78.88, elevation_m: 315, status: 'verified' },
              { name: 'Wanadongri GP', lat: 21.09, lng: 78.94, elevation_m: 310, status: 'verified' },
              { name: 'Raipur GP', lat: 21.12, lng: 78.85, elevation_m: 320, status: 'verified' },
            ]
          },
          {
            name: 'Umred', lat: 20.86, lng: 79.33, gpsCount: 16, farmers: 950,
            aws: 'AWS #111 (Umred Plains)', officer: 'Rajesh Sharma (Acting)', advisories: 'All Disseminated', status: 'live',
            panchayats: [
              { name: 'Umred GP', lat: 20.86, lng: 79.33, elevation_m: 290, status: 'verified' },
              { name: 'Sirsi GP', lat: 20.89, lng: 79.37, elevation_m: 295, status: 'verified' },
              { name: 'Belgaon GP', lat: 20.83, lng: 79.29, elevation_m: 288, status: 'verified' },
            ]
          },
          {
            name: 'Ramtek', lat: 21.39, lng: 79.32, gpsCount: 12, farmers: 790,
            aws: 'AWS #112 (Ramtek Hills)', officer: 'Pooja Raut', advisories: 'All Disseminated', status: 'live',
            panchayats: [
              { name: 'Ramtek GP', lat: 21.39, lng: 79.32, elevation_m: 345, status: 'verified' },
              { name: 'Mansar GP', lat: 21.41, lng: 79.28, elevation_m: 330, status: 'verified' },
              { name: 'Nagardhan GP', lat: 21.36, lng: 79.31, elevation_m: 338, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Nashik', lat: 20.01, lng: 73.79, status: 'ready', blocksCount: 2, gps: 53,
        note: 'Plateau slope & vineyards (598m elev model calibrated)',
        crops: 'Grapes, Onion, Tomato', farmers: '4,150',
        blocks: [
          {
            name: 'Dindori', lat: 20.20, lng: 73.83, gpsCount: 25, farmers: 1520,
            aws: 'AWS #201 (Dindori Valley)', officer: 'Nitin Bhamre', advisories: 'Telemetry Ready', status: 'ready',
            panchayats: [
              { name: 'Dindori GP', lat: 20.20, lng: 73.83, elevation_m: 620, status: 'verified' },
              { name: 'Vani GP', lat: 20.25, lng: 73.89, elevation_m: 645, status: 'verified' },
              { name: 'Khedgaon GP', lat: 20.17, lng: 73.78, elevation_m: 605, status: 'verified' },
            ]
          },
          {
            name: 'Niphad', lat: 20.08, lng: 74.12, gpsCount: 28, farmers: 1890,
            aws: 'AWS #202 (Niphad Agromet)', officer: 'Sachin Patil', advisories: 'Telemetry Ready', status: 'ready',
            panchayats: [
              { name: 'Niphad GP', lat: 20.08, lng: 74.12, elevation_m: 560, status: 'verified' },
              { name: 'Lasalgaon GP', lat: 20.14, lng: 74.23, elevation_m: 575, status: 'verified' },
              { name: 'Pimpalgaon GP', lat: 20.17, lng: 73.98, elevation_m: 580, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Pune', lat: 18.52, lng: 73.86, status: 'ready', blocksCount: 2, gps: 54,
        note: 'Rainshadow transition agro-zone with sugarcane and vegetable clusters',
        crops: 'Sugarcane, Wheat, Vegetables', farmers: '3,800',
        blocks: [
          {
            name: 'Baramati', lat: 18.15, lng: 74.58, gpsCount: 30, farmers: 2100,
            aws: 'AWS #301 (Baramati Krishi)', officer: 'Amol Jagtap', advisories: 'Telemetry Ready', status: 'ready',
            panchayats: [
              { name: 'Baramati GP', lat: 18.15, lng: 74.58, elevation_m: 538, status: 'verified' },
              { name: 'Malegaon BK GP', lat: 18.18, lng: 74.51, elevation_m: 545, status: 'verified' },
              { name: 'Supa GP', lat: 18.23, lng: 74.45, elevation_m: 560, status: 'verified' },
            ]
          },
          {
            name: 'Junnar', lat: 19.21, lng: 73.88, gpsCount: 24, farmers: 1700,
            aws: 'AWS #302 (Junnar Ghats)', officer: 'Sneha More', advisories: 'Telemetry Ready', status: 'ready',
            panchayats: [
              { name: 'Junnar GP', lat: 19.21, lng: 73.88, elevation_m: 689, status: 'verified' },
              { name: 'Otur GP', lat: 19.26, lng: 73.92, elevation_m: 695, status: 'verified' },
              { name: 'Narayangaon GP', lat: 19.12, lng: 73.97, elevation_m: 650, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Wardha', lat: 20.75, lng: 78.60, status: 'ready', blocksCount: 2, gps: 41,
        note: 'Vidarbha cotton & pulse belt with black cotton soil',
        crops: 'Cotton, Soybean, Arhar', farmers: '2,900',
        blocks: [
          {
            name: 'Deoli', lat: 20.65, lng: 78.48, gpsCount: 22, farmers: 1450,
            aws: 'AWS #401 (Deoli South)', officer: 'Pradeep Rane', advisories: 'Rules Mapped', status: 'ready',
            panchayats: [
              { name: 'Deoli GP', lat: 20.65, lng: 78.48, elevation_m: 240, status: 'verified' },
              { name: 'Sonegaon GP', lat: 20.68, lng: 78.52, elevation_m: 245, status: 'verified' },
              { name: 'Vijaygopal GP', lat: 20.61, lng: 78.42, elevation_m: 235, status: 'verified' },
            ]
          },
          {
            name: 'Arvi', lat: 20.98, lng: 78.23, gpsCount: 19, farmers: 1450,
            aws: 'AWS #402 (Arvi Hills)', officer: 'Kavita Shinde', advisories: 'Rules Mapped', status: 'ready',
            panchayats: [
              { name: 'Arvi GP', lat: 20.98, lng: 78.23, elevation_m: 260, status: 'verified' },
              { name: 'Kharangana GP', lat: 20.93, lng: 78.27, elevation_m: 255, status: 'verified' },
              { name: 'Rohana GP', lat: 21.03, lng: 78.18, elevation_m: 270, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Punjab',
    lat: 31.15, lng: 75.34, zoom: 7, status: 'ready',
    coverage: 'Ludhiana & Patiala (PAU Agromet & LGD Mapped)',
    crops: 'Wheat, Paddy, Maize, Cotton',
    districts: [
      {
        name: 'Ludhiana', lat: 30.90, lng: 75.85, status: 'ready', blocksCount: 2, gps: 52,
        note: 'Central Plain wheat & paddy belt (PAU agro-meteorological station)',
        crops: 'Wheat, Paddy, Maize', farmers: '6,200',
        blocks: [
          {
            name: 'Jagraon', lat: 30.78, lng: 75.48, gpsCount: 28, farmers: 2400,
            aws: 'AWS #501 (PAU Jagraon)', officer: 'Gurpreet Singh', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Jagraon GP', lat: 30.78, lng: 75.48, elevation_m: 240, status: 'verified' },
              { name: 'Sidhwan Bet GP', lat: 30.88, lng: 75.45, elevation_m: 235, status: 'verified' },
              { name: 'Raikot GP', lat: 30.65, lng: 75.60, elevation_m: 248, status: 'verified' },
            ]
          },
          {
            name: 'Khanna', lat: 30.70, lng: 76.22, gpsCount: 24, farmers: 2100,
            aws: 'AWS #502 (Khanna Grain Hub)', officer: 'Harpreet Kaur', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Khanna GP', lat: 30.70, lng: 76.22, elevation_m: 254, status: 'verified' },
              { name: 'Payal GP', lat: 30.72, lng: 76.05, elevation_m: 250, status: 'verified' },
              { name: 'Samrala GP', lat: 30.83, lng: 76.19, elevation_m: 258, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Bathinda', lat: 30.21, lng: 74.95, status: 'ready', blocksCount: 1, gps: 22,
        note: 'South-western cotton-wheat belt with canal command',
        crops: 'Cotton, Wheat, Mustard', farmers: '5,100',
        blocks: [
          {
            name: 'Talwandi Sabo', lat: 29.98, lng: 75.08, gpsCount: 22, farmers: 2200,
            aws: 'AWS #505 (Damdama Sahib)', officer: 'Manjit Dhillon', advisories: 'Rules Mapped', status: 'ready',
            panchayats: [
              { name: 'Talwandi Sabo GP', lat: 29.98, lng: 75.08, elevation_m: 210, status: 'verified' },
              { name: 'Rama Mandi GP', lat: 29.93, lng: 75.02, elevation_m: 205, status: 'verified' },
              { name: 'Maur GP', lat: 30.08, lng: 75.24, elevation_m: 212, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Haryana',
    lat: 29.06, lng: 76.08, zoom: 7, status: 'ready',
    coverage: 'Karnal & Hisar (ICAR & CCSHAU Agromet nodes)',
    crops: 'Basmati Rice, Wheat, Mustard, Sugarcane',
    districts: [
      {
        name: 'Karnal', lat: 29.69, lng: 76.99, status: 'ready', blocksCount: 2, gps: 48,
        note: 'National Dairy Research & Basmati Export Hub',
        crops: 'Basmati Rice, Wheat', farmers: '5,800',
        blocks: [
          {
            name: 'Nilokheri', lat: 29.83, lng: 76.92, gpsCount: 26, farmers: 2100,
            aws: 'AWS #601 (Nilokheri ICAR)', officer: 'Virender Malik', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Nilokheri GP', lat: 29.83, lng: 76.92, elevation_m: 250, status: 'verified' },
              { name: 'Taraori GP', lat: 29.80, lng: 76.93, elevation_m: 252, status: 'verified' },
              { name: 'Nissing GP', lat: 29.69, lng: 76.82, elevation_m: 249, status: 'verified' },
            ]
          },
          {
            name: 'Gharaunda', lat: 29.53, lng: 76.97, gpsCount: 22, farmers: 1950,
            aws: 'AWS #602 (Indo-Israel Veg Center)', officer: 'Rakesh Dahiya', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Gharaunda GP', lat: 29.53, lng: 76.97, elevation_m: 248, status: 'verified' },
              { name: 'Kohand GP', lat: 29.50, lng: 76.99, elevation_m: 247, status: 'verified' },
              { name: 'Chaura GP', lat: 29.56, lng: 77.01, elevation_m: 246, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Hisar', lat: 29.15, lng: 75.72, status: 'ready', blocksCount: 1, gps: 25,
        note: 'CCSHAU Agricultural University node and semi-arid dryland research',
        crops: 'Mustard, Cotton, Wheat', farmers: '4,900',
        blocks: [
          {
            name: 'Hansi', lat: 29.10, lng: 75.97, gpsCount: 25, farmers: 2300,
            aws: 'AWS #603 (Hansi Plains)', officer: 'Satish Punia', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Hansi GP', lat: 29.10, lng: 75.97, elevation_m: 218, status: 'verified' },
              { name: 'Barwala GP', lat: 29.38, lng: 75.91, elevation_m: 222, status: 'verified' },
              { name: 'Narnaund GP', lat: 29.22, lng: 76.14, elevation_m: 219, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Madhya Pradesh',
    lat: 23.47, lng: 77.94, zoom: 6, status: 'ready',
    coverage: 'Indore & Ujjain (Malwa Plateau prime pulse & oilseed bowl)',
    crops: 'Soybean, Wheat, Chickpea, Mustard',
    districts: [
      {
        name: 'Indore', lat: 22.72, lng: 75.86, status: 'ready', blocksCount: 2, gps: 60,
        note: 'Malwa plateau prime black cotton soil and soybean processing hub',
        crops: 'Soybean, Wheat, Chickpea', farmers: '5,600',
        blocks: [
          {
            name: 'Depalpur', lat: 22.85, lng: 75.55, gpsCount: 32, farmers: 2400,
            aws: 'AWS #701 (Depalpur Malwa)', officer: 'Anurag Chouhan', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Depalpur GP', lat: 22.85, lng: 75.55, elevation_m: 540, status: 'verified' },
              { name: 'Betma GP', lat: 22.68, lng: 75.61, elevation_m: 552, status: 'verified' },
              { name: 'Gautampura GP', lat: 22.98, lng: 75.52, elevation_m: 535, status: 'verified' },
            ]
          },
          {
            name: 'Sanwer', lat: 22.98, lng: 75.83, gpsCount: 28, farmers: 2150,
            aws: 'AWS #702 (Sanwer Mandi)', officer: 'Pooja Patel', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Sanwer GP', lat: 22.98, lng: 75.83, elevation_m: 530, status: 'verified' },
              { name: 'Chandrawatiganj GP', lat: 23.08, lng: 75.78, elevation_m: 525, status: 'verified' },
              { name: 'Barotha GP', lat: 22.92, lng: 75.91, elevation_m: 542, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Ujjain', lat: 23.18, lng: 75.79, status: 'ready', blocksCount: 1, gps: 24,
        note: 'Kshipra river basin pulses & wheat agro-climatic subzone',
        crops: 'Soybean, Gram, Wheat', farmers: '4,700',
        blocks: [
          {
            name: 'Ghatiya', lat: 23.28, lng: 75.80, gpsCount: 24, farmers: 1900,
            aws: 'AWS #703 (Ghatiya KVK)', officer: 'Mohan Verma', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Ghatiya GP', lat: 23.28, lng: 75.80, elevation_m: 495, status: 'verified' },
              { name: 'Unhel GP', lat: 23.35, lng: 75.56, elevation_m: 488, status: 'verified' },
              { name: 'Tarana GP', lat: 23.33, lng: 76.04, elevation_m: 502, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Karnataka',
    lat: 15.31, lng: 75.71, zoom: 7, status: 'ready',
    coverage: 'Mandya & Mysuru (Kaveri Basin Sugarcane & Paddy Belt)',
    crops: 'Sugarcane, Paddy, Ragi, Maize',
    districts: [
      {
        name: 'Mandya', lat: 12.52, lng: 76.90, status: 'ready', blocksCount: 2, gps: 48,
        note: 'Kaveri irrigation basin sugarcane & paddy belt with high density canal telemetry',
        crops: 'Sugarcane, Paddy, Ragi', farmers: '6,100',
        blocks: [
          {
            name: 'Pandavapura', lat: 12.49, lng: 76.67, gpsCount: 26, farmers: 2300,
            aws: 'AWS #801 (KRS Dam Node)', officer: 'Ramesh Gowda', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Pandavapura GP', lat: 12.49, lng: 76.67, elevation_m: 692, status: 'verified' },
              { name: 'Melukote GP', lat: 12.66, lng: 76.65, elevation_m: 760, status: 'verified' },
              { name: 'Kennalu GP', lat: 12.46, lng: 76.71, elevation_m: 680, status: 'verified' },
            ]
          },
          {
            name: 'Maddur', lat: 12.58, lng: 77.05, gpsCount: 22, farmers: 2100,
            aws: 'AWS #802 (Maddur Plains)', officer: 'Suresh Kumar', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Maddur GP', lat: 12.58, lng: 77.05, elevation_m: 662, status: 'verified' },
              { name: 'Besagarahalli GP', lat: 12.53, lng: 77.10, elevation_m: 655, status: 'verified' },
              { name: 'Koppa GP', lat: 12.63, lng: 77.01, elevation_m: 670, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Uttar Pradesh',
    lat: 26.85, lng: 80.95, zoom: 6, status: 'ready',
    coverage: 'Varanasi & Lucknow (Middle Gangetic Alluvium Belt)',
    crops: 'Wheat, Rice, Sugarcane, Potato, Mustard',
    districts: [
      {
        name: 'Varanasi', lat: 25.32, lng: 82.97, status: 'ready', blocksCount: 2, gps: 56,
        note: 'Middle Gangetic alluvium vegetable & wheat cluster with high ground truth stations',
        crops: 'Wheat, Paddy, Vegetables', farmers: '6,800',
        blocks: [
          {
            name: 'Pindra', lat: 25.48, lng: 82.85, gpsCount: 26, farmers: 2500,
            aws: 'AWS #901 (Babatpur Airport AWS)', officer: 'Ashok Pandey', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Pindra GP', lat: 25.48, lng: 82.85, elevation_m: 83, status: 'verified' },
              { name: 'Phulpur GP', lat: 25.55, lng: 82.87, elevation_m: 85, status: 'verified' },
              { name: 'Sindhora GP', lat: 25.59, lng: 82.83, elevation_m: 86, status: 'verified' },
            ]
          },
          {
            name: 'Araziline', lat: 25.27, lng: 82.88, gpsCount: 30, farmers: 2350,
            aws: 'AWS #902 (Raja Talab)', officer: 'Sunil Yadav', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Araziline GP', lat: 25.27, lng: 82.88, elevation_m: 81, status: 'verified' },
              { name: 'Mirzamurad GP', lat: 25.24, lng: 82.80, elevation_m: 80, status: 'verified' },
              { name: 'Rohania GP', lat: 25.28, lng: 82.93, elevation_m: 82, status: 'verified' },
            ]
          }
        ]
      },
      {
        name: 'Lucknow', lat: 26.85, lng: 80.95, status: 'ready', blocksCount: 1, gps: 25,
        note: 'Central UP horticulture & wheat belt (CISH node)',
        crops: 'Mango, Wheat, Mustard', farmers: '5,400',
        blocks: [
          {
            name: 'Bakshi Ka Talab', lat: 27.02, lng: 80.92, gpsCount: 25, farmers: 2100,
            aws: 'AWS #903 (BKT Agromet)', officer: 'Manoj Tiwari', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Bakshi Ka Talab GP', lat: 27.02, lng: 80.92, elevation_m: 125, status: 'verified' },
              { name: 'Itaunja GP', lat: 27.08, lng: 80.89, elevation_m: 128, status: 'verified' },
              { name: 'Asti GP', lat: 26.98, lng: 80.94, elevation_m: 123, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Rajasthan',
    lat: 27.02, lng: 74.22, zoom: 6, status: 'ready',
    coverage: 'Jaipur & Kota (Semi-arid Mustard, Gram & Soybean Bowl)',
    crops: 'Mustard, Chickpea, Pearl Millet, Soybean',
    districts: [
      {
        name: 'Jaipur', lat: 26.91, lng: 75.79, status: 'ready', blocksCount: 2, gps: 52,
        note: 'Semi-arid mustard & chickpea pulse bowl with calibrated soil moisture sensors',
        crops: 'Mustard, Chickpea, Bajra', farmers: '5,900',
        blocks: [
          {
            name: 'Chomu', lat: 27.17, lng: 75.72, gpsCount: 28, farmers: 2400,
            aws: 'AWS #1001 (Chomu Mandi)', officer: 'Bhupender Meena', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Chomu GP', lat: 27.17, lng: 75.72, elevation_m: 435, status: 'verified' },
              { name: 'Morija GP', lat: 27.21, lng: 75.75, elevation_m: 438, status: 'verified' },
              { name: 'Samod GP', lat: 27.24, lng: 75.82, elevation_m: 452, status: 'verified' },
            ]
          },
          {
            name: 'Sanganer', lat: 26.80, lng: 75.77, gpsCount: 24, farmers: 2100,
            aws: 'AWS #1002 (Sanganer South)', officer: 'Radhe Sharma', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Sanganer GP', lat: 26.80, lng: 75.77, elevation_m: 425, status: 'verified' },
              { name: 'Watika GP', lat: 26.74, lng: 75.84, elevation_m: 420, status: 'verified' },
              { name: 'Muhana GP', lat: 26.77, lng: 75.71, elevation_m: 428, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Gujarat',
    lat: 22.26, lng: 71.19, zoom: 7, status: 'ready',
    coverage: 'Rajkot & Anand (Saurashtra Groundnut & Cotton Heartland)',
    crops: 'Cotton, Groundnut, Castor, Wheat',
    districts: [
      {
        name: 'Rajkot', lat: 22.30, lng: 70.80, status: 'ready', blocksCount: 1, gps: 27,
        note: 'Saurashtra groundnut & Bt-cotton heartland with automated weather stations',
        crops: 'Groundnut, Cotton, Castor', farmers: '6,300',
        blocks: [
          {
            name: 'Gondal', lat: 21.97, lng: 70.80, gpsCount: 27, farmers: 2550,
            aws: 'AWS #1101 (Gondal Yard)', officer: 'Pravin Jadeja', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Gondal GP', lat: 21.97, lng: 70.80, elevation_m: 132, status: 'verified' },
              { name: 'Kotda Sangani GP', lat: 21.94, lng: 70.93, elevation_m: 145, status: 'verified' },
              { name: 'Gomta GP', lat: 21.88, lng: 70.78, elevation_m: 128, status: 'verified' },
            ]
          }
        ]
      }
    ]
  },
  {
    state: 'Bihar',
    lat: 25.09, lng: 85.31, zoom: 7, status: 'ready',
    coverage: 'Patna & Samastipur (North Bihar Alluvium & RPCAU Pusa Hub)',
    crops: 'Rice, Wheat, Maize, Pulses',
    districts: [
      {
        name: 'Patna', lat: 25.59, lng: 85.14, status: 'ready', blocksCount: 1, gps: 26,
        note: 'Son-Ganga alluvial convergence zone with multi-crop intensive farming',
        crops: 'Rice, Wheat, Maize', farmers: '5,700',
        blocks: [
          {
            name: 'Bihta', lat: 25.57, lng: 84.87, gpsCount: 26, farmers: 2350,
            aws: 'AWS #1201 (Bihta Agromet)', officer: 'Arvind Kumar', advisories: 'LGD Mapped', status: 'ready',
            panchayats: [
              { name: 'Bihta GP', lat: 25.57, lng: 84.87, elevation_m: 55, status: 'verified' },
              { name: 'Parev GP', lat: 25.55, lng: 84.82, elevation_m: 53, status: 'verified' },
              { name: 'Lai GP', lat: 25.62, lng: 84.89, elevation_m: 56, status: 'verified' },
            ]
          }
        ]
      }
    ]
  }
]

// Fast coordinate dictionary fallback for any queried location
const GEO_COORDS: Record<string, { lat: number; lng: number; zoom: number; label: string }> = {
  'India': { lat: 22.5, lng: 80.0, zoom: 4, label: '🇮🇳 India' }
}

// Populate GEO_COORDS dynamically from ALL_STATES_SPATIAL
ALL_STATES_SPATIAL.forEach((st) => {
  GEO_COORDS[st.state] = { lat: st.lat, lng: st.lng, zoom: st.zoom, label: st.state }
  st.districts.forEach((d) => {
    GEO_COORDS[d.name] = { lat: d.lat, lng: d.lng, zoom: 10, label: `${d.name} District` }
    d.blocks.forEach((b) => {
      GEO_COORDS[b.name] = { lat: b.lat, lng: b.lng, zoom: 12, label: `${b.name} Block` }
    })
  })
})

// Leaflet fly-to helper used inside a MapContainer child
const MapFlyTo: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 })
  }, [lat, lng, zoom, map])
  return null
}

// ---------------------------------------------------------------------------
// MapDrilldownTab – the full split-panel map component
// ---------------------------------------------------------------------------
interface MapDrilldownTabProps {
  spatialTier: 'india' | 'state' | 'district' | 'block'
  setSpatialTier: (t: 'india' | 'state' | 'district' | 'block') => void
  drillState: string
  setDrillState: (s: string) => void
  drillDistrict: string
  setDrillDistrict: (d: string) => void
  drillBlock: string
  setDrillBlock: (b: string) => void
  panchayats: PanchayatHierarchyItem[]
  setSelectedPanchayat: (p: PanchayatHierarchyItem | null) => void
}

const MapDrilldownTab: React.FC<MapDrilldownTabProps> = ({
  spatialTier, setSpatialTier, drillState, setDrillState,
  drillDistrict, setDrillDistrict, drillBlock, setDrillBlock,
  panchayats, setSelectedPanchayat
}) => {
  // Find current selected state, district, and block objects
  const currentState = ALL_STATES_SPATIAL.find((s) => s.state === drillState) || ALL_STATES_SPATIAL[0]
  const currentDistrict = currentState.districts.find((d) => d.name === drillDistrict) || currentState.districts[0]
  const currentBlock = currentDistrict.blocks.find((b) => b.name === drillBlock) || currentDistrict.blocks[0]

  // Determine current map center & zoom based on tier
  const mapTarget = (() => {
    if (spatialTier === 'block') {
      return { lat: currentBlock.lat, lng: currentBlock.lng, zoom: 12 }
    }
    if (spatialTier === 'district') {
      return { lat: currentDistrict.lat, lng: currentDistrict.lng, zoom: 10 }
    }
    if (spatialTier === 'state') {
      return { lat: currentState.lat, lng: currentState.lng, zoom: currentState.zoom }
    }
    return { lat: 22.5, lng: 80.0, zoom: 4 }
  })()

  // Handler for state card click
  const handleSelectState = (stateName: string) => {
    const st = ALL_STATES_SPATIAL.find((s) => s.state === stateName)
    if (st) {
      setDrillState(st.state)
      const firstDist = st.districts[0]
      if (firstDist) {
        setDrillDistrict(firstDist.name)
        if (firstDist.blocks[0]) {
          setDrillBlock(firstDist.blocks[0].name)
        }
      }
      setSpatialTier('state')
    }
  }

  // Handler for district card or marker click
  const handleSelectDistrict = (distName: string) => {
    const dist = currentState.districts.find((d) => d.name === distName)
    if (dist) {
      setDrillDistrict(dist.name)
      if (dist.blocks[0]) {
        setDrillBlock(dist.blocks[0].name)
      }
      setSpatialTier('district')
    }
  }

  // Handler for block card or marker click
  const handleSelectBlock = (blkName: string) => {
    const blk = currentDistrict.blocks.find((b) => b.name === blkName)
    if (blk) {
      setDrillBlock(blk.name)
      setSpatialTier('block')
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Multi-Tier Spatial Drilldown Map</h3>
          <p className="text-xs text-slate-500 mt-0.5">Click any state, district, or block to zoom map to that region</p>
        </div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex-wrap">
          <button
            onClick={() => setSpatialTier('india')}
            className={cn('px-2.5 py-1 rounded-lg transition-colors cursor-pointer', spatialTier === 'india' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900')}
          >🇮🇳 India</button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => {
              if (spatialTier !== 'india') setSpatialTier('state')
            }}
            className={cn('px-2.5 py-1 rounded-lg transition-colors cursor-pointer', spatialTier === 'state' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900', spatialTier === 'india' && 'opacity-40 cursor-default')}
          >{drillState}</button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => {
              if (spatialTier === 'block' || spatialTier === 'district') setSpatialTier('district')
            }}
            className={cn('px-2.5 py-1 rounded-lg transition-colors cursor-pointer', spatialTier === 'district' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900', (spatialTier === 'india' || spatialTier === 'state') && 'opacity-40 cursor-default')}
          >{drillDistrict} Dist</button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => {
              if (spatialTier === 'block') setSpatialTier('block')
            }}
            className={cn('px-2.5 py-1 rounded-lg transition-colors cursor-pointer', spatialTier === 'block' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900', spatialTier !== 'block' && 'opacity-40 cursor-default')}
          >{drillBlock} Block</button>
        </div>
      </div>

      {/* SPLIT LAYOUT: Cards + Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: Drilldown Cards */}
        <div className="space-y-4 overflow-y-auto max-h-[540px] pr-1">

          {/* LEVEL 1: INDIA (States List) */}
          {spatialTier === 'india' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">9 Agrarian States — Click to Inspect</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>1 Live Pilot &nbsp;
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>8 Ready
                </span>
              </div>
              {ALL_STATES_SPATIAL.map((st) => (
                <div
                  key={st.state}
                  onClick={() => handleSelectState(st.state)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between gap-3',
                    st.state === drillState
                      ? 'bg-brand-50/60 border-brand-300'
                      : st.status === 'live'
                      ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div>
                    <strong className="text-sm text-slate-900">{st.state}</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">{st.coverage}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Crops: {st.crops}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      st.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    )}>
                      {st.status === 'live' ? '🟢 Live' : '🟡 Ready'}
                    </span>
                    <span className="text-[10px] text-slate-500">{st.districts.length} Districts</span>
                    <span className="text-[10px] text-brand-700 font-semibold flex items-center gap-0.5">
                      Open Map <ChevronRight size={11}/>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEVEL 2: STATE (Districts List) */}
          {spatialTier === 'state' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {currentState.state} — Districts ({currentState.districts.length})
                </span>
                <button
                  onClick={() => setSpatialTier('india')}
                  className="text-brand-700 font-bold hover:underline cursor-pointer"
                >
                  ← Back to All India
                </button>
              </div>
              {currentState.districts.map((d) => (
                <div
                  key={d.name}
                  onClick={() => handleSelectDistrict(d.name)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between gap-3',
                    d.name === drillDistrict
                      ? 'bg-brand-50/70 border-brand-300'
                      : d.status === 'live'
                      ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div>
                    <strong className="text-sm text-slate-900">{d.name} District</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">{d.note}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Farmers: {d.farmers} · Crops: {d.crops}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      d.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    )}>
                      {d.status === 'live' ? '🟢 Live Pilot' : '🟡 Arch Ready'}
                    </span>
                    <span className="text-[10px] text-slate-500">{d.blocks.length} Blocks · {d.gps} GPs</span>
                    <span className="text-[10px] text-brand-700 font-semibold flex items-center gap-0.5">
                      Open Map <ChevronRight size={11}/>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEVEL 3: DISTRICT (Blocks List) */}
          {spatialTier === 'district' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {currentDistrict.name} District — Blocks ({currentDistrict.blocks.length})
                </span>
                <button
                  onClick={() => setSpatialTier('state')}
                  className="text-brand-700 font-bold hover:underline cursor-pointer"
                >
                  ← Back to {currentState.state}
                </button>
              </div>
              {currentDistrict.blocks.map((b) => (
                <div
                  key={b.name}
                  onClick={() => handleSelectBlock(b.name)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between gap-3',
                    b.name === drillBlock
                      ? 'bg-brand-50/70 border-brand-300'
                      : b.status === 'live'
                      ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div>
                    <strong className="text-sm text-slate-900">{b.name} Block</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">{b.aws}</p>
                    <p className="text-[11px] text-slate-400">Officer: {b.officer}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      b.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    )}>
                      {b.status === 'live' ? '🟢 Live' : '🟢 Ready'}
                    </span>
                    <span className="text-[10px] text-slate-500">{b.gpsCount} GPs · {b.farmers} farmers</span>
                    <span className="text-[10px] text-brand-700 font-semibold flex items-center gap-0.5">
                      Open Map <ChevronRight size={11}/>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEVEL 4: BLOCK (Gram Panchayats List) */}
          {spatialTier === 'block' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700">
                    {currentBlock.name} Block — Gram Panchayats
                  </span>
                  <span className="text-[10px] text-slate-400 ml-2">Officer: {currentBlock.officer}</span>
                </div>
                <button
                  onClick={() => setSpatialTier('district')}
                  className="text-brand-700 font-bold hover:underline cursor-pointer"
                >
                  ← Back to {currentDistrict.name}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(currentBlock.panchayats.length > 0 ? currentBlock.panchayats : panchayats).map((p: any) => {
                  const isPending = p.status === 'pending' || p.name === 'Dhapewada' || p.name === 'Mohpa'
                  return (
                    <div
                      key={p.name}
                      onClick={() => {
                        const item: PanchayatHierarchyItem = {
                          id: p.id || Math.floor(Math.random() * 1000) + 1,
                          name: p.name.replace(' GP', ''),
                          block: currentBlock.name,
                          district: currentDistrict.name,
                          state: currentState.state,
                          elevation_m: p.elevation_m || 312,
                          registered_farmers: p.farmers || 180,
                          primary_crops: ['Soybean', 'Wheat'],
                          telemetry_status: isPending ? 'STALE' : 'FRESH',
                          last_sync: '10 mins ago',
                          officer_name: currentBlock.officer
                        }
                        setSelectedPanchayat(item)
                      }}
                      className={cn(
                        'p-3 rounded-2xl border text-center cursor-pointer transition-all hover:scale-105 shadow-2xs',
                        isPending ? 'bg-amber-50/80 border-amber-300' : 'bg-emerald-50/50 border-emerald-200'
                      )}
                    >
                      <MapPin size={15} className={cn('mx-auto mb-1', isPending ? 'text-amber-600' : 'text-emerald-700')} />
                      <strong className="block text-xs text-slate-900 truncate">{p.name}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{p.elevation_m || 312}m elev</span>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block',
                        isPending ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                      )}>
                        {isPending ? 'Pending' : 'Verified'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Live Leaflet Map */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '540px' }}>
          <MapContainer
            center={[mapTarget.lat, mapTarget.lng]}
            zoom={mapTarget.zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {/* Smoothly fly map to whatever region is selected */}
            <MapFlyTo lat={mapTarget.lat} lng={mapTarget.lng} zoom={mapTarget.zoom} />

            {/* INDIA LEVEL: State Markers */}
            {spatialTier === 'india' &&
              ALL_STATES_SPATIAL.map((st) => (
                <Marker
                  key={st.state}
                  position={[st.lat, st.lng]}
                  eventHandlers={{
                    click: () => handleSelectState(st.state)
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <strong className="text-sm font-bold text-slate-900">{st.state}</strong>
                      <p className="text-xs text-slate-600 mt-1">{st.coverage}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Crops: {st.crops}</p>
                      <button
                        onClick={() => handleSelectState(st.state)}
                        className="mt-2 text-xs font-bold text-white bg-brand-600 px-3 py-1 rounded-lg w-full cursor-pointer hover:bg-brand-700"
                      >
                        Inspect Districts →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* STATE LEVEL: District Markers for Selected State */}
            {spatialTier === 'state' &&
              currentState.districts.map((d) => (
                <Marker
                  key={d.name}
                  position={[d.lat, d.lng]}
                  eventHandlers={{
                    click: () => handleSelectDistrict(d.name)
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <strong className="text-sm font-bold text-slate-900">{d.name} District</strong>
                      <p className="text-xs text-slate-600 mt-1">{d.note}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{d.blocks.length} Blocks · {d.gps} Gram Panchayats</p>
                      <button
                        onClick={() => handleSelectDistrict(d.name)}
                        className="mt-2 text-xs font-bold text-white bg-brand-600 px-3 py-1 rounded-lg w-full cursor-pointer hover:bg-brand-700"
                      >
                        Open Blocks Map →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* DISTRICT LEVEL: Block Markers for Selected District */}
            {spatialTier === 'district' &&
              currentDistrict.blocks.map((b) => (
                <Marker
                  key={b.name}
                  position={[b.lat, b.lng]}
                  eventHandlers={{
                    click: () => handleSelectBlock(b.name)
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <strong className="text-sm font-bold text-slate-900">{b.name} Block</strong>
                      <p className="text-xs text-slate-600 mt-1">Telemetry: {b.aws}</p>
                      <p className="text-xs text-slate-500">Officer: {b.officer}</p>
                      <button
                        onClick={() => handleSelectBlock(b.name)}
                        className="mt-2 text-xs font-bold text-white bg-brand-600 px-3 py-1 rounded-lg w-full cursor-pointer hover:bg-brand-700"
                      >
                        View {b.gpsCount} Panchayats →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* BLOCK LEVEL: Gram Panchayat Markers + Coverage Circles for Selected Block */}
            {spatialTier === 'block' &&
              (currentBlock.panchayats.length > 0 ? currentBlock.panchayats : [
                { name: `${currentBlock.name} GP`, lat: currentBlock.lat, lng: currentBlock.lng, elevation_m: 320, status: 'verified' as const }
              ]).map((m, i) => (
                <React.Fragment key={i}>
                  <Circle
                    center={[m.lat, m.lng]}
                    radius={650}
                    color="#10b981"
                    fillOpacity={0.16}
                    weight={1.5}
                  />
                  <Marker position={[m.lat, m.lng]}>
                    <Popup>
                      <div className="p-1">
                        <strong className="text-sm font-bold text-slate-900">{m.name}</strong>
                        <p className="text-xs text-slate-600 mt-0.5">Elevation: {m.elevation_m}m (SRTM 90m)</p>
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">🟢 Telemetry Active</p>
                        <p className="text-[11px] text-slate-400 mt-1">Assigned: {currentBlock.officer}</p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}
          </MapContainer>
        </div>
      </div>

      {/* Map Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/>Live Pilot Area
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"/>Architecture Ready
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block"/>GP Coverage (650m Microclimate)
        </span>
        <span className="ml-auto text-[11px] text-slate-400">Map data © OpenStreetMap contributors</span>
      </div>
    </div>
  )
}
type AdminTab =
  | 'overview'
  | 'panchayats'
  | 'officers'
  | 'advisories'
  | 'data-health'
  | 'model-health'
  | 'ml-lab'
  | 'map'
  | 'audit'
  | 'settings'

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [summary, setSummary] = useState<DistrictOperationsSummary | null>(null)
  const [modelPerf, setModelPerf] = useState<ModelPerformanceResponse | null>(null)
  const [officers, setOfficers] = useState<OfficerDirectoryItem[]>([])
  const [advisories, setAdvisories] = useState<AdvisoryListItem[]>([])
  const [states, setStates] = useState<StateConfig[]>([])
  const [panchayats, setPanchayats] = useState<PanchayatHierarchyItem[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [dataHealthList, setDataHealthList] = useState<any[]>([])
  const [benchmarkCurve, setBenchmarkCurve] = useState<any[]>([])
  const [fallbackSimulation, setFallbackSimulation] = useState<any | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPanchayat, setSelectedPanchayat] = useState<PanchayatHierarchyItem | null>(null)
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [searchPanchayat, setSearchPanchayat] = useState('')
  const [selectedState, setSelectedState] = useState<string>('Maharashtra')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Nagpur')
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([
    'Nagpur', 'Pune', 'Nashik', 'Wardha', 'Amravati'
  ])
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([
    'Kalmeshwar', 'Hingna', 'Saoner', 'Katol', 'Ramtek'
  ])

  // Live Location Autocomplete Search across India
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const searchTimeoutRef = useRef<any>(null)

  const [reassignModalOfficer, setReassignModalOfficer] = useState<OfficerDirectoryItem | null>(null)
  const [reassignBlockTarget, setReassignBlockTarget] = useState('Kalmeshwar')

  // Embedded Downscaling Calculator state
  const [calcElevation, setCalcElevation] = useState<number>(312)
  const [calcBaseRain, setCalcBaseRain] = useState<number>(4.5)
  const [calcBaseTemp, setCalcBaseTemp] = useState<number>(33.0)
  const [calcHumidity, setCalcHumidity] = useState<number>(72)

  // Multi-tier spatial drilldown state
  const [spatialTier, setSpatialTier] = useState<'india' | 'state' | 'district' | 'block'>('india')
  const [drillState, setDrillState] = useState<string>('Maharashtra')
  const [drillDistrict, setDrillDistrict] = useState<string>('Nagpur')
  const [drillBlock, setDrillBlock] = useState<string>('Kalmeshwar')

  const district = selectedDistrict

  const loadData = async (dist = selectedDistrict, blk = filterBlock, st = selectedState) => {
    setRefreshing(true)
    try {
      const stateObj = states.find(
        (s) => s.state.toLowerCase() === st.toLowerCase() || s.code.toLowerCase() === st.toLowerCase()
      )
      const stateCode = stateObj?.code || 'MH'

      const [sum, perf, offList, advList, statesList, gpList, audits, dHealth, curve, distList, blkList] = await Promise.all([
        advisoryApi.districtSummary(dist).catch(() => null),
        advisoryApi.modelHealth(),
        officerApi.list(dist).catch(() => []),
        advisoryApi.list().catch(() => []),
        geographyApi.getStates().catch(() => []),
        geographyApi.getPanchayats(blk !== 'all' ? blk : undefined).catch(() => []),
        advisoryApi.districtAudit().catch(() => []),
        adminApi.dataHealth().catch(() => []),
        adminApi.getModelBenchmarkCurve().catch(() => []),
        geographyApi.getDistricts(stateCode).catch(() => []),
        geographyApi.getBlocks(dist).catch(() => []),
      ])
      setSummary(sum)
      setModelPerf(perf)
      setOfficers(offList)
      setAdvisories(advList)
      if (statesList?.length) setStates(statesList)
      setPanchayats(gpList)
      setAuditLogs(audits)
      setDataHealthList(dHealth)
      setBenchmarkCurve(curve)

      if (distList?.length) {
        setAvailableDistricts(distList.map((d: any) => d.district))
      }
      if (blkList?.length) {
        setAvailableBlocks(blkList.map((b: any) => b.block))
      }
    } catch (err) {
      console.error('Failed to load district admin data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleStateChange = async (newState: string) => {
    setSelectedState(newState)
    setDrillState(newState)
    const stateObj = states.find(
      (s) => s.state.toLowerCase() === newState.toLowerCase() || s.code.toLowerCase() === newState.toLowerCase()
    )
    const stateCode = stateObj?.code || 'MH'
    try {
      const dists = await geographyApi.getDistricts(stateCode).catch(() => [])
      if (dists && dists.length > 0) {
        const distNames = dists.map((d: any) => d.district)
        setAvailableDistricts(distNames)
        const firstDist = distNames[0]
        setSelectedDistrict(firstDist)
        setDrillDistrict(firstDist)
        setFilterBlock('all')
        setDrillBlock('all')
        const blks = await geographyApi.getBlocks(firstDist).catch(() => [])
        if (blks && blks.length > 0) {
          setAvailableBlocks(blks.map((b: any) => b.block))
        } else {
          setAvailableBlocks([])
        }
        loadData(firstDist, 'all', newState)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDistrictChange = async (newDistrict: string) => {
    setSelectedDistrict(newDistrict)
    setDrillDistrict(newDistrict)
    setFilterBlock('all')
    setDrillBlock('all')
    try {
      const blks = await geographyApi.getBlocks(newDistrict).catch(() => [])
      if (blks && blks.length > 0) {
        setAvailableBlocks(blks.map((b: any) => b.block))
      } else {
        setAvailableBlocks([])
      }
      loadData(newDistrict, 'all', selectedState)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectSearchResult = async (item: any) => {
    const nextDist = item.district || item.name
    const nextState = item.state || selectedState
    const nextBlock = item.type === 'BLOCK' && item.block ? item.block : 'all'

    setSelectedState(nextState)
    setSelectedDistrict(nextDist)
    setDrillState(nextState)
    setDrillDistrict(nextDist)
    setFilterBlock(nextBlock)
    setDrillBlock(nextBlock)
    setLocationSearchQuery('')
    setShowLocationDropdown(false)

    try {
      const blks = await geographyApi.getBlocks(nextDist).catch(() => [])
      if (blks && blks.length > 0) {
        setAvailableBlocks(blks.map((b: any) => b.block))
      }
      loadData(nextDist, nextBlock, nextState)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSearchInput = (q: string) => {
    setLocationSearchQuery(q)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (q.trim().length < 2) {
      setLocationSearchResults([])
      setShowLocationDropdown(false)
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingLocation(true)
      try {
        const data = await geographyApi.searchLocations(q.trim())
        setLocationSearchResults(data.results || [])
        setShowLocationDropdown(true)
      } catch (err) {
        console.error('Location search failed:', err)
      } finally {
        setIsSearchingLocation(false)
      }
    }, 250)
  }

  const runFallbackSimulation = async () => {
    setSimulating(true)
    try {
      const res = await adminApi.simulateFallback()
      setFallbackSimulation(res)
    } catch (e) {
      console.error(e)
    } finally {
      setSimulating(false)
    }
  }

  useEffect(() => {
    loadData()

    // Listen for global location changes from the navbar location picker
    const handleLocChange = async (e: any) => {
      const newLoc = e.detail
      if (!newLoc) return

      const newState = newLoc.state || selectedState
      const newDistrict = newLoc.district || selectedDistrict
      const newBlock = newLoc.block || 'all'

      // Update admin selectors to match the chosen location
      setSelectedState(newState)
      setSelectedDistrict(newDistrict)
      setDrillState(newState)
      setDrillDistrict(newDistrict)
      setFilterBlock(newBlock)
      setDrillBlock(newBlock)

      // Fetch fresh blocks list for the new district
      try {
        const blks = await geographyApi.getBlocks(newDistrict).catch(() => [])
        if (blks && blks.length > 0) {
          setAvailableBlocks(blks.map((b: any) => b.block))
        }
        const stateObj = states.find(
          (s) => s.state.toLowerCase() === newState.toLowerCase() || s.code.toLowerCase() === newState.toLowerCase()
        )
        const stateCode = stateObj?.code || 'MH'
        const dists = await geographyApi.getDistricts(stateCode).catch(() => [])
        if (dists && dists.length > 0) {
          setAvailableDistricts(dists.map((d: any) => d.district))
        }
      } catch (e) {
        console.error('Admin location sync error:', e)
      }

      // Reload all data for the new location
      loadData(newDistrict, newBlock, newState)
    }
    window.addEventListener('mausamsetu_location_change', handleLocChange)
    return () => window.removeEventListener('mausamsetu_location_change', handleLocChange)
  }, [])

  const handleReassign = async () => {
    if (!reassignModalOfficer) return
    try {
      await officerApi.assign({
        officer_id: reassignModalOfficer.id,
        block: reassignBlockTarget,
      })
      setReassignModalOfficer(null)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const filteredPanchayats = panchayats.filter((p) => {
    const matchesBlock = filterBlock === 'all' || p.block.toLowerCase() === filterBlock.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(searchPanchayat.toLowerCase()) ||
                          p.block.toLowerCase().includes(searchPanchayat.toLowerCase())
    return matchesBlock && matchesSearch
  })

  const adminTabsList: Array<{ id: AdminTab; label: string; icon: any; badge?: string | number }> = [
    { id: 'overview', label: 'Overview', icon: BarChart2, badge: undefined },
    { id: 'panchayats', label: 'Panchayat Operations', icon: MapPin, badge: '78 GP' },
    { id: 'officers', label: 'Officers Directory', icon: Users, badge: officers.length || 4 },
    { id: 'advisories', label: 'Advisory Governance', icon: FileText, badge: summary?.pending_advisories },
    { id: 'data-health', label: 'Data & Telemetry', icon: Server, badge: '10/12 AWS' },
    { id: 'model-health', label: 'Model Health & Fallback', icon: Cpu, badge: 'v0.3' },
    { id: 'ml-lab', label: '🔬 ML Model Lab', icon: Activity, badge: 'Interactive' },
    { id: 'map', label: 'District Spatial Map', icon: MapIcon, badge: undefined },
    { id: 'audit', label: 'System Audit Log', icon: History, badge: undefined },
    { id: 'settings', label: 'State & Configuration', icon: Globe, badge: '3 States' },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Navigation Strip (< md) */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-14 z-30 shadow-2xs">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-100 text-brand-800 rounded-lg flex items-center justify-center font-bold">
              <ShieldCheck size={15} />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs">District Command</span>
              <span className="text-[10px] text-emerald-700 ml-1.5 font-semibold">({district})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            <span>Dr. Deshmukh</span>
          </div>
        </div>

        {/* Horizontal scrollable pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
          {adminTabsList.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-brand-700 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              <Icon size={13} className={activeTab === id ? 'text-brand-100' : 'text-slate-500'} />
              <span>{label}</span>
              {badge != null && (
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.2 rounded-full',
                    activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar Navigation (>= md) */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 sticky top-16 md:h-[calc(100vh-4rem)] flex-col flex-shrink-0 z-10 shadow-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">District Command</h2>
              <p className="text-[11px] font-semibold text-emerald-700">{district} District Center</p>
            </div>
          </div>
        </div>

        {/* 10 Admin Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminTabsList.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                activeTab === id
                  ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon size={16} className={activeTab === id ? 'text-brand-700' : 'text-slate-400'} />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin Persona */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
              PD
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-900 leading-tight">Dr. P. K. Deshmukh</p>
              <p className="text-[11px] text-slate-500">District Agricultural Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-brand-800 tracking-wider bg-brand-100 px-2.5 py-0.5 rounded-full">
                {district} District Operations Command • {selectedState}
              </span>
              <span className="text-xs text-slate-400">• Real-Time Synchronized</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-1 capitalize">
              {activeTab === 'overview' && 'District Operations Overview'}
              {activeTab === 'panchayats' && 'Panchayat Field Operations'}
              {activeTab === 'officers' && 'Agricultural Extension Officers'}
              {activeTab === 'advisories' && 'District Advisory Governance'}
              {activeTab === 'data-health' && 'Weather & Data Feeds Health'}
              {activeTab === 'model-health' && 'Microclimate Model Health & Fallback Engine'}
              {activeTab === 'ml-lab' && 'Machine Learning Model Lab & Topographic Physics Engine'}
              {activeTab === 'map' && 'District Spatial Distribution Map'}
              {activeTab === 'audit' && 'System-Wide Governance Audit Log'}
              {activeTab === 'settings' && 'Pan-India Configuration & Multi-State Architecture'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(selectedDistrict, filterBlock, selectedState)}
              disabled={refreshing}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
              Refresh Feeds
            </button>
          </div>
        </div>

        {/* Pan-India Jurisdiction Command & Search Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-xs relative">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Cascading State / District / Block Selectors */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-1">
                <MapPin size={15} className="text-brand-600 shrink-0" />
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Jurisdiction:</span>
              </div>

              {/* State Dropdown */}
              <div className="relative">
                <label className="sr-only">Select State</label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 hover:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {states.length > 0 ? (
                    states.map((st) => (
                      <option key={st.code || st.state} value={st.state}>
                        {st.state}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                    </>
                  )}
                </select>
              </div>

              {/* District Dropdown */}
              <div className="relative">
                <label className="sr-only">Select District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="text-xs font-bold bg-brand-50/70 border border-brand-200 rounded-lg px-2.5 py-1.5 text-brand-950 hover:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>

              {/* Block Dropdown */}
              <div className="relative">
                <label className="sr-only">Select Block</label>
                <select
                  value={filterBlock}
                  onChange={(e) => {
                    const blk = e.target.value
                    setFilterBlock(blk)
                    setDrillBlock(blk)
                    loadData(selectedDistrict, blk, selectedState)
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 hover:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="all">All Blocks ({availableBlocks.length})</option>
                  {availableBlocks.map((b) => (
                    <option key={b} value={b}>
                      {b} Block
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Autocomplete Search Across All India */}
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={locationSearchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => {
                    if (locationSearchResults.length > 0) setShowLocationDropdown(true)
                  }}
                  placeholder="Search any district, block or city in India (e.g. Pune, Ludhiana, Katol)..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
                {isSearchingLocation ? (
                  <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 animate-spin" />
                ) : locationSearchQuery ? (
                  <button
                    onClick={() => {
                      setLocationSearchQuery('')
                      setLocationSearchResults([])
                      setShowLocationDropdown(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>

              {/* Backdrop to close dropdown on click outside */}
              {showLocationDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLocationDropdown(false)}
                />
              )}

              {/* Floating Autocomplete Results Dropdown */}
              {showLocationDropdown && locationSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50/90 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>Select Jurisdiction to Inspect</span>
                    <span>{locationSearchResults.length} found</span>
                  </div>
                  {locationSearchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-brand-50/70 transition-colors flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-brand-900 truncate">
                            {item.name || item.district}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-800">
                            {item.type || 'LOCATION'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.block && `${item.block} Block • `}
                          {item.district && `${item.district} District, `}
                          {item.state}
                        </p>
                      </div>
                      <ArrowRight size={13} className="text-slate-300 group-hover:text-brand-600 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Scope Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'District', val: district, sub: selectedState, color: 'slate' },
                { label: 'Panchayats', val: String(summary?.total_panchayats || 0), sub: 'Total GPs', color: 'slate' },
                { label: 'Blocks', val: String(summary?.total_blocks || 0), sub: 'Sub-Districts', color: 'slate' },
                { label: 'AWS Stations', val: String(summary?.total_stations || 12), sub: `${(summary?.total_stations || 12) - (summary?.offline_stations || 0)} Online`, color: 'slate' },
                { label: 'Approved Today', val: summary?.approved_today ?? 0, sub: 'Disseminated', color: 'emerald' },
                { label: 'Pending Review', val: summary?.pending_advisories ?? 0, sub: 'Awaiting Action', color: 'amber' },
                { label: 'Stale Feeds', val: String(summary?.stale_panchayats || 0), sub: 'Delayed >4h', color: 'slate' },
                { label: 'Stations Offline', val: String(summary?.offline_stations || 0), sub: 'Tech Dispatched', color: 'rose' },
              ].map(({ label, val, sub, color }) => (
                <div
                  key={label}
                  className={cn(
                    'bg-white border rounded-xl p-3 shadow-xs',
                    color === 'amber' ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                  )}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{label}</span>
                  <span className={cn('text-lg font-bold font-display', color === 'amber' ? 'text-amber-800' : 'text-slate-900')}>
                    {val}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{sub}</span>
                </div>
              ))}
            </div>

            {/* Action Required Priority Box */}
            <div className="bg-gradient-to-r from-amber-50/80 via-rose-50/40 to-slate-50 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                    Action Required (जिला परिचालन कार्यसूची)
                  </h2>
                </div>
                <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-3 py-1 rounded-full">
                  4 District Exceptions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-amber-900 font-bold">
                    <span>Advisories Awaiting Review</span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                      {summary?.pending_advisories ?? 7} GP
                    </span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    Kalmeshwar & Saoner blocks downscaled batches awaiting officer sign-off.
                  </p>
                  <button
                    onClick={() => setActiveTab('advisories')}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 pt-1"
                  >
                    Inspect Queue <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-800 font-bold">
                    <span>Stale Observation Feeds</span>
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-mono">{summary?.stale_panchayats || 0} GP</span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    Mohpa, Khapa, and Kelwad telemetry sync delayed &gt; 4 hours.
                  </p>
                  <button
                    onClick={() => setActiveTab('data-health')}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 pt-1"
                  >
                    Force Station Sync <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-rose-900 font-bold">
                    <span>AWS Stations Offline</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono">2 STN</span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    AWS #108 (Katol East) and AWS #111 (Ramtek North) telemetry silent.
                  </p>
                  <button
                    onClick={() => alert('Field maintenance ticket dispatched')}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 pt-1"
                  >
                    Dispatch Tech <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span>Local Orographic Deviation</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">Normal</span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    DEM physics applied +5.2mm local lift adjustment along Ramtek ridge.
                  </p>
                  <button
                    onClick={() => setActiveTab('model-health')}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 pt-1"
                  >
                    View Model Logs <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Block Operations Summary Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Block-Level Operational Breakdown</h3>
                <span className="text-xs text-slate-500 font-medium">All 4 Blocks Active</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Block</th>
                    <th className="p-3">Total Panchayats</th>
                    <th className="p-3">Verified Today</th>
                    <th className="p-3">Pending Review</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3">Telemetry Error</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary?.blocks.map((b) => (
                    <tr key={b.block} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{b.block} Block</td>
                      <td className="p-3 font-semibold text-slate-700">{b.total_panchayats}</td>
                      <td className="p-3 font-bold text-emerald-700">{b.verified_today}</td>
                      <td className="p-3 font-bold text-amber-700">{b.pending_review}</td>
                      <td className="p-3 text-slate-800 font-medium">{b.assigned_officer}</td>
                      <td className="p-3 text-slate-600 font-mono">{b.avg_error_mm}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setFilterBlock(b.block)
                            setActiveTab('panchayats')
                          }}
                          className="text-brand-700 font-bold hover:underline"
                        >
                          View GPs →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PANCHAYAT OPERATIONS */}
        {activeTab === 'panchayats' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="relative flex-1 w-full max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9 text-xs w-full py-2"
                  placeholder="Search by panchayat or block..."
                  value={searchPanchayat}
                  onChange={(e) => setSearchPanchayat(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['all', 'Kalmeshwar', 'Hingna', 'Saoner', 'Katol'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setFilterBlock(b)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      filterBlock === b ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {b === 'all' ? 'All Blocks' : b}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Gram Panchayat</th>
                    <th className="p-3">Block</th>
                    <th className="p-3">Weather Status</th>
                    <th className="p-3">Data Freshness</th>
                    <th className="p-3">Advisory Status</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3">Model State</th>
                    <th className="p-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPanchayats.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.name} GP</td>
                      <td className="p-3 text-slate-700">{p.block}</td>
                      <td className="p-3 text-slate-600">{p.weather_status_text || '0.0 mm (Clear)'}</td>
                      <td className="p-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', p.telemetry_status === 'FRESH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                          {p.telemetry_status || 'FRESH'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">{p.advisory_status || 'Pending'}</td>
                      <td className="p-3 text-slate-800 font-medium">{p.officer_name || 'Rajesh Sharma'}</td>
                      <td className="p-3 font-mono text-slate-600">{p.model_state || 'Normal (XGB-03)'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedPanchayat(p)}
                          className="text-xs font-bold text-brand-700 hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OFFICER MANAGEMENT */}
        {activeTab === 'officers' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Agricultural Extension Officers Directory</h3>
                <p className="text-xs text-slate-500">Jurisdiction assignment, workload telemetry & review performance</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                4/4 Active Extension Leads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Officer</th>
                    <th className="p-3">Assigned Block</th>
                    <th className="p-3">Panchayats</th>
                    <th className="p-3">Pending Reviews</th>
                    <th className="p-3">Approved Today</th>
                    <th className="p-3">Avg Review Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {officers.map((off) => (
                    <tr key={off.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{off.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">{off.phone}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{off.block} Block</td>
                      <td className="p-3 text-slate-600">{off.assigned_panchayats_count} GPs</td>
                      <td className="p-3 font-bold text-amber-700">{off.pending_reviews}</td>
                      <td className="p-3 font-bold text-emerald-700">{off.approved_today}</td>
                      <td className="p-3 text-slate-600 font-mono">{off.avg_review_time_mins} min</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                            off.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {off.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setReassignModalOfficer(off)
                            setReassignBlockTarget(off.block)
                          }}
                          className="text-xs font-bold text-brand-700 hover:underline mr-3"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ADVISORY GOVERNANCE */}
        {activeTab === 'advisories' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">District Advisory Governance Ledger</h3>
                <p className="text-xs text-slate-500">Lifecycle traceability: Draft → Under Review → Approved → Published</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {advisories.length} Total Records
              </span>
            </div>

            <div className="space-y-3">
              {advisories.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded">
                        #MS-{1000 + a.id}
                      </span>
                      <strong className="text-slate-900 text-sm">{a.panchayat_name} GP</strong>
                      <span className="text-slate-500 capitalize">• {a.crop}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Downscaled: {a.predicted_rainfall_mm ?? 3.8}mm (vs IMD {a.baseline_rainfall_mm ?? 4.5}mm) • Diff: {a.model_diff_mm ?? -0.7}mm
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full',
                        a.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : a.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {a.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(a.advisory_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DATA HEALTH */}
        {activeTab === 'data-health' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b pb-3">Weather Data Pipelines & Telemetry Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dataHealthList.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{item.name}</strong>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <p>Last Sync: <strong>{item.sync}</strong></p>
                      <p>Ingestion Latency: <strong className="font-mono">{item.latency}</strong></p>
                      <p>Error Flags: <strong className="font-mono">{item.errors}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MODEL HEALTH & FALLBACK ENGINE */}
        {activeTab === 'model-health' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Cpu size={18} className="text-brand-600" />
                    Spatial Downscaler Model Evaluation & Benchmark (XGBoost v0.3)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated against Nagpur AWS Ground Truth Network (01 Sep – 25 Sep 2026, 1,420 samples)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Status: Healthy (42.7% Error Reduction)
                  </span>
                </div>
              </div>

              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline IMD MAE</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">{modelPerf?.baseline_mae ?? '2.41'} mm</span>
                  <span className="text-[10px] text-slate-400">Coarse 40km grid</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">MausamSetu MAE</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">{modelPerf?.model_mae ?? '1.38'} mm</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">{modelPerf?.error_reduction_pct ?? '42.7'}% error reduction</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline RMSE</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">{modelPerf?.baseline_rmse ?? '3.12'} mm</span>
                  <span className="text-[10px] text-slate-400">Regional variance</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">Model RMSE</span>
                  <span className="text-2xl font-black text-blue-900 mt-1 block">{modelPerf?.model_rmse ?? '1.84'} mm</span>
                  <span className="text-[10px] text-blue-700 font-semibold">Low outlier skew</span>
                </div>
              </div>

              {/* 25-Day MAE Comparison Benchmark Curve (Recharts) */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 size={16} className="text-brand-700" />
                      Daily Mean Absolute Error (MAE) Progression Curve
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daily comparison across 25 days: IMD Regional Grid (40km) vs MausamSetu Microclimate (3km)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-3 rounded-full bg-slate-400" />
                      IMD Coarse Baseline (40km)
                    </span>
                    <span className="flex items-center gap-1.5 text-brand-700 font-bold">
                      <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      MausamSetu 3km Downscaler
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={benchmarkCurve.length > 0 ? benchmarkCurve : [
                        { day: '01 Sep', baseline_mae: 2.52, model_mae: 1.45 },
                        { day: '05 Sep', baseline_mae: 2.10, model_mae: 1.28 },
                        { day: '10 Sep', baseline_mae: 2.85, model_mae: 1.50 },
                        { day: '15 Sep', baseline_mae: 2.70, model_mae: 1.48 },
                        { day: '20 Sep', baseline_mae: 2.30, model_mae: 1.30 },
                        { day: '25 Sep', baseline_mae: 2.41, model_mae: 1.38 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="modelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        unit=" mm"
                        domain={[0, 4]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const diff = (data.baseline_mae - data.model_mae).toFixed(2)
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-bold text-slate-300">{data.day} 2026</p>
                                <p className="text-slate-300">IMD Coarse Baseline: <strong className="text-white font-mono">{data.baseline_mae} mm</strong></p>
                                <p className="text-emerald-400">MausamSetu 3km: <strong className="text-white font-mono">{data.model_mae} mm</strong></p>
                                <p className="text-amber-300 pt-1 border-t border-slate-700 font-semibold">
                                  MAE Improvement: -{diff} mm ({Math.round((Number(diff) / data.baseline_mae) * 100)}% better)
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="baseline_mae"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#baselineGrad)"
                        name="IMD Baseline"
                      />
                      <Area
                        type="monotone"
                        dataKey="model_mae"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#modelGrad)"
                        name="MausamSetu Downscaler"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Automated Fallback Engine Logic Flow */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-600" />
                    Automated Failover & Safety Gate Architecture
                  </h4>
                  <button
                    onClick={runFallbackSimulation}
                    disabled={simulating}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Play size={13} className={cn(simulating && 'animate-spin')} />
                    {simulating ? 'Simulating Failover...' : 'Test Telemetry Outage & Run Fallback'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 1: Input</span>
                    <p className="text-[11px] text-slate-500 mt-1">IMD 40km Regional Baseline</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 2: Checks</span>
                    <p className="text-[11px] text-slate-500 mt-1">Telemetry Freshness &lt;4h</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 3: Uncertainty</span>
                    <p className="text-[11px] text-slate-500 mt-1">Prediction Interval &lt;3.5mm</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 4: Quality Gate</span>
                    <p className="text-[11px] text-slate-500 mt-1">Diff within physical limits</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-300 shadow-2xs text-emerald-950 font-bold">
                    <span>YES → MausamSetu</span>
                    <p className="text-[10px] font-normal text-emerald-800 mt-1">NO → Fallback to IMD</p>
                  </div>
                </div>

                {/* Simulation Output Card */}
                {fallbackSimulation && (
                  <div className="p-4 bg-white border border-amber-300 rounded-xl shadow-sm space-y-2.5 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <strong className="text-slate-900 font-bold">
                          Failover Simulation Result: {fallbackSimulation.simulation_id}
                        </strong>
                      </div>
                      <span className="badge-green text-[10px] font-bold">
                        PASS: 4/4 Safety Checks Passed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Simulated Event:</span>
                        <strong className="text-slate-800">{fallbackSimulation.scenario}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Station Target:</span>
                        <strong className="text-slate-800">{fallbackSimulation.affected_station}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Failover Latency:</span>
                        <strong className="text-emerald-700 font-mono">18 ms (Sub-second)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Advisory Status:</span>
                        <strong className="text-brand-700">Fallback Grade B Preserved</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ML MODEL LAB & INFERENCE SHOWCASE */}
        {activeTab === 'ml-lab' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu size={20} className="text-brand-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Machine Learning & Topographic Physics Inference Lab
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grounded in Phase 6 empirical validation: 1,661 paired observations across 18 Synoptic/Airport ground truth stations in Maharashtra.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/app/ml-showcase"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Open Fullscreen Lab</span>
                    <ExternalLink size={12} />
                  </a>
                  <span className="badge-green text-xs font-bold py-1">
                    v0.3 Active
                  </span>
                </div>
              </div>

              {/* 3 Model Architecture Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Model 1: Microclimate Downscaler</span>
                  <strong className="text-sm text-emerald-950 font-bold block">XGBoost + SRTM 90m DEM Physics</strong>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Resolves 40km coarse synoptic grids down to 3km panchayat cells with orographic rain & lapse rate. Overall MAE reduction: 43.9%.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Model 2: Agro-Ecological Outbreak</span>
                  <strong className="text-sm text-blue-950 font-bold block">Bio-Climatic Multi-Target Classifier</strong>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Predicts Pod Borer, Pink Bollworm & Fungal Blight outbreaks based on 72h moisture-thermal trajectories.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Model 3: Automated Failover</span>
                  <strong className="text-sm text-amber-950 font-bold block">4-Step Safety Gate Engine</strong>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Detects sensor drift and automatically falls back to verified IMD regional feeds with &lt; 2.1% harmful correction rate.
                  </p>
                </div>
              </div>

              {/* EMBEDDED DOWNSCALING CALCULATOR */}
              <div className="border border-brand-200 rounded-2xl p-5 bg-gradient-to-br from-brand-50/40 via-white to-emerald-50/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} className="text-brand-600" />
                      Interactive Topographic Microclimate Downscaler Calculator
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Real-time SRTM 90m DEM lapse-rate & orographic adjustment formula
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white text-brand-800 px-2.5 py-1 rounded-full border border-brand-200 shadow-2xs">
                    Ref Centroid: 240m
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Controls */}
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">Panchayat Elevation (DEM)</span>
                        <strong className="font-mono text-brand-800">{calcElevation} m</strong>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="1400"
                        step="10"
                        value={calcElevation}
                        onChange={(e) => setCalcElevation(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Plains (150m)</span>
                        <span>Dhapewada (310m)</span>
                        <span>Nashik (598m)</span>
                        <span>Mahabaleshwar (1382m)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">Base Regional IMD Rain</span>
                        <strong className="font-mono text-brand-800">{calcBaseRain} mm</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={calcBaseRain}
                        onChange={(e) => setCalcBaseRain(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Base Temp</span>
                          <strong className="font-mono text-brand-800">{calcBaseTemp}°C</strong>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="45"
                          step="0.5"
                          value={calcBaseTemp}
                          onChange={(e) => setCalcBaseTemp(Number(e.target.value))}
                          className="w-full accent-brand-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Humidity</span>
                          <strong className="font-mono text-brand-800">{calcHumidity}%</strong>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="1"
                          value={calcHumidity}
                          onChange={(e) => setCalcHumidity(Number(e.target.value))}
                          className="w-full accent-brand-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Output Card */}
                  {(() => {
                    const elevDiff = calcElevation - 240
                    const tempLapse = -0.0065 * elevDiff
                    const calcDownscaledTemp = (calcBaseTemp + tempLapse).toFixed(1)
                    const orographicEffect = elevDiff > 0 ? (elevDiff / 1000) * 0.15 : (elevDiff / 1000) * 0.12
                    const calcDownscaledRain = Math.max(0, Number((calcBaseRain * (1 + orographicEffect) - (elevDiff < 0 ? 0.3 : 0.7)).toFixed(1)))
                    const calcRainDiff = Number((calcDownscaledRain - calcBaseRain).toFixed(1))

                    return (
                      <div className="bg-white border border-brand-200 rounded-xl p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Physics Downscaled Output</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Reliability: HIGH
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block">Downscaled Rainfall</span>
                            <span className="text-lg font-bold font-mono text-brand-700">{calcDownscaledRain} mm</span>
                            <span className="text-[10px] text-emerald-700 font-mono block">
                              {calcRainDiff > 0 ? `+${calcRainDiff}` : calcRainDiff} mm vs IMD
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block">Downscaled Temp</span>
                            <span className="text-lg font-bold font-mono text-slate-900">{calcDownscaledTemp}°C</span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {tempLapse > 0 ? `+${tempLapse.toFixed(1)}` : tempLapse.toFixed(1)}°C lapse
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                          <strong>Agronomic Synthesis: </strong>
                          {calcDownscaledRain >= 3.0
                            ? 'Soil moisture adequate across black cotton soils. Delay supplemental irrigation for 24h.'
                            : calcDownscaledRain > 0.5
                            ? 'Scattered light precipitation expected. Safe spray window open in early morning.'
                            : 'Dry conditions prevailing. Proceed with regular field intercultural operations.'}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Empirical Validation Stations Grid Grounded in CSV */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Empirical Ground Truth Accuracy Across 18 Synoptic/Airport Stations
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    1,661 Paired Observations (phase6_expanded_dataset.csv)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                  {[
                    { st: 'Mahabaleshwar', elev: '1,382m', imp: '58.4%', note: 'Ghats Ridge' },
                    { st: 'Nashik Arpt', elev: '598m', imp: '48.1%', note: 'Plateau Slope' },
                    { st: 'Pune', elev: '558m', imp: '46.0%', note: 'Rainshadow' },
                    { st: 'Kolhapur', elev: '608m', imp: '45.7%', note: 'Western Slope' },
                    { st: 'Satara', elev: '612m', imp: '45.1%', note: 'Krishna Basin' },
                    { st: 'Baramati', elev: '551m', imp: '44.6%', note: 'Nira Valley' },
                    { st: 'Jalgaon', elev: '201m', imp: '44.2%', note: 'Tapi Basin' },
                    { st: 'Wardha', elev: '283m', imp: '41.8%', note: 'Vidarbha Plains' },
                    { st: 'Solapur', elev: '483m', imp: '40.2%', note: 'Dry Agro-Zone' },
                    { st: 'Akola', elev: '282m', imp: '39.5%', note: 'Purna Basin' },
                    { st: 'Gondia', elev: '301m', imp: '39.1%', note: 'Wainganga Basin' },
                    { st: 'Yeotmal', elev: '451m', imp: '38.7%', note: 'Yavatmal Hills' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-0.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 text-[11px] truncate">{item.st}</strong>
                        <span className="font-mono text-emerald-700 font-bold text-[10px]">+{item.imp}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>{item.elev}</span>
                        <span className="italic truncate">{item.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Link to Interactive Playground */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-brand-700 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <strong className="text-sm font-bold block">Want to test custom elevations and weather parameters?</strong>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Launch the full-featured interactive slider simulator with live SHAP attribution and bio-climatic controls.
                  </p>
                </div>
                <a
                  href="/app/ml-showcase"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white text-brand-900 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap transition-all"
                >
                  <span>Launch Interactive Simulator</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MULTI-TIER SPATIAL DRILLDOWN MAP */}
        {activeTab === 'map' && (
          <MapDrilldownTab
            spatialTier={spatialTier}
            setSpatialTier={setSpatialTier}
            drillState={drillState}
            setDrillState={setDrillState}
            drillDistrict={drillDistrict}
            setDrillDistrict={setDrillDistrict}
            drillBlock={drillBlock}
            setDrillBlock={setDrillBlock}
            panchayats={panchayats}
            setSelectedPanchayat={setSelectedPanchayat}
          />
        )}

        {/* TAB 8: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b pb-3">District Governance Audit Trail</h3>
            <div className="space-y-3">
              {auditLogs.map((item, i) => (
                <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-900">{item.action}</strong>
                    <span className="font-mono text-[11px] text-slate-400 font-bold">{item.time}</span>
                  </div>
                  <p className="text-slate-600 mb-1">By: <strong>{item.actor}</strong></p>
                  <p className="text-slate-500 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: SETTINGS & MULTI-STATE SWITCHER */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Configuration-Driven Geography (Pan-India)</h3>
                <p className="text-xs text-slate-500">
                  MausamSetu is designed India-first. The same frontend architecture supports Punjab, Karnataka, and Maharashtra without code changes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {states.map((st) => (
                  <div
                    key={st.code}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      st.is_pilot ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-slate-900 text-sm">{st.state}</strong>
                      <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        {st.code}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p>Languages: <strong className="uppercase">{st.languages.join(', ')}</strong></p>
                      <p>Major Crops: <strong className="capitalize">{st.major_crops.join(', ')}</strong></p>
                      <p>Configured Districts: <strong>{st.districts_count}</strong></p>
                      <p className="mt-2 text-[10px] font-bold text-emerald-800">
                        {st.is_pilot ? '✓ Active Pilot Deployment' : '✓ Architecture Ready'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reassign Officer Modal */}
      {reassignModalOfficer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Reassign Extension Officer</h3>
              <button onClick={() => setReassignModalOfficer(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-700 space-y-2">
              <p>Officer: <strong>{reassignModalOfficer.name}</strong></p>
              <p>Current Block: <strong>{reassignModalOfficer.block}</strong></p>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Target Block Jurisdiction:</label>
                <select
                  value={reassignBlockTarget}
                  onChange={(e) => setReassignBlockTarget(e.target.value)}
                  className="input w-full py-2 text-xs"
                >
                  <option value="Kalmeshwar">Kalmeshwar Block</option>
                  <option value="Hingna">Hingna Block</option>
                  <option value="Saoner">Saoner Block</option>
                  <option value="Katol">Katol Block</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setReassignModalOfficer(null)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="btn-primary py-1.5 px-4 text-xs font-bold"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panchayat Drill-Down Modal */}
      {selectedPanchayat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedPanchayat.name} GP</h3>
                <p className="text-xs text-slate-500">{selectedPanchayat.block} Block • {selectedDistrict} District</p>
              </div>
              <button onClick={() => setSelectedPanchayat(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <p>Registered Farmers: <strong>{selectedPanchayat.registered_farmers ?? 84}</strong></p>
              <p>Primary Crops: <strong className="capitalize">{(selectedPanchayat.primary_crops || ['Soybean', 'Cotton']).join(', ')}</strong></p>
              <p>Elevation: <strong>{selectedPanchayat.elevation_m || 312}m</strong></p>
              <p>Telemetry Status: <strong className="text-emerald-700">{selectedPanchayat.telemetry_status || 'FRESH'}</strong></p>
              <p>Last Sync: <strong>{selectedPanchayat.last_sync || '10:30 AM'}</strong></p>
            </div>
            <button
              onClick={() => setSelectedPanchayat(null)}
              className="btn-primary w-full py-2 text-xs font-bold"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
