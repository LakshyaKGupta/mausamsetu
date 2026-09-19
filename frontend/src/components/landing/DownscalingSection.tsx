import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mountain, Compass, MapPin, Layers, ArrowDown, Activity } from 'lucide-react'

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
      className="relative min-h-screen flex flex-col justify-center bg-white border-b border-[#E2E8E4] py-16 lg:py-24 overflow-hidden"
    >
      {/* Background contour lines */}
      <div className="absolute inset-0 opacity-25 bg-contour-pattern pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers size={14} />
            <span>01 • Geographic Downscaling & Weather Refinement</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#17201A] tracking-tight leading-tight">
            Coarse block forecasts fail farms. <br />
            <span className="text-[#166534]">Topography changes weather.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#647067] mt-4 leading-relaxed font-normal">
            A standard weather forecast covers a 40×40 km block as a single flat number. In reality, a 70-meter elevation change and ridge orientation creates completely different rainfall between neighboring villages.
          </p>
        </div>

        {/* Visual Pipeline & Interactive Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Spatial Zoom Hierarchy (India -> Maharashtra -> Nagpur -> Kalmeshwar -> Panchayat) */}
          <div className="lg:col-span-5 bg-[#F7FAF7] rounded-2xl border border-[#E2E8E4] p-6 sm:p-7 flex flex-col justify-between text-left relative">
            {/* Floating Data Tag */}
            <div className="absolute top-4 right-4 bg-white border border-[#E2E8E4] px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#166534] flex items-center gap-1.5 animate-float-subtle">
              <Activity size={12} />
              <span>Resolution: 40km → 1km</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#17201A] mb-1">
                Spatial Downscaling Hierarchy
              </h3>
              <p className="text-xs text-[#647067] mb-6">
                Progressive geospatial resolution zooming into the micro-basin.
              </p>

              {/* Geographic Steps */}
              <div className="space-y-3">
                {[
                  { level: 'National Grid', name: 'India (IMD Regional Model)', res: '0.25° (~25 km)', active: false },
                  { level: 'State Model', name: 'Maharashtra Agro-Zone VII', res: '12 km', active: false },
                  { level: 'District Forecast', name: 'Nagpur District Hub', res: '9 km', active: false },
                  { level: 'Official Block', name: 'Kalmeshwar Block Forecast', res: 'Single coarse 12.0 mm', active: false },
                  { level: 'MausamSetu Panchayat', name: `${current.name} Panchayat`, res: `Topographic: ${dynamicRefined} mm`, active: true },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      step.active
                        ? 'bg-white border-[#166534] shadow-sm ring-1 ring-[#166534]'
                        : 'bg-white/60 border-[#E2E8E4] opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          step.active
                            ? 'bg-[#166534] text-white'
                            : 'bg-[#E2E8E4] text-[#647067]'
                        }`}
                      >
                        0{idx + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${step.active ? 'text-[#166534]' : 'text-[#17201A]'}`}>
                          {step.level}
                        </p>
                        <p className="text-sm font-semibold text-[#17201A]">{step.name}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      step.active ? 'bg-[#DCFCE7] text-[#14532D] font-bold' : 'bg-[#F1F5F9] text-[#647067]'
                    }`}>
                      {step.res}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-6 pt-4 border-t border-[#E2E8E4] flex items-center justify-between text-xs text-[#647067]">
              <span>Ground Stations: 8 AWS in Nagpur</span>
              <span className="font-semibold text-[#166534]">Haversine Spatially Calibrated</span>
            </div>
          </div>

          {/* Right: Interactive Downscaling Comparison */}
          <div className="lg:col-span-7 bg-[#F7FAF7] rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 flex flex-col justify-between text-left">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#17201A]">
                    Coarse Block vs. Topographic Micro-Forecast
                  </h3>
                  <p className="text-xs text-[#647067] mt-0.5">
                    Select a Panchayat to observe how terrain alters official forecasts.
                  </p>
                </div>

                {/* Village Selector */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E2E8E4]">
                  {panchayats.map((p, idx) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPanchayatIndex(idx)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        selectedPanchayatIndex === idx
                          ? 'bg-[#166534] text-white shadow-sm'
                          : 'text-[#647067] hover:bg-[#F7FAF7]'
                      }`}
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Visual Split Comparison Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Coarse Block Box */}
                <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[#647067] font-semibold mb-2">
                    <span>COARSE BLOCK FORECAST</span>
                    <span className="text-[#D97706] font-mono">IMD Regional</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#17201A] tracking-tight">
                    {current.coarseRain.toFixed(1)} <span className="text-base font-medium text-[#647067]">mm</span>
                  </div>
                  <p className="text-xs text-[#647067] mt-2 leading-relaxed">
                    Same 12.0 mm applied indiscriminately across all 84 villages in Kalmeshwar block.
                  </p>
                </div>

                {/* MausamSetu Topographic Refinement */}
                <div className="bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[#166534] font-bold mb-2">
                    <span>MAUSAMSETU REFINED</span>
                    <span className="bg-[#DCFCE7] text-[#14532D] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      ±0.11 mm Error
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#166534] tracking-tight">
                    {dynamicRefined} <span className="text-base font-medium text-[#166534]/70">mm</span>
                  </div>
                  <p className="text-xs text-[#14532D] mt-2 leading-relaxed">
                    Refined via XGBoost with DEM elevation, aspect angle, and moisture gradient.
                  </p>
                </div>
              </div>

              {/* Geographic Features Active for this Panchayat */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#166534] mb-1">
                    <Mountain size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067]">Elevation</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{current.elevation} m</p>
                </div>

                <div className="bg-white border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#166534] mb-1">
                    <Compass size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067]">Aspect & Slope</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{current.slope} ({current.aspect.split(' ')[0]})</p>
                </div>

                <div className="bg-white border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#166534] mb-1">
                    <Layers size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067]">Soil Substrate</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{current.soil.split(' ')[0]}</p>
                </div>
              </div>

              {/* Interactive Elevation Bias Slider */}
              <div className="bg-white border border-[#E2E8E4] rounded-xl p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#17201A] mb-2">
                  <span className="flex items-center gap-1.5">
                    <Mountain size={14} className="text-[#166534]" />
                    Interactive Topographic Bias: {elevationOffset}m relative offset
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
                  className="w-full h-2 bg-[#E2E8E4] rounded-lg appearance-none cursor-pointer accent-[#166534]"
                />
                <p className="text-[11px] text-[#647067] mt-2 italic">
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
