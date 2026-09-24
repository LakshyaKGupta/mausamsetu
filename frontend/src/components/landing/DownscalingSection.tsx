import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  Database,
  Cpu,
  MapPin,
  AlertTriangle,
  Mountain,
  Wind,
  CheckCircle2,
} from 'lucide-react'
import { SectionReveal } from '../shared/SectionReveal'

export const DownscalingSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1)

  const STEP_DURATION = 4500

  // Butter-smooth auto-animation cycling through steps without React interval lag
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 3 ? 1 : prev + 1))
    }, STEP_DURATION)
    return () => clearInterval(timer)
  }, [])

  const steps = [
    {
      step: 1,
      icon: Database,
      title: '1. Ingest Coarse National Forecasts',
      subtitle: 'Regional Grid Ingestion',
      desc: 'Numerical weather models divide India into large regional blocks. Every Panchayat inside a block receives the same broad prediction — ignoring terrain variation completely.',
      metric: 'Coarse',
      metricLabel: 'Base Forecast',
    },
    {
      step: 2,
      icon: Cpu,
      title: '2. Terrain & Sensor Fusion',
      subtitle: 'Local Feature Calibration',
      desc: 'Our models integrate elevation data, valley slope angles, ridge aspect vectors, and local ground-station telemetry to account for orographic lift and rain-shadow effects.',
      metric: '30m DEM',
      metricLabel: 'Terrain Resolution',
    },
    {
      step: 3,
      icon: MapPin,
      title: '3. Panchayat-Level Dispatch',
      subtitle: 'Hyperlocal Precision',
      desc: 'Farmers and local authorities receive tailored predictions accounting for local rain-shadows, ridge winds, and soil moisture — ready for officer verification.',
      metric: 'Local',
      metricLabel: 'Panchayat Scale',
    },
  ]

  return (
    <section
      id="downscaling"
      className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] w-full bg-white border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden py-12 lg:py-10"
    >
      <div className="absolute inset-0 bg-topo-animated opacity-25 pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-[10%] right-[15%] w-[420px] h-[420px] rounded-full bg-[#EAF5EC]/60 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
        <SectionReveal variant="default" className="max-w-3xl mb-6 sm:mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EC] border border-[#126B3A]/20 text-[#126B3A] text-xs font-mono font-semibold uppercase tracking-wider mb-2.5">
            <Layers size={13} />
            <span>Methodology &middot; Section 01</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#111814] tracking-tight leading-[1.08]">
            From Coarse Forecast to{' '}
            <span className="text-[#126B3A]">Panchayat Precision</span>
          </h2>
          <p className="text-sm sm:text-base text-[#66736B] mt-2 leading-relaxed">
            Standard weather forecasts treat entire districts as flat, uniform zones. In reality,
            elevation and terrain gradients dramatically alter weather between neighbouring Panchayats.
          </p>
        </SectionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left: Steps */}
          <div className="lg:col-span-6 space-y-3">
            {steps.map((s, idx) => {
              const Icon = s.icon
              const isSelected = activeStep === s.step
              return (
                <SectionReveal
                  key={s.step}
                  variant="stagger"
                  delay={idx * 80}
                  className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#EAF5EC]/70 border-[#126B3A] shadow-sm ring-1 ring-[#126B3A]/30'
                      : 'bg-white border-[#E2E8E4] hover:border-[#126B3A]/30 hover:bg-[#F6F9F5]'
                  }`}
                  onClick={() => setActiveStep(s.step)}
                >
                  {isSelected && (
                    <motion.div
                      key={`downscale-progress-${activeStep}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 4.5, ease: 'linear' }}
                      style={{ originX: 0 }}
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#126B3A] will-change-transform pointer-events-none"
                    />
                  )}
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-all duration-200 ${
                      isSelected ? 'bg-[#126B3A] text-white shadow-xs' : 'bg-[#F1F5F9] text-[#66736B]'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-[#126B3A]' : 'text-[#66736B]'
                        }`}>{s.subtitle}</span>
                        <span className="text-xs font-mono font-black text-[#126B3A] hidden sm:block">{s.metric}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#111814] mt-0.5">{s.title}</h3>
                      <p className="text-xs text-[#66736B] mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </SectionReveal>
              )
            })}
          </div>

          {/* Right Column: Interactive Mobile Phone Mockup Matching Site Colors */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            {/* Quick Step Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3.5 max-w-sm">
              {[
                { step: 1, label: '1. Regional 40km' },
                { step: 2, label: '2. 30m DEM Physics' },
                { step: 3, label: '3. Field Precision' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                    activeStep === s.step
                      ? 'bg-[#126B3A] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8E4] text-[#66736B] hover:text-[#111814]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Mobile Phone Mockup */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full max-w-[340px] rounded-[42px] bg-[#0F172A] p-3 shadow-2xl border-4 border-[#1E293B] relative will-change-transform"
            >
              {/* Dynamic Island / Notch */}
              <div className="w-20 h-4 bg-[#1E293B] rounded-full mx-auto mb-2" />

              {/* Phone Screen Container matching brand design system */}
              <div className="rounded-[28px] bg-[#F6F9F5] overflow-hidden p-3.5 space-y-2.5 text-left border border-[#E2E8E4] min-h-[380px] flex flex-col justify-between">
                {/* Phone Top Bar */}
                <div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-0.5 pb-1 border-b border-[#E2E8E4]">
                    <span>09:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#126B3A] font-bold">5G</span>
                      <div className="w-3.5 h-1.5 rounded-xs border border-slate-400 p-0.5 flex items-center">
                        <div className="w-full h-full bg-[#126B3A] rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 pb-1 border-b border-[#E2E8E4]/60">
                    <span className="font-bold text-xs text-[#126B3A] flex items-center gap-1">
                      <MapPin size={12} className="text-[#126B3A]" />
                      MausamSetu
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      activeStep === 1
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : activeStep === 2
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {activeStep === 1 ? 'Regional 40km' : activeStep === 2 ? '30m DEM Physics' : 'Hyperlocal Live'}
                    </span>
                  </div>
                </div>

                {/* Animated Screen Content */}
                <div className="flex-1 py-1">
                  <AnimatePresence mode="wait">
                    {/* Screen Step 1: Coarse Regional Forecast */}
                    {activeStep === 1 && (
                      <motion.div
                        key="screen-step-1"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-2.5"
                      >
                        <div className="p-3 rounded-2xl bg-white border border-[#E2E8E4] shadow-xs">
                          <div className="flex items-center justify-between text-[9px] font-mono text-[#66736B]">
                            <span>Nagpur District Grid</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">40×40 km Block</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-[#111814]">28°C</span>
                            <span className="text-xs font-bold text-[#3B82F6]">15-40 mm Rain</span>
                          </div>
                          <p className="text-[10px] text-[#66736B] mt-0.5">District-wide coarse average</p>
                        </div>

                        {/* Coarse limitation note */}
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            <span>Unadjusted Regional Block</span>
                          </div>
                          <p className="text-[9.5px] leading-relaxed text-amber-800">
                            All 780 Panchayats receive the same generic number. Ignores ridge elevation, valley runoff, and local rain shadows.
                          </p>
                        </div>

                        {/* Uniform Panchayats */}
                        <div className="space-y-1 pt-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#66736B]">Uniform Output Across Villages</span>
                          <div className="grid grid-cols-3 gap-1 text-center">
                            {['Dhapewada', 'Mohpa', 'Kalmeshwar'].map((name) => (
                              <div key={name} className="p-1 rounded-lg bg-white border border-[#E2E8E4] text-[9.5px]">
                                <span className="block text-[#66736B] truncate">{name}</span>
                                <span className="font-bold text-slate-700">28mm (Flat)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Screen Step 2: 30m DEM Physics & Sensor Calibration */}
                    {activeStep === 2 && (
                      <motion.div
                        key="screen-step-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-2.5"
                      >
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0B4F2A] to-[#126B3A] text-white shadow-sm">
                          <div className="flex items-center justify-between text-[9px] font-mono text-emerald-200">
                            <span>Terrain Mesh</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">30m DEM Resolution</span>
                          </div>
                          <p className="text-lg font-black mt-1">Orographic Lift Analysis</p>
                          <p className="text-[10px] text-emerald-100 mt-0.5">Elevation gradient: 295m ➔ 375m</p>
                        </div>

                        {/* Physics Calibration Metrics */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="p-2 rounded-xl bg-white border border-[#E2E8E4]">
                            <div className="flex items-center gap-1 text-[9px] text-[#66736B] font-semibold">
                              <Mountain size={11} className="text-[#126B3A]" />
                              <span>Slope Gradient</span>
                            </div>
                            <p className="text-xs font-bold text-[#111814] mt-0.5">14° Windward Aspect</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-[#E2E8E4]">
                            <div className="flex items-center gap-1 text-[9px] text-[#66736B] font-semibold">
                              <Wind size={11} className="text-blue-500" />
                              <span>Ridge Vector</span>
                            </div>
                            <p className="text-xs font-bold text-[#111814] mt-0.5">18 km/h SW Flow</p>
                          </div>
                        </div>

                        {/* Ground Telemetry Match */}
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <Cpu size={12} className="text-[#126B3A]" />
                            <span>Ground Station Calibration</span>
                          </div>
                          <p className="text-[9.5px] text-[#126B3A] mt-0.5 leading-relaxed">
                            Rain-shadow leeward dissipation factored into numerical model in real time.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Screen Step 3: Panchayat Precision Dispatched */}
                    {activeStep === 3 && (
                      <motion.div
                        key="screen-step-3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-2.5"
                      >
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#126B3A] to-[#0B4F2A] text-white shadow-sm">
                          <div className="flex items-center justify-between text-[9px] font-mono text-emerald-200">
                            <span>Dhapewada Gram Panchayat</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">Verified Hyperlocal</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-2xl font-black">4.2 mm</span>
                            <span className="text-xs font-semibold text-emerald-200">27°C • 348m Ridge</span>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-white/20 flex items-center justify-between text-[9.5px]">
                            <span className="font-bold text-emerald-100">Advisory: Hold irrigation 24h</span>
                            <CheckCircle2 size={12} className="text-[#86EFAC]" />
                          </div>
                        </div>

                        {/* Distinct Local Contrast */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#66736B]">Neighbouring Panchayat Contrast</span>
                          <div className="space-y-1">
                            <div className="p-1.5 rounded-lg bg-white border border-[#126B3A]/30 flex items-center justify-between text-[9.5px]">
                              <span className="font-bold text-[#126B3A]">Dhapewada (348m)</span>
                              <span className="font-bold text-[#111814]">4.2mm • Hold Drip</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-white border border-[#E2E8E4] flex items-center justify-between text-[9.5px]">
                              <span className="text-[#66736B]">Mohpa (320m)</span>
                              <span className="font-bold text-amber-700">7.1mm • Spray Delay</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-white border border-[#E2E8E4] flex items-center justify-between text-[9.5px]">
                              <span className="text-[#66736B]">Kalmeshwar (305m)</span>
                              <span className="font-bold text-blue-700">2.8mm • Normal Drip</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom App Bar */}
                <div className="pt-1 border-t border-[#E2E8E4]">
                  <div className="flex items-center justify-between text-[8.5px] text-[#66736B] font-semibold px-1">
                    <span className="flex items-center gap-1 text-[#126B3A] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#126B3A] animate-pulse" />
                      Live Panchayat Telemetry
                    </span>
                    <span>Nagpur East</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
