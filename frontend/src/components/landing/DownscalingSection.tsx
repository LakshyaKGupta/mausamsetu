import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Database, Cpu, MapPin, Play, Pause } from 'lucide-react'
import { SectionReveal } from '../shared/SectionReveal'
import { WeatherField } from '../shared/WeatherField'

export const DownscalingSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const STEP_DURATION = 5000

  useEffect(() => {
    if (isPaused) return
    setProgress(0)
    const startTime = Date.now()
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min(100, (elapsed / STEP_DURATION) * 100))
    }, 50)
    timerRef.current = setTimeout(() => {
      setActiveStep((prev) => (prev >= 3 ? 1 : prev + 1))
    }, STEP_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [activeStep, isPaused])

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
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E8E4] text-[#126B3A] hover:bg-[#F6F9F5] transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
              <span>{isPaused ? 'Resume' : 'Auto-animating'}</span>
            </button>
            <span className="text-xs text-[#66736B]">Steps advance every 5s &middot; Click to inspect</span>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left: Steps */}
          <div
            className="lg:col-span-7 space-y-3"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {steps.map((s, idx) => {
              const Icon = s.icon
              const isSelected = activeStep === s.step
              return (
                <SectionReveal
                  key={s.step}
                  variant="stagger"
                  delay={idx * 100}
                  className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#EAF5EC]/70 border-[#126B3A] shadow-sm ring-1 ring-[#126B3A]/30'
                      : 'bg-white border-[#E2E8E4] hover:border-[#126B3A]/30 hover:bg-[#F6F9F5]'
                  }`}
                  onClick={() => { setActiveStep(s.step); setProgress(0) }}
                >
                  {isSelected && (
                    <div
                      className="absolute bottom-0 left-0 h-[2px] bg-[#126B3A] transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-all duration-200 ${
                      isSelected ? 'bg-[#126B3A] text-white' : 'bg-[#F1F5F9] text-[#66736B]'
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

          {/* Right: Spatial scientific visualization */}
          <div className="lg:col-span-5">
            <SectionReveal variant="scale">
              <div className="rounded-2xl bg-[#0B1120] border border-white/10 overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Spatial Visualization</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-0.5 rounded">Step {activeStep}/3</span>
                </div>

                <div className="relative px-2 py-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.35 }}
                    >
                      <WeatherField
                        phase={activeStep === 1 ? 'regional' : activeStep === 2 ? 'resolving' : 'panchayat'}
                        activeNodeId={activeStep === 3 ? 'dhapewada' : undefined}
                        showWind={activeStep >= 2}
                        showContours={true}
                        height={240}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="px-4 py-3 border-t border-white/10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep + 'ins'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {activeStep === 1 && (
                        <p className="text-[11px] text-amber-300 font-mono">
                          Uniform regional forecast — terrain elevation ignored
                        </p>
                      )}
                      {activeStep === 2 && (
                        <p className="text-[11px] text-blue-300 font-mono">
                          Integrating terrain data + station telemetry...
                        </p>
                      )}
                      {activeStep === 3 && (
                        <p className="text-[11px] text-[#86EFAC] font-mono">
                          Dhapewada: 4.2mm — Advisory: Hold irrigation 24h
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-center gap-2 pb-3">
                  {[1, 2, 3].map((step) => (
                    <button
                      key={step}
                      onClick={() => { setActiveStep(step); setProgress(0) }}
                      className={`rounded-full transition-all duration-300 ${
                        activeStep === step ? 'bg-[#126B3A] w-5 h-1.5' : 'bg-white/20 w-1.5 h-1.5 hover:bg-white/40'
                      }`}
                      aria-label={`Step ${step}`}
                    />
                  ))}
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
