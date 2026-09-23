import React, { useEffect, useRef, useState } from 'react'

interface PanchayatNode {
  id: string
  x: number // 0-100 percent of SVG width
  y: number // 0-100 percent of SVG height
  label: string
  rainfall: string
}

interface WeatherFieldProps {
  nodes?: PanchayatNode[]
  showWind?: boolean
  showContours?: boolean
  activeNodeId?: string
  phase?: 'regional' | 'resolving' | 'panchayat'
  className?: string
  height?: number
}

const DEFAULT_NODES: PanchayatNode[] = [
  { id: 'dhapewada', x: 42, y: 38, label: 'Dhapewada', rainfall: '4.2mm' },
  { id: 'mohpa', x: 68, y: 28, label: 'Mohpa', rainfall: '7.1mm' },
  { id: 'kalmeshwar', x: 28, y: 58, label: 'Kalmeshwar', rainfall: '2.8mm' },
  { id: 'savner', x: 72, y: 62, label: 'Savner', rainfall: '11.4mm' },
  { id: 'ramtek', x: 52, y: 70, label: 'Ramtek', rainfall: '5.6mm' },
  { id: 'narkhed', x: 20, y: 35, label: 'Narkhed', rainfall: '1.9mm' },
]

const WIND_VECTORS = [
  { x: 10, y: 25, angle: -12 },
  { x: 30, y: 15, angle: -8 },
  { x: 55, y: 20, angle: -15 },
  { x: 75, y: 30, angle: -10 },
  { x: 85, y: 50, angle: -6 },
  { x: 15, y: 55, angle: -18 },
  { x: 45, y: 80, angle: -12 },
  { x: 70, y: 80, angle: -9 },
]

export const WeatherField: React.FC<WeatherFieldProps> = ({
  nodes = DEFAULT_NODES,
  showWind = true,
  showContours = true,
  activeNodeId,
  phase = 'panchayat',
  className = '',
  height = 340,
}) => {
  const [tick, setTick] = useState(0)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    const animate = (now: number) => {
      if (now - lastRef.current > 60) {
        setTick((t) => t + 1)
        lastRef.current = now
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const svgH = height
  const svgW = 560
  const contourCx = svgW * 0.47
  const contourCy = svgH * 0.44

  const contourOpacity = phase === 'regional' ? 0.35 : phase === 'resolving' ? 0.22 : 0.14
  const nodeOpacity = phase === 'regional' ? 0.3 : phase === 'resolving' ? 0.7 : 1
  const windOpacity = phase === 'regional' ? 0.5 : 0.3

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={`w-full overflow-visible ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {/* Contour Rings */}
      {showContours && (
        <g opacity={contourOpacity}>
          {[100, 155, 210, 265, 320].map((r, i) => (
            <ellipse
              key={r}
              cx={contourCx}
              cy={contourCy}
              rx={r}
              ry={r * 0.58}
              fill="none"
              stroke="#10B981"
              strokeWidth={i === 0 ? 1.5 : 1}
              strokeDasharray={i % 2 === 0 ? undefined : '5 4'}
              strokeOpacity={0.35}
            />
          ))}
        </g>
      )}

      {/* Regional Forecast Block (Phase 1) */}
      {phase === 'regional' && (
        <g>
          {/* Coarse Regional Grid Box */}
          <rect
            x={svgW * 0.16}
            y={svgH * 0.18}
            width={svgW * 0.68}
            height={svgH * 0.64}
            rx={14}
            fill="#3B82F6"
            fillOpacity={0.1}
            stroke="#60A5FA"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          {/* Grid lines inside regional block to indicate coarse mesh */}
          <line
            x1={svgW * 0.5}
            y1={svgH * 0.18}
            x2={svgW * 0.5}
            y2={svgH * 0.82}
            stroke="#60A5FA"
            strokeOpacity={0.2}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <line
            x1={svgW * 0.16}
            y1={svgH * 0.5}
            x2={svgW * 0.84}
            y2={svgH * 0.5}
            stroke="#60A5FA"
            strokeOpacity={0.2}
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* Regional Value badge */}
          <rect
            x={svgW * 0.5 - 75}
            y={svgH * 0.35}
            width={150}
            height={44}
            rx={10}
            fill="#1E293B"
            fillOpacity={0.85}
            stroke="#60A5FA"
            strokeOpacity={0.4}
          />
          <text
            x={svgW * 0.5}
            y={svgH * 0.44}
            textAnchor="middle"
            fill="#93C5FD"
            fontSize={26}
            fontWeight={800}
            fontFamily="ui-monospace, monospace"
          >
            18.0 mm
          </text>
          <text
            x={svgW * 0.5}
            y={svgH * 0.59}
            textAnchor="middle"
            fill="#60A5FA"
            fontSize={10.5}
            fontFamily="ui-monospace, monospace"
            fontWeight={700}
            letterSpacing="0.08em"
          >
            UNIFORM REGIONAL FORECAST (40km)
          </text>
          <text
            x={svgW * 0.5}
            y={svgH * 0.67}
            textAnchor="middle"
            fill="#94A3B8"
            fontSize={9.5}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            Local terrain elevation & valley rain-shadows ignored
          </text>
        </g>
      )}

      {/* Resolving Phase: 30m DEM Elevation Grid Mesh (Phase 2) */}
      {phase === 'resolving' && (
        <g>
          {/* Wireframe DEM Grid Lines */}
          {[-60, -30, 0, 30, 60].map((offset, i) => (
            <line
              key={`h-${i}`}
              x1={svgW * 0.15}
              y1={contourCy + offset}
              x2={svgW * 0.85}
              y2={contourCy + offset}
              stroke="#34D399"
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          ))}
          {[-120, -60, 0, 60, 120].map((offset, i) => (
            <line
              key={`v-${i}`}
              x1={contourCx + offset}
              y1={svgH * 0.18}
              x2={contourCx + offset}
              y2={svgH * 0.82}
              stroke="#34D399"
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          ))}

          {/* Elevation Slope Contours */}
          <path
            d={`M ${svgW * 0.2} ${svgH * 0.65} Q ${svgW * 0.45} ${svgH * 0.35} ${svgW * 0.8} ${svgH * 0.5}`}
            fill="none"
            stroke="#10B981"
            strokeWidth={1.8}
            strokeDasharray="4 2"
            strokeOpacity={0.6}
          />
          <path
            d={`M ${svgW * 0.25} ${svgH * 0.75} Q ${svgW * 0.55} ${svgH * 0.45} ${svgW * 0.85} ${svgH * 0.6}`}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={1.2}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />

          {/* Calibrating telemetry pulse tag */}
          <rect
            x={svgW * 0.5 - 90}
            y={svgH * 0.22}
            width={180}
            height={26}
            rx={13}
            fill="#064E3B"
            fillOpacity={0.9}
            stroke="#10B981"
            strokeWidth={1}
          />
          <text
            x={svgW * 0.5}
            y={svgH * 0.22 + 17}
            textAnchor="middle"
            fill="#86EFAC"
            fontSize={9.5}
            fontWeight={700}
            fontFamily="ui-monospace, monospace"
            letterSpacing="0.05em"
          >
            30m DEM & TELEMETRY FUSION
          </text>
        </g>
      )}

      {/* Wind Vectors */}
      {showWind && (
        <g opacity={windOpacity}>
          {WIND_VECTORS.map((v, i) => {
            const offset = ((tick + i * 7) % 40) / 40
            const x1 = (v.x / 100) * svgW + offset * 28
            const y1 = (v.y / 100) * svgH + offset * 4
            const len = 28
            const rad = (v.angle * Math.PI) / 180
            const x2 = x1 + Math.cos(rad) * len
            const y2 = y1 + Math.sin(rad) * len
            const arrowX = x2 + Math.cos(rad - 0.5) * -6
            const arrowY = y2 + Math.sin(rad - 0.5) * -6
            return (
              <g key={i} opacity={0.7 - offset * 0.4 + 0.1}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#38BDF8"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <line
                  x1={x2}
                  y1={y2}
                  x2={arrowX}
                  y2={arrowY}
                  stroke="#38BDF8"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </g>
            )
          })}
        </g>
      )}

      {/* Panchayat Nodes (Visible in Resolving and Panchayat phases) */}
      {phase !== 'regional' &&
        nodes.map((n) => {
          const cx = (n.x / 100) * svgW
          const cy = (n.y / 100) * svgH
          const isActive = n.id === activeNodeId

          return (
            <g key={n.id} opacity={nodeOpacity}>
              {isActive && (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={26}
                    fill="#10B981"
                    fillOpacity={0.12}
                    className="animate-ping"
                    style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '2.5s' }}
                  />
                  <circle cx={cx} cy={cy} r={18} fill="#10B981" fillOpacity={0.2} />
                </>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 6.5 : 4}
                fill={isActive ? '#10B981' : '#38BDF8'}
                stroke={isActive ? '#FFFFFF' : '#0B1120'}
                strokeWidth={isActive ? 2 : 1}
              />
              <rect
                x={cx - 36}
                y={n.y < 50 ? cy - 38 : cy + 14}
                width={72}
                height={23}
                rx={5}
                fill={isActive ? '#064E3B' : '#0F172A'}
                fillOpacity={0.92}
                stroke={isActive ? '#10B981' : '#334155'}
                strokeWidth={isActive ? 1.5 : 1}
              />
              <text
                x={cx}
                y={n.y < 50 ? cy - 24 : cy + 28}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={9}
                fontWeight={700}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {n.label}
              </text>
              <text
                x={cx}
                y={n.y < 50 ? cy - 14 : cy + 39}
                textAnchor="middle"
                fill={isActive ? '#86EFAC' : '#7DD3FC'}
                fontSize={9}
                fontWeight={800}
                fontFamily="ui-monospace, monospace"
              >
                {n.rainfall}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
