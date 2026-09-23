import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  Droplets,
  Mountain,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

export interface PanchayatNode {
  id: string
  label: string
  rainfall: string
  rainValue: number // mm
  elevation: number // meters
  x: number // percent 0-100
  y: number // percent 0-100
  crop: string
  advisory: string
  action: 'hold' | 'drain' | 'irrigate' | 'spray_hold' | 'monitor'
  terrainType: 'Windward Ridge' | 'Plateau Edge' | 'Valley Floor' | 'River Basin' | 'Hill Foothill' | 'Rain-Shadow Leeward'
  actionLabel: string
}

export const PANCHAYAT_NODES: PanchayatNode[] = [
  {
    id: 'dhapewada',
    label: 'Dhapewada',
    rainfall: '4.2mm',
    rainValue: 4.2,
    elevation: 348,
    x: 43,
    y: 42,
    crop: 'Cotton & Mandarin',
    advisory: 'Hold irrigation for 24 hours — Root zone moisture at 78%',
    action: 'hold',
    actionLabel: 'Hold Irrigation 24h',
    terrainType: 'Windward Ridge',
  },
  {
    id: 'mohpa',
    label: 'Mohpa',
    rainfall: '7.1mm',
    rainValue: 7.1,
    elevation: 320,
    x: 70,
    y: 28,
    crop: 'Soybean & Gram',
    advisory: 'Delay pesticide & fertilizer spray — Prevent precipitation runoff',
    action: 'spray_hold',
    actionLabel: 'Delay Spraying',
    terrainType: 'Plateau Edge',
  },
  {
    id: 'kalmeshwar',
    label: 'Kalmeshwar',
    rainfall: '2.8mm',
    rainValue: 2.8,
    elevation: 305,
    x: 25,
    y: 64,
    crop: 'Citrus Orchards',
    advisory: 'Proceed with scheduled drip cycle — Valley floor received minimal moisture',
    action: 'irrigate',
    actionLabel: 'Maintain Drip Cycle',
    terrainType: 'Valley Floor',
  },
  {
    id: 'savner',
    label: 'Savner',
    rainfall: '11.4mm',
    rainValue: 11.4,
    elevation: 295,
    x: 76,
    y: 68,
    crop: 'Paddy & Sugarcane',
    advisory: 'Clear field drainage channels — High runoff accumulation in river basin',
    action: 'drain',
    actionLabel: 'Clear Drainage Now',
    terrainType: 'River Basin',
  },
  {
    id: 'ramtek',
    label: 'Ramtek',
    rainfall: '5.6mm',
    rainValue: 5.6,
    elevation: 375,
    x: 51,
    y: 76,
    crop: 'Vegetables & Chili',
    advisory: 'Post-shower humidity alert — Monitor tomato crops for early blight',
    action: 'monitor',
    actionLabel: 'Fungal Monitoring',
    terrainType: 'Hill Foothill',
  },
  {
    id: 'narkhed',
    label: 'Narkhed',
    rainfall: '1.9mm',
    rainValue: 1.9,
    elevation: 360,
    x: 17,
    y: 32,
    crop: 'Cotton & Pigeon Pea',
    advisory: 'Dry rain-shadow side of ridge — Normal irrigation schedule required',
    action: 'irrigate',
    actionLabel: 'Irrigate as Scheduled',
    terrainType: 'Rain-Shadow Leeward',
  },
]

interface WeatherFieldProps {
  nodes?: PanchayatNode[]
  showWind?: boolean
  showContours?: boolean
  activeNodeId?: string
  phase?: 'regional' | 'resolving' | 'panchayat'
  className?: string
  height?: number
  onSelectNode?: (nodeId: string) => void
}

export const WeatherField: React.FC<WeatherFieldProps> = ({
  nodes = PANCHAYAT_NODES,
  showWind = true,
  showContours = true,
  activeNodeId,
  phase = 'panchayat',
  className = '',
  height = 360,
  onSelectNode,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [internalSelectedId, setInternalSelectedId] = useState<string>('dhapewada')
  const [showElevationCrossSection, setShowElevationCrossSection] = useState<boolean>(false)

  const selectedId = activeNodeId || internalSelectedId
  const selectedNode = nodes.find((n) => n.id === selectedId) || nodes[0]

  const handleNodeClick = (nodeId: string) => {
    setInternalSelectedId(nodeId)
    if (onSelectNode) onSelectNode(nodeId)
  }

  const svgW = 580
  const svgH = 340
  const centerCx = svgW * 0.48
  const centerCy = svgH * 0.46

  return (
    <div className={`relative flex flex-col w-full select-none ${className}`}>
      {/* ── High-Tech Radar Canvas ── */}
      <div className="relative w-full overflow-hidden rounded-t-xl bg-[#070D18] border border-white/10 shadow-2xl">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto overflow-visible block"
          style={{ maxHeight: height }}
          aria-label="Meteorological Radar Downscaling Visualization"
        >
          <defs>
            {/* Inline keyframe animations for radar sweep, scanning laser, and wind streamlines */}
            <style>{`
              @keyframes radarSweep {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes windFlow {
                to { stroke-dashoffset: -48; }
              }
              @keyframes laserScan {
                0% { transform: translateY(40px); opacity: 0; }
                15% { opacity: 0.9; }
                85% { opacity: 0.9; }
                100% { transform: translateY(290px); opacity: 0; }
              }
              @keyframes pingGlow {
                0% { transform: scale(1); opacity: 0.8; }
                80% { transform: scale(2.4); opacity: 0; }
                100% { transform: scale(2.6); opacity: 0; }
              }
              .wind-stream {
                stroke-dasharray: 8 16;
                animation: windFlow 2.4s linear infinite;
              }
              .radar-arm {
                transform-origin: ${centerCx}px ${centerCy}px;
                animation: radarSweep 7.5s linear infinite;
              }
              .laser-bar {
                animation: laserScan 3.6s ease-in-out infinite;
              }
            `}</style>

            {/* Radar Sweep Gradient Fan */}
            <linearGradient id="radarSweepBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#059669" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </linearGradient>

            {/* Laser Scanline Gradient */}
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
              <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#34D399" stopOpacity="1" />
              <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>

            {/* Rain Heatmap Radial Gradients */}
            <radialGradient id="heatHeavy">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#0369A1" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatMedium">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#047857" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatLight">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatDry">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#B45309" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
            </radialGradient>

            {/* Topographic Elevation Gradients */}
            <linearGradient id="topoRidge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#065F46" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="topoValley" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* ── Background Geometric Grid & Range Rings ── */}
          <g opacity={0.35}>
            {/* Fine Cartographic Grid */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={`cgx-${i}`}
                x1={i * 65 + 30}
                y1={20}
                x2={i * 65 + 30}
                y2={320}
                stroke="#1E293B"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`cgy-${i}`}
                x1={20}
                y1={i * 55 + 35}
                x2={560}
                y2={i * 55 + 35}
                stroke="#1E293B"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ))}

            {/* Radar Range Rings (10km, 20km, 30km) */}
            {[65, 125, 185, 245].map((r, i) => (
              <circle
                key={`ring-${r}`}
                cx={centerCx}
                cy={centerCy}
                r={r}
                fill="none"
                stroke="#334155"
                strokeWidth={1}
                strokeDasharray={i % 2 === 0 ? undefined : '4 5'}
                opacity={0.6}
              />
            ))}

            {/* Radar Crosshairs */}
            <line x1={centerCx - 250} y1={centerCy} x2={centerCx + 250} y2={centerCy} stroke="#334155" strokeWidth={1} />
            <line x1={centerCx} y1={centerCy - 150} x2={centerCx} y2={centerCy + 150} stroke="#334155" strokeWidth={1} />

            {/* Range markers */}
            <text x={centerCx + 70} y={centerCy - 6} fill="#64748B" fontSize={8} fontFamily="monospace">10km</text>
            <text x={centerCx + 130} y={centerCy - 6} fill="#64748B" fontSize={8} fontFamily="monospace">20km</text>
            <text x={centerCx + 190} y={centerCy - 6} fill="#64748B" fontSize={8} fontFamily="monospace">30km</text>
          </g>

          {/* ── Realistic Topographic Elevation Contours (Terrain Relief) ── */}
          {showContours && (
            <g opacity={phase === 'regional' ? 0.25 : 0.65} className="transition-opacity duration-500">
              {/* Valley Shading Basin (Savner/Kalmeshwar Lowland ~295m) */}
              <path
                d="M 320 220 C 390 190, 480 200, 520 280 C 470 330, 360 320, 320 280 Z"
                fill="url(#topoValley)"
                stroke="#0284C7"
                strokeWidth={1}
                strokeOpacity={0.4}
              />
              <text x={440} y={260} fill="#38BDF8" fontSize={8} fontFamily="monospace" opacity={0.6}>
                Valley Basin · 295m
              </text>

              {/* Ridge Elevation Body (Dhapewada Ridge ~348m - 375m) */}
              <path
                d="M 120 180 C 180 110, 290 90, 340 160 C 370 210, 280 270, 200 250 C 150 230, 100 210, 120 180 Z"
                fill="url(#topoRidge)"
                stroke="#10B981"
                strokeWidth={1.2}
                strokeOpacity={0.6}
              />

              {/* Isohypse elevation lines */}
              <path
                d="M 90 220 Q 220 80 410 120 T 540 230"
                fill="none"
                stroke="#10B981"
                strokeWidth={1}
                strokeDasharray="4 3"
                strokeOpacity={0.45}
              />
              <path
                d="M 120 260 Q 240 140 430 170 T 510 280"
                fill="none"
                stroke="#34D399"
                strokeWidth={1.2}
                strokeOpacity={0.5}
              />
              <path
                d="M 150 290 Q 260 190 400 220 T 480 320"
                fill="none"
                stroke="#059669"
                strokeWidth={1}
                strokeOpacity={0.35}
              />

              <text x={190} y={115} fill="#34D399" fontSize={8} fontFamily="monospace" opacity={0.7}>
                ▲ Ridge 350m (Orographic Lift)
              </text>
            </g>
          )}

          {/* ── PHASE 1: Regional Forecast (Coarse 40km Monolithic Block) ── */}
          {phase === 'regional' && (
            <g className="transition-all duration-500">
              {/* Coarse District Grid Box */}
              <rect
                x={svgW * 0.12}
                y={svgH * 0.14}
                width={svgW * 0.76}
                height={svgH * 0.72}
                rx={12}
                fill="#1E3A8A"
                fillOpacity={0.2}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="8 6"
              />

              {/* Grid 40km Division Cross lines */}
              <line
                x1={svgW * 0.5}
                y1={svgH * 0.14}
                x2={svgW * 0.5}
                y2={svgH * 0.86}
                stroke="#60A5FA"
                strokeOpacity={0.25}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <line
                x1={svgW * 0.12}
                y1={svgH * 0.5}
                x2={svgW * 0.88}
                y2={svgH * 0.5}
                stroke="#60A5FA"
                strokeOpacity={0.25}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              {/* Center Monolithic 18.0 mm Value Badge */}
              <g transform={`translate(${svgW * 0.5}, ${svgH * 0.44})`}>
                <rect
                  x={-100}
                  y={-34}
                  width={200}
                  height={68}
                  rx={12}
                  fill="#0F172A"
                  fillOpacity={0.95}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  filter="drop-shadow(0 8px 16px rgba(0,0,0,0.6))"
                />
                <circle cx={-72} cy={0} r={14} fill="#1D4ED8" fillOpacity={0.3} />
                <text x={-72} y={5} textAnchor="middle" fill="#60A5FA" fontSize={14}>
                  ☁
                </text>
                <text
                  x={12}
                  y={-4}
                  textAnchor="middle"
                  fill="#93C5FD"
                  fontSize={26}
                  fontWeight={900}
                  fontFamily="ui-monospace, monospace"
                >
                  18.0 mm
                </text>
                <text
                  x={12}
                  y={18}
                  textAnchor="middle"
                  fill="#60A5FA"
                  fontSize={9}
                  fontWeight={700}
                  fontFamily="ui-monospace, monospace"
                  letterSpacing="0.08em"
                >
                  UNIFORM 40km REGIONAL FORECAST
                </text>
              </g>

              {/* Bottom Warning Banner */}
              <g transform={`translate(${svgW * 0.5}, ${svgH * 0.72})`}>
                <rect
                  x={-150}
                  y={-14}
                  width={300}
                  height={28}
                  rx={14}
                  fill="#78350F"
                  fillOpacity={0.8}
                  stroke="#F59E0B"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fill="#FDE68A"
                  fontSize={9.5}
                  fontWeight={600}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  ⚠️ Terrain ignored: 80m delta between Savner & Ramtek
                </text>
              </g>
            </g>
          )}

          {/* ── PHASE 2: Physics-Based AI Downscaling Calibration ── */}
          {phase === 'resolving' && (
            <g className="transition-all duration-500">
              {/* Sweeping Laser Scan Line */}
              <g className="laser-bar">
                <line x1={svgW * 0.12} y1={0} x2={svgW * 0.88} y2={0} stroke="url(#laserGrad)" strokeWidth={3} />
                <polygon
                  points={`${svgW * 0.12},0 ${svgW * 0.88},0 ${svgW * 0.85},-18 ${svgW * 0.15},-18`}
                  fill="url(#laserGrad)"
                  opacity={0.15}
                />
              </g>

              {/* DEM 30m Micro-Elevation Grid Wireframe */}
              {[-80, -40, 0, 40, 80].map((offset, i) => (
                <line
                  key={`dem-h-${i}`}
                  x1={svgW * 0.14}
                  y1={centerCy + offset}
                  x2={svgW * 0.86}
                  y2={centerCy + offset}
                  stroke="#10B981"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              ))}
              {[-120, -60, 0, 60, 120].map((offset, i) => (
                <line
                  key={`dem-v-${i}`}
                  x1={centerCx + offset}
                  y1={svgH * 0.15}
                  x2={centerCx + offset}
                  y2={svgH * 0.85}
                  stroke="#10B981"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              ))}

              {/* Floating Scientific Telemetry Tags */}
              <g transform={`translate(${svgW * 0.5 - 120}, ${svgH * 0.22})`}>
                <rect x={0} y={0} width={240} height={26} rx={13} fill="#064E3B" fillOpacity={0.9} stroke="#10B981" strokeWidth={1} />
                <text x={120} y={17} textAnchor="middle" fill="#86EFAC" fontSize={10} fontWeight={800} fontFamily="monospace" letterSpacing="0.05em">
                  ● FUSING COPERNICUS 30m DEM + AWS TELEMETRY
                </text>
              </g>

              <g transform={`translate(${svgW * 0.5 - 140}, ${svgH * 0.76})`}>
                <rect x={0} y={0} width={280} height={24} rx={12} fill="#0F172A" fillOpacity={0.85} stroke="#38BDF8" strokeWidth={1} />
                <text x={140} y={16} textAnchor="middle" fill="#7DD3FC" fontSize={9} fontWeight={600} fontFamily="monospace">
                  Lapse Rate: -6.5°C/km · Rain Shadow Index: 0.28
                </text>
              </g>
            </g>
          )}

          {/* ── PHASE 3: Isohyetal Precipitation Heatmap & Doppler Radar (Step 3) ── */}
          {phase === 'panchayat' && (
            <g className="transition-all duration-700">
              {/* Rotating Doppler Radar Sweep Beam */}
              <g className="radar-arm pointer-events-none">
                {/* 45-degree radar sector sweep */}
                <path
                  d={`M ${centerCx} ${centerCy} L ${centerCx + 260} ${centerCy - 40} A 260 260 0 0 0 ${centerCx + 260} ${centerCy + 40} Z`}
                  fill="url(#radarSweepBeam)"
                />
                <line
                  x1={centerCx}
                  y1={centerCy}
                  x2={centerCx + 260}
                  y2={centerCy}
                  stroke="#34D399"
                  strokeWidth={1.8}
                  strokeOpacity={0.9}
                  filter="drop-shadow(0 0 6px rgba(52, 211, 153, 0.8))"
                />
              </g>

              {/* Rain Cell Heatmap Blobs (Accurately sized to micro-climate rain numbers) */}
              {/* Savner Heavy Rain Pocket (11.4mm) */}
              <circle cx={(76 / 100) * svgW} cy={(68 / 100) * svgH} r={64} fill="url(#heatHeavy)" />

              {/* Mohpa Moderate Rain Pocket (7.1mm) */}
              <circle cx={(70 / 100) * svgW} cy={(28 / 100) * svgH} r={52} fill="url(#heatMedium)" />

              {/* Ramtek Foothill Shower (5.6mm) */}
              <circle cx={(51 / 100) * svgW} cy={(76 / 100) * svgH} r={46} fill="url(#heatMedium)" />

              {/* Dhapewada Ridge Moisture (4.2mm) */}
              <circle cx={(43 / 100) * svgW} cy={(42 / 100) * svgH} r={42} fill="url(#heatLight)" />

              {/* Kalmeshwar Lowland (2.8mm) */}
              <circle cx={(25 / 100) * svgW} cy={(64 / 100) * svgH} r={34} fill="url(#heatLight)" />

              {/* Narkhed Rain-Shadow Dry Zone (1.9mm) */}
              <circle cx={(17 / 100) * svgW} cy={(32 / 100) * svgH} r={30} fill="url(#heatDry)" />
            </g>
          )}

          {/* ── Fluid Wind Streamlines (Flowing around the elevation ridge) ── */}
          {showWind && (
            <g opacity={phase === 'regional' ? 0.25 : 0.65} className="pointer-events-none">
              {/* Streamline 1 (North side flow) */}
              <path
                d="M 40 80 Q 200 40, 360 70 T 540 100"
                fill="none"
                stroke="#38BDF8"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="wind-stream"
              />
              {/* Streamline 2 (Ridge crest deflection) */}
              <path
                d="M 50 160 Q 180 120, 320 150 T 550 200"
                fill="none"
                stroke="#38BDF8"
                strokeWidth={1.8}
                strokeLinecap="round"
                className="wind-stream"
                style={{ animationDelay: '-0.8s' }}
              />
              {/* Streamline 3 (Valley wind acceleration) */}
              <path
                d="M 60 250 Q 230 200, 380 240 T 540 280"
                fill="none"
                stroke="#0EA5E9"
                strokeWidth={1.4}
                strokeLinecap="round"
                className="wind-stream"
                style={{ animationDelay: '-1.6s' }}
              />
            </g>
          )}

          {/* ── Interactive Panchayat Nodes / Beacons ── */}
          {nodes.map((n) => {
            const cx = (n.x / 100) * svgW
            const cy = (n.y / 100) * svgH
            const isSelected = n.id === selectedId
            const isHovered = n.id === hoveredNodeId

            // Rain badge color coding
            const rainColor =
              n.rainValue >= 10
                ? '#38BDF8' // Blue for heavy
                : n.rainValue >= 5
                ? '#34D399' // Green for moderate
                : n.rainValue >= 3
                ? '#A7F3D0' // Mint for light
                : '#FBBF24' // Amber for low

            const chipY = n.y < 50 ? cy - 38 : cy + 14

            return (
              <g
                key={n.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleNodeClick(n.id)}
                onMouseEnter={() => setHoveredNodeId(n.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Ping Radar Animation on Selected Node */}
                {isSelected && (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={24}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth={1.8}
                      opacity={0.8}
                      style={{
                        transformOrigin: `${cx}px ${cy}px`,
                        animation: 'pingGlow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
                      }}
                    />
                    <circle cx={cx} cy={cy} r={16} fill="#10B981" fillOpacity={0.2} />
                  </>
                )}

                {/* Node Center Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6.5 : isHovered ? 6 : 4.5}
                  fill={isSelected ? '#10B981' : isHovered ? '#38BDF8' : '#94A3B8'}
                  stroke={isSelected ? '#FFFFFF' : '#0B1120'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  filter={isSelected ? 'drop-shadow(0 0 6px #10B981)' : undefined}
                />

                {/* Glassmorphic Panchayat Pill Badge */}
                <g transform={`translate(${cx - 42}, ${chipY})`}>
                  <rect
                    x={0}
                    y={0}
                    width={84}
                    height={25}
                    rx={6}
                    fill={isSelected ? '#064E3B' : isHovered ? '#1E293B' : '#0B1120'}
                    fillOpacity={0.94}
                    stroke={isSelected ? '#10B981' : isHovered ? '#38BDF8' : '#334155'}
                    strokeWidth={isSelected ? 1.8 : 1}
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                  />

                  {/* Panchayat Name */}
                  <text
                    x={42}
                    y={11}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={8.5}
                    fontWeight={700}
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    {n.label}
                  </text>

                  {/* Rainfall Value & Elevation micro-tag */}
                  <text
                    x={28}
                    y={21}
                    textAnchor="middle"
                    fill={rainColor}
                    fontSize={8.5}
                    fontWeight={800}
                    fontFamily="ui-monospace, monospace"
                  >
                    {phase === 'regional' ? '18.0mm' : n.rainfall}
                  </text>

                  <text
                    x={62}
                    y={21}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize={7.5}
                    fontWeight={600}
                    fontFamily="ui-monospace, monospace"
                  >
                    {n.elevation}m
                  </text>
                </g>
              </g>
            )
          })}

          {/* Compass Rose */}
          <g transform={`translate(${svgW - 40}, 38)`} opacity={0.65}>
            <circle cx={0} cy={0} r={14} fill="#0F172A" stroke="#334155" strokeWidth={1} />
            <polygon points="0,-10 3,0 0,2 -3,0" fill="#EF4444" />
            <polygon points="0,10 3,0 0,2 -3,0" fill="#94A3B8" />
            <text x={0} y={-12} textAnchor="middle" fill="#EF4444" fontSize={7} fontWeight={900} fontFamily="monospace">
              N
            </text>
          </g>
        </svg>

        {/* Live Radar HUD Overlay in top corner */}
        <div className="absolute top-2.5 left-3 flex items-center gap-2 pointer-events-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-bold uppercase">
            {phase === 'regional'
              ? '40km Grid Mode'
              : phase === 'resolving'
              ? 'AI Downscaler Active'
              : 'Panchayat Hyperlocal Live'}
          </span>
          <span className="text-[9px] font-mono text-white/40 hidden sm:inline">
            · 21.28°N, 78.96°E
          </span>
        </div>

        {/* Elevation Cross-Section Quick Button */}
        <div className="absolute bottom-2.5 right-3">
          <button
            onClick={() => setShowElevationCrossSection(!showElevationCrossSection)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono bg-white/10 hover:bg-white/20 text-white/80 border border-white/10 transition-colors"
          >
            <Mountain size={12} className="text-emerald-400" />
            <span>{showElevationCrossSection ? 'Hide Relief' : 'Terrain Profile'}</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Terrain Elevation Cross-Section Strip (Optional Toggle) ── */}
      <AnimatePresence>
        {showElevationCrossSection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-[#0A1220] border-x border-b border-white/10 px-4 py-2.5 text-white"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-white/60 mb-1">
              <span className="flex items-center gap-1">
                <Mountain size={11} className="text-emerald-400" />
                West-to-East Topographic Cross-Section (Rain-Shadow Mechanism)
              </span>
              <span className="text-emerald-400">Orographic Lift +3.8mm/100m</span>
            </div>
            {/* Elevation Cut Diagram */}
            <div className="relative h-12 w-full flex items-end">
              <svg viewBox="0 0 500 50" className="w-full h-full overflow-visible">
                {/* Terrain Fill */}
                <polygon
                  points="0,50 0,28 100,24 180,10 260,18 360,42 500,40 500,50"
                  fill="#064E3B"
                  fillOpacity={0.6}
                  stroke="#10B981"
                  strokeWidth={1.5}
                />
                {/* Rain Clouds & Downpour Arrows */}
                <text x={180} y={6} fill="#86EFAC" fontSize={8} textAnchor="middle" fontFamily="monospace">
                  ▲ Ridge (375m)
                </text>
                <text x={80} y={20} fill="#FBBF24" fontSize={7} textAnchor="middle" fontFamily="monospace">
                  Narkhed 1.9mm (Dry Shadow)
                </text>
                <text x={260} y={14} fill="#86EFAC" fontSize={7} textAnchor="middle" fontFamily="monospace">
                  Dhapewada 4.2mm (Slope)
                </text>
                <text x={410} y={38} fill="#38BDF8" fontSize={7} textAnchor="middle" fontFamily="monospace">
                  Savner 11.4mm (Basin)
                </text>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interactive Panchayat Quick Select Chips ── */}
      <div className="bg-[#0B1526] border-x border-b border-white/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase tracking-wider font-mono text-white/50 mr-1 shrink-0">
          Inspect:
        </span>
        {nodes.map((n) => {
          const isSelected = n.id === selectedId
          return (
            <button
              key={n.id}
              onClick={() => handleNodeClick(n.id)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#126B3A] text-white shadow-xs ring-1 ring-[#86EFAC]/40'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <span>{n.label}</span>
              <span className={`font-mono text-[10px] ${isSelected ? 'text-[#86EFAC]' : 'text-white/50'}`}>
                {n.rainfall}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Real-Time Dynamic Advisory Card for the Selected Panchayat ── */}
      <div className="bg-[#070D18] border-x border-b border-white/10 rounded-b-xl p-4 text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2.5"
          >
            {/* Header row: Panchayat name + Elevation badge + Rain Delta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">
                  {selectedNode.label}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  {selectedNode.elevation}m &middot; {selectedNode.terrainType}
                </span>
                <span className="text-[10px] font-semibold text-white/50 hidden sm:inline">
                  Crop: {selectedNode.crop}
                </span>
              </div>

              {/* Rain Value & Delta vs Regional 18mm */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 font-mono font-bold text-sm text-[#86EFAC]">
                  <Droplets size={14} className="text-[#86EFAC]" />
                  <span>{selectedNode.rainfall}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                  {selectedNode.rainValue < 18
                    ? `-${(18 - selectedNode.rainValue).toFixed(1)}mm vs regional`
                    : `+${(selectedNode.rainValue - 18).toFixed(1)}mm vs regional`}
                </span>
              </div>
            </div>

            {/* Advisory rationale & Action Pill */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#86EFAC] shrink-0 mt-0.5" />
                <p className="text-xs text-white/85 leading-relaxed font-medium">
                  {selectedNode.advisory}
                </p>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-[#126B3A]/90 text-white border border-[#86EFAC]/30 shadow-xs">
                  {selectedNode.actionLabel}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
