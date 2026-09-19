import React, { useState } from 'react'
import { SectionHeading } from '../../components/shared/SectionHeading'
import { Database, Mountain, Cpu, ShieldCheck, Sprout, UserCheck, ArrowRight, Layers, HelpCircle } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Link } from 'react-router-dom'

export const HowItWorksPage: React.FC = () => {
  const [elevationDelta, setElevationDelta] = useState(60) // in meters

  // Elevation impact formula: ~0.06 mm rainfall difference per 10m elevation in this regional pilot
  const baseRainfall = 18.5
  const localizedRain = (baseRainfall + (elevationDelta / 10) * 0.06).toFixed(1)
  const localTemp = (30.2 - (elevationDelta / 100) * 0.65).toFixed(1)

  return (
    <div className="py-12 sm:py-20 bg-[#F7FAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Header */}
        <SectionHeading
          eyebrow="Scientific Architecture"
          title="How MausamSetu downscales weather to your Panchayat."
          subtitle="Understanding the machine learning, topographic correction, and human verification pipeline that turns regional data into farm survival decisions."
        />

        {/* Interactive Downscaling Simulator */}
        <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 sm:p-10 shadow-sm text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E4] pb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#166534] bg-[#DCFCE7] px-3 py-1 rounded-full">
                Interactive Principle
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#17201A] mt-2">
                Topographic Downscaling Simulator
              </h3>
              <p className="text-xs sm:text-sm text-[#647067] mt-1">
                See how elevation differences within the same block alter localized rainfall and temperature.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-[#647067] font-medium">Regional Block Baseline:</span>
              <p className="text-base font-bold text-slate-800">Kalmeshwar Block (18.5 mm · 30.2°C)</p>
            </div>
          </div>

          {/* Elevation Slider Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#17201A]">
              <span>Panchayat Elevation Delta (Relative to Block Center):</span>
              <span className="text-[#166534] text-sm bg-[#DCFCE7] px-2.5 py-1 rounded-lg">
                +{elevationDelta} meters
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="200"
              step="10"
              value={elevationDelta}
              onChange={(e) => setElevationDelta(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#166534]"
            />
            <div className="flex justify-between text-[11px] text-[#647067]">
              <span>Valley Floor (-100m)</span>
              <span>Block Average (0m)</span>
              <span>Hill Contour (+200m)</span>
            </div>
          </div>

          {/* Resulting Downscaled Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
              <span className="text-xs text-[#166534] font-semibold">Refined Rainfall</span>
              <p className="text-3xl font-extrabold text-[#166534] mt-1">{localizedRain} mm</p>
              <p className="text-[11px] text-[#14532D] mt-1">
                {elevationDelta >= 0 ? `+${(Number(localizedRain) - baseRainfall).toFixed(1)} mm orographic lift` : `${(Number(localizedRain) - baseRainfall).toFixed(1)} mm rain shadow`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
              <span className="text-xs text-[#2563EB] font-semibold">Refined Temperature</span>
              <p className="text-3xl font-extrabold text-[#2563EB] mt-1">{localTemp}°C</p>
              <p className="text-[11px] text-[#1e40af] mt-1">
                Environmental lapse rate: ~0.65°C / 100m
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
              <span className="text-xs text-[#D97706] font-semibold">Agricultural Impact</span>
              <p className="text-sm font-bold text-[#92400E] mt-1">
                {Number(localizedRain) > 19.5 ? 'Delay irrigation; risk of root fungal rot.' : 'Proceed with planned irrigation cycle.'}
              </p>
              <p className="text-[11px] text-[#92400E] mt-1">Crop: Soybean (Rabi cycle)</p>
            </div>
          </div>
        </div>

        {/* The 4 Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-white rounded-3xl border border-[#E2E8E4] p-7 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold">
              <Database size={24} />
            </div>
            <h4 className="text-xl font-bold text-[#17201A]">1. Multi-Source Ingestion</h4>
            <p className="text-sm text-[#647067] leading-relaxed">
              MausamSetu harmonizes forecasts from the India Meteorological Department (IMD) API, ECMWF ERA5 reanalysis, and real-time Open-Meteo feeds, ensuring high availability even if an individual data source experiences latency.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8E4] p-7 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold">
              <Mountain size={24} />
            </div>
            <h4 className="text-xl font-bold text-[#17201A]">2. Geospatial Topography (SRTM DEM)</h4>
            <p className="text-sm text-[#647067] leading-relaxed">
              Each Gram Panchayat is mapped to precise latitude, longitude, and 30-meter Digital Elevation Model (DEM) data. Micro-topographical gradients explain why two villages 5 km apart often receive starkly different rainfall amounts.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8E4] p-7 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold">
              <Cpu size={24} />
            </div>
            <h4 className="text-xl font-bold text-[#17201A]">3. Calibrated Uncertainty (±E80)</h4>
            <p className="text-sm text-[#647067] leading-relaxed">
              Every downscaled prediction is accompanied by a statistical uncertainty margin. If predicted rainfall falls within an uncertain boundary, the advisory engine conservatively favors protecting the farmer's seed and pesticide investment.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8E4] p-7 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold">
              <UserCheck size={24} />
            </div>
            <h4 className="text-xl font-bold text-[#17201A]">4. Extension Officer Verification</h4>
            <p className="text-sm text-[#647067] leading-relaxed">
              Before an advisory is published, Block Agricultural Officers review the recommendations. Officers have local knowledge of irrigation canal schedules, pest outbreaks, and ground water levels that no meteorological model can see.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 rounded-3xl bg-[#166534] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">Ready to see MausamSetu in action?</h3>
            <p className="text-sm text-[#DCFCE7]">
              Explore the live farmer PWA or test the agricultural officer console.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/app/farmer">
              <button className="px-5 py-2.5 rounded-xl bg-white text-[#166534] font-bold text-sm hover:bg-[#F7FAF7] transition-all">
                Farmer App
              </button>
            </Link>
            <Link to="/officers">
              <button className="px-5 py-2.5 rounded-xl bg-[#14532D] text-white border border-white/20 font-medium text-sm hover:bg-[#0f3d21] transition-all">
                Officer Overview
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorksPage
