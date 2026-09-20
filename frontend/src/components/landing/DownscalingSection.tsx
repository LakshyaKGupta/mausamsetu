import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mountain, Compass, Layers, Activity, TrendingUp, Radio } from 'lucide-react'

export const DownscalingSection: React.FC = () => {
  const [selectedPanchayatIndex, setSelectedPanchayatIndex] = useState(0)
  const [elevationOffset, setElevationOffset] = useState(35) // meters above base

  const panchayats = [
    {
      name: 'Dhapewada',
      elevation: 295,
      coarseRain: 12.0,
      refinedRain: 4.2,
      aspect: 'North-East (38°)',
      slope: '3.8°',
      soil: 'Black Clay Loam',
      note: 'Rain shadow leeward depression reduces localized precipitation.',
    },
    {
      name: 'Kalmeshwar Central',
      elevation: 320,
      coarseRain: 12.0,
      refinedRain: 8.6,
      aspect: 'Flat (0°)',
      slope: '1.2°',
      soil: 'Medium Black',
      note: 'Plateau basin closely mirrors regional convective rainfall.',
    },
    {
      name: 'Mohpa Ridge',
      elevation: 365,
      coarseRain: 12.0,
      refinedRain: 14.1,
      aspect: 'South-West (215°)',
      slope: '7.4°',
      soil: 'Shallow Gravelly',
      note: 'Orographic lift along windward ridge increases precipitation by +17.5%.',
    },
  ]

  const current = panchayats[selectedPanchayatIndex]
  // Simulated dynamic lapse calculation based on slider
  const dynamicRefined = (current.coarseRain * (1 + (elevationOffset - 35) * 0.008)).toFixed(1)

  return (
    <section
      id="downscaling"
      className="snap-section relative w-full bg-white border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden"
    >
      {/* Background contour lines */}
      <div className="absolute inset-0 opacity-25 bg-contour-pattern pointer-events-none" />

      {/* Floating Telemetry Icon 1: SRTM DEM Grid */}
      <div className="hidden xl:flex absolute top-8 right-16 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#E2E8E4] shadow-xs text-xs font-semibold text-[#14532D] animate-float-slow backdrop-blur-sm">
        <Layers size={14} className="text-[#166534]" />
        <span>30m SRTM Digital Elevation Model</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse" />
      </div>

      {/* Floating Telemetry Icon 2: Orographic Lift */}
      <div className="hidden xl:flex absolute bottom-8 left-14 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#BBF7D0] shadow-xs text-xs font-semibold text-[#166534] animate-float-drift backdrop-blur-sm">
        <TrendingUp size={14} className="text-[#166534]" />
        <span>Orographic Factor: +3.6 mm / 100m Ascent</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-4 sm:mb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers size={13} />
            <span>01 • Geographic Downscaling & Weather Refinement</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#17201A] tracking-tight leading-tight">
            Coarse block forecasts fail farms. <br />
            <span className="text-[#166534]">Topography changes weather.</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#647067] mt-1.5 leading-relaxed font-normal">
            A standard weather forecast covers a 40×40 km block as a single flat number. In reality, a 70-meter elevation change and ridge orientation creates completely different rainfall between neighboring villages.
          </p>
        </div>

        {/* Visual Pipeline & Interactive Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* Left: Spatial Zoom Hierarchy */}
          <div className="lg:col-span-5 bg-[#F7FAF7] rounded-2xl border border-[#E2E8E4] p-4 sm:p-5 flex flex-col justify-between text-left relative">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#17201A]">
                  Spatial Downscaling Hierarchy
                </h3>
                <span className="bg-white border border-[#E2E8E4] px-2 py-0.5 rounded text-[10px] font-semibold text-[#166534] flex items-center gap-1">
                  <Activity size={10} /> 40km → 1km
                </span>
              </div>

              {/* Geographic Steps */}
              <div className="space-y-2">
                {[
                  { level: 'National Grid', name: 'India (IMD Regional Model)', res: '0.25° (~25 km)', active: false },
                  { level: 'State Model', name: 'Maharashtra Agro-Zone VII', res: '12 km', active: false },
                  { level: 'District Forecast', name: 'Nagpur District Hub', res: '9 km', active: false },
                  { level: 'Official Block', name: 'Kalmeshwar Block Forecast', res: 'Coarse 12.0 mm', active: false },
                  { level: 'MausamSetu Panchayat', name: `${current.name} Panchayat`, res: `Refined: ${dynamicRefined} mm`, active: true },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      step.active
                        ? 'bg-white border-[#166534] shadow-xs ring-1 ring-[#166534]'
                        : 'bg-white/60 border-[#E2E8E4] opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                          step.active
                            ? 'bg-[#166534] text-white'
                            : 'bg-[#E2E8E4] text-[#647067]'
                        }`}
                      >
                        0{idx + 1}
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold ${step.active ? 'text-[#166534]' : 'text-[#647067]'}`}>
                          {step.level}
                        </p>
                        <p className="text-xs font-bold text-[#17201A]">{step.name}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      step.active ? 'bg-[#DCFCE7] text-[#14532D] font-bold' : 'bg-[#F1F5F9] text-[#647067]'
                    }`}>
                      {step.res}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-4 pt-3 border-t border-[#E2E8E4] flex items-center justify-between text-[11px] text-[#647067]">
              <span>Ground Stations: 8 AWS in Nagpur</span>
              <span className="font-semibold text-[#166534]">Haversine Spatially Calibrated</span>
            </div>
          </div>

          {/* Right: Interactive Downscaling Comparison */}
          <div className="lg:col-span-7 bg-[#F7FAF7] rounded-2xl border border-[#E2E8E4] p-4 sm:p-6 flex flex-col justify-between text-left">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#17201A]">
                    Coarse Block vs. Topographic Micro-Forecast
                  </h3>
                  <p className="text-[11px] text-[#647067]">
                    Select a Panchayat to observe how terrain alters official forecasts.
                  </p>
                </div>

                {/* Village Selector */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8E4]">
                  {panchayats.map((p, idx) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPanchayatIndex(idx)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                        selectedPanchayatIndex === idx
                          ? 'bg-[#166534] text-white shadow-xs'
                          : 'text-[#647067] hover:bg-[#F7FAF7]'
                      }`}
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Visual Split Comparison Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Coarse Block Box */}
                <div className="bg-white rounded-xl border border-[#E2E8E4] p-4 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#647067] font-semibold mb-1">
                    <span>COARSE BLOCK FORECAST</span>
                    <span className="text-[#D97706] font-mono">IMD Regional</span>
                  </div>
                  <div className="text-3xl font-black text-[#17201A] tracking-tight">
                    {current.coarseRain.toFixed(1)} <span className="text-sm font-medium text-[#647067]">mm</span>
                  </div>
                  <p className="text-[11px] text-[#647067] mt-1 leading-relaxed">
                    Same 12.0 mm applied indiscriminately across all 84 villages in Kalmeshwar block.
                  </p>
                </div>

                {/* MausamSetu Topographic Refinement */}
                <div className="bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] p-4 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#166534] font-bold mb-1">
                    <span>MAUSAMSETU REFINED</span>
                    <span className="bg-[#DCFCE7] text-[#14532D] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      ±0.11 mm Error
                    </span>
                  </div>
                  <div className="text-3xl font-black text-[#166534] tracking-tight">
                    {dynamicRefined} <span className="text-sm font-medium text-[#166534]/70">mm</span>
                  </div>
                  <p className="text-[11px] text-[#14532D] mt-1 leading-relaxed">
                    Refined via XGBoost with DEM elevation, aspect angle, and moisture gradient.
                  </p>
                </div>
              </div>

              {/* Geographic Features Active for this Panchayat */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="bg-white border border-[#E2E8E4] rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center text-[#166534] mb-0.5">
                    <Mountain size={14} />
                  </div>
                  <p className="text-[10px] text-[#647067]">Elevation</p>
                  <p className="text-xs font-bold text-[#17201A]">{current.elevation} m</p>
                </div>

                <div className="bg-white border border-[#E2E8E4] rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center text-[#166534] mb-0.5">
                    <Compass size={14} />
                  </div>
                  <p className="text-[10px] text-[#647067]">Aspect & Slope</p>
                  <p className="text-xs font-bold text-[#17201A]">{current.slope} ({current.aspect.split(' ')[0]})</p>
                </div>

                <div className="bg-white border border-[#E2E8E4] rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center text-[#166534] mb-0.5">
                    <Layers size={14} />
                  </div>
                  <p className="text-[10px] text-[#647067]">Soil Substrate</p>
                  <p className="text-xs font-bold text-[#17201A]">{current.soil.split(' ')[0]}</p>
                </div>
              </div>

              {/* Interactive Elevation Bias Slider */}
              <div className="bg-white border border-[#E2E8E4] rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#17201A] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Mountain size={13} className="text-[#166534]" />
                    Topographic Bias Simulation: {elevationOffset}m offset
                  </span>
                  <span className="font-mono text-[#166534] font-bold">
                    Refined: {dynamicRefined} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={elevationOffset}
                  onChange={(e) => setElevationOffset(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E2E8E4] rounded-lg appearance-none cursor-pointer accent-[#166534]"
                />
                <p className="text-[10px] text-[#647067] mt-1.5 italic">
                  * {current.note}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
