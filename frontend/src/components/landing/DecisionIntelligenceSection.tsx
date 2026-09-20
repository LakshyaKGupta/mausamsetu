import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, CheckCircle, Droplet, Wind, ShieldCheck, AlertTriangle } from 'lucide-react'

export const DecisionIntelligenceSection: React.FC = () => {
  const [activeCrop, setActiveCrop] = useState<'soybean' | 'cotton' | 'wheat'>('soybean')

  const cropIntelligence = {
    soybean: {
      name: 'Soybean (सोयाबीन)',
      stage: 'Pod Formation / Flowering (R3 Stage)',
      weatherCondition: '4.2 mm light rain, 72% RH, 28°C',
      soilMoisture: '28% (Adequate root zone moisture)',
      risks: [
        { label: 'Rust / Fungal Spore Spread', severity: 'MODERATE', detail: 'High humidity over 70% favors pathogen incubation' },
        { label: 'Waterlogging Risk', severity: 'LOW', detail: 'Well-drained black soil absorbs up to 15mm/hr' },
      ],
      recommendations: [
        {
          action: 'सिंचाई 24 घंटे टालें (Hold Irrigation)',
          status: 'RECOMMENDED',
          rationale: 'Topographic light rain (4.2mm) with low evaporation maintains soil moisture above field capacity.',
        },
        {
          action: 'फफूंदनाशक स्प्रे (Fungicide Spray)',
          status: 'SCHEDULE_WINDOW',
          rationale: 'Hold spray until leaves dry completely tomorrow morning. Wind speed 14 km/h is within safe drift limits.',
        },
      ],
    },
    cotton: {
      name: 'Cotton (कपास)',
      stage: 'Boll Development (90-120 DAS)',
      weatherCondition: '6.8 mm rainfall, 78% RH, 27°C',
      soilMoisture: '34% (Approaching saturation)',
      risks: [
        { label: 'Boll Rot (फफूंद रोग)', severity: 'HIGH', detail: 'Prolonged leaf wetness > 8 hours accelerates fungal ingress' },
        { label: 'Pesticide Wash-off', severity: 'HIGH', detail: 'Rainfall exceeds 5mm, rendering chemical sprays ineffective' },
      ],
      recommendations: [
        {
          action: 'रासायनिक छिड़काव स्थगित (Postpone Chemical Spray)',
          status: 'CRITICAL',
          rationale: 'Rainfall exceeding 6mm washes active ingredients into soil runoff. Postpone by 48 hours.',
        },
        {
          action: 'जल निकासी नाली साफ करें (Clear Drainage Channels)',
          status: 'RECOMMENDED',
          rationale: 'Prevent standing water at boll base to avoid root hypoxia and premature boll drop.',
        },
      ],
    },
    wheat: {
      name: 'Wheat (गेहूं)',
      stage: 'Crown Root Initiation (21-25 DAS)',
      weatherCondition: '1.5 mm drizzle, 65% RH, 29°C',
      soilMoisture: '18% (Deficit threshold)',
      risks: [
        { label: 'CRI Stage Water Stress', severity: 'HIGH', detail: 'Moisture deficit during crown root formation cuts yield by 20%' },
        { label: 'Terminal Heat Stress', severity: 'LOW', detail: 'Current temperature 29°C within vegetative threshold' },
      ],
      recommendations: [
        {
          action: 'हल्की सिंचाई आवश्यक (Apply Light CRI Irrigation)',
          status: 'RECOMMENDED',
          rationale: '1.5mm drizzle is insufficient for root zone saturation. Proceed with 30mm sprinkler irrigation in calm evening.',
        },
        {
          action: 'यूरिया की पहली खुराक (Top-dress First Urea Split)',
          status: 'SCHEDULE_WINDOW',
          rationale: 'Broadcast nitrogen immediately preceding irrigation for uniform root absorption.',
        },
      ],
    },
  }

  const current = cropIntelligence[activeCrop]

  return (
    <section
      id="decision-intelligence"
      className="snap-section relative w-full bg-[#F7FAF7] border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden"
    >
      {/* Floating Telemetry Icon 1: Fungal Spore Index */}
      <div className="hidden xl:flex absolute top-8 left-16 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#FDE68A] shadow-xs text-xs font-semibold text-[#92400E] animate-float-slow backdrop-blur-sm">
        <AlertTriangle size={13} className="text-[#D97706]" />
        <span>Spore Ingress Index: Moderate (RH &gt; 70%)</span>
      </div>

      {/* Floating Telemetry Icon 2: Spray Window Indicator */}
      <div className="hidden xl:flex absolute bottom-8 right-16 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#BBF7D0] shadow-xs text-xs font-semibold text-[#166534] animate-float-drift backdrop-blur-sm">
        <Wind size={13} className="text-[#166534]" />
        <span>Spray Window: Clear 06:00 - 10:00 AM (Wind &lt; 15 km/h)</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-4 sm:mb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sprout size={13} />
            <span>02 • Decision Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#17201A] tracking-tight leading-tight">
            Weather is just data. <br />
            <span className="text-[#166534]">Farmers need decisions.</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#647067] mt-1.5 leading-relaxed font-normal">
            A farmer does not ask for millimetres of precipitation. They ask: "Should I irrigate today? Should I spray pesticide? Will my fertilizer wash away?" MausamSetu translates micro-climate parameters directly into crop action rules.
          </p>
        </div>

        {/* The 3-Step Translation Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Column: Crop Switcher & Live Phenology */}
          <div className="lg:col-span-4 space-y-3 text-left">
            <div className="bg-white rounded-2xl border border-[#E2E8E4] p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 text-[#166534]">
                Select Farm Crop
              </h3>
              <div className="space-y-1.5">
                {(['soybean', 'cotton', 'wheat'] as const).map((cropKey) => {
                  const crop = cropIntelligence[cropKey]
                  const isSelected = activeCrop === cropKey
                  return (
                    <button
                      key={cropKey}
                      onClick={() => setActiveCrop(cropKey)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#166534] ring-1 ring-[#166534]'
                          : 'bg-white border-[#E2E8E4] hover:bg-[#F7FAF7]'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-[#166534]' : 'text-[#17201A]'}`}>
                          {crop.name}
                        </p>
                        <p className="text-[10px] text-[#647067] mt-0.5">{crop.stage.split('(')[0]}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#166534]' : 'bg-[#E2E8E4]'}`} />
                    </button>
                  )
                })}
              </div>

              {/* Crop Phenology Status */}
              <div className="mt-3 pt-2.5 border-t border-[#E2E8E4] space-y-1 text-[11px] text-[#647067]">
                <div className="flex items-center justify-between">
                  <span>Growth Stage:</span>
                  <strong className="text-[#17201A]">{current.stage.split('(')[0]}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Soil Moisture:</span>
                  <strong className="text-[#166534]">{current.soilMoisture.split(' ')[0]}</strong>
                </div>
              </div>
            </div>

            {/* Contextual Sensor Indicator */}
            <div className="bg-white rounded-2xl border border-[#E2E8E4] p-3.5 shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17201A]">
                <Droplet size={13} className="text-[#3B82F6]" />
                <span>Micro-Climate Sensor Inputs</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#F8FAFC] border border-[#E2E8E4] p-2 rounded-lg">
                  <p className="text-[#647067]">Air RH</p>
                  <p className="font-bold text-[#17201A]">72% Relative</p>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8E4] p-2 rounded-lg">
                  <p className="text-[#647067]">Leaf Wetness</p>
                  <p className="font-bold text-[#17201A]">4.8 Hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Grounded Decision Pipeline */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8E4] p-5 sm:p-6 shadow-xs text-left relative">
            {/* Trust Indicator */}
            <div className="absolute top-5 right-5 bg-[#DCFCE7] text-[#14532D] text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>ICAR / KVK Agronomic Rules</span>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#17201A]">
                {current.name} • Agronomic Risk & Decision Output
              </h3>
              <p className="text-[11px] text-[#647067] mt-0.5">
                Automated rule execution based on localized 4.2mm rain prediction.
              </p>
            </div>

            {/* Risk Assessment Matrix */}
            <div className="mb-4">
              <h4 className="text-[10px] font-bold text-[#647067] uppercase tracking-wider mb-2">
                1. Crop Vulnerability & Environmental Risk
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      risk.severity === 'HIGH'
                        ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                        : 'bg-[#FFFBEB] border-[#FDE68A]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#17201A]">{risk.label}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          risk.severity === 'HIGH' ? 'bg-[#DC2626] text-white' : 'bg-[#D97706] text-white'
                        }`}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#647067] leading-relaxed">{risk.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Field Decisions */}
            <div>
              <h4 className="text-[10px] font-bold text-[#647067] uppercase tracking-wider mb-2">
                2. Direct Farmer Decisions (किसान के लिए निर्णय)
              </h4>
              <div className="space-y-2">
                {current.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#166534] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h5 className="text-xs font-bold text-[#14532D]">{rec.action}</h5>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#14532D]">
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#166534] leading-relaxed">{rec.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Footer */}
            <div className="mt-4 pt-3 border-t border-[#E2E8E4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#647067]">
              <span>Rule Engine: Crop Phenology + Soil Water Balance</span>
              <span className="font-semibold text-[#166534]">Zero Hallucination Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
