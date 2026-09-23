import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sprout, ArrowRight, CloudRain, Droplets, Thermometer,
  ShieldCheck, Languages, Volume2, WifiOff, Play, Pause, Sparkles,
} from 'lucide-react'
import { SectionReveal } from '../shared/SectionReveal'

export const DecisionIntelligenceSection: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<'soybean' | 'cotton' | 'wheat'>('soybean')
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const CROP_DURATION = 5500
  const crops: ('soybean' | 'cotton' | 'wheat')[] = ['soybean', 'cotton', 'wheat']

  useEffect(() => {
    if (isPaused) return
    setProgress(0)
    const startTime = Date.now()
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min(100, (elapsed / CROP_DURATION) * 100))
    }, 50)
    timerRef.current = setTimeout(() => {
      setSelectedCrop((prev) => {
        const nextIdx = (crops.indexOf(prev) + 1) % crops.length
        return crops[nextIdx]
      })
    }, CROP_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [selectedCrop, isPaused])

  const cropData = {
    soybean: {
      name: 'Soybean', nameHindi: 'सोयाबीन',
      weather: { temp: '27°C', rain: '4.2 mm (Light)', humidity: '74%', soilMoisture: 'Adequate' },
      decision: {
        headline: 'Hold Irrigation for 24 Hours',
        headlineHindi: 'सिंचाई 24 घंटे टालें',
        explanation: 'Upcoming 4.2mm rain will preserve topsoil moisture without waterlogging. Saves pumping costs.',
        urgency: 'Recommended',
        tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      },
    },
    cotton: {
      name: 'Cotton', nameHindi: 'कपास',
      weather: { temp: '29°C', rain: '7.5 mm (Moderate)', humidity: '82%', soilMoisture: 'High' },
      decision: {
        headline: 'Postpone Pesticide Spray',
        headlineHindi: 'कीटनाशक छिड़काव 48 घंटे स्थगित',
        explanation: 'Rainfall will wash chemicals within 2 hours. Delay until foliage dries to prevent wasted expenditure.',
        urgency: 'Critical Action',
        tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      },
    },
    wheat: {
      name: 'Wheat', nameHindi: 'गेहूं',
      weather: { temp: '22°C', rain: '0.5 mm (Negligible)', humidity: '48%', soilMoisture: 'Deficit' },
      decision: {
        headline: 'Apply Crown Root Irrigation',
        headlineHindi: 'हल्की सिंचाई तुरंत करें',
        explanation: 'Soil moisture is below root zone threshold during vegetative development. Irrigate in evening hours.',
        urgency: 'Action Needed',
        tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
      },
    },
  }

  const active = cropData[selectedCrop]

  return (
    <section
      id="decision-intelligence"
      className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] w-full bg-[#F6F9F5] border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden py-12 lg:py-10"
    >
      <div className="absolute inset-0 bg-topo-grid opacity-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] rounded-full bg-[#EAF5EC]/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
        <SectionReveal variant="default" className="max-w-3xl mb-5 sm:mb-7 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EC] border border-[#126B3A]/20 text-[#126B3A] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Sprout size={13} />
            <span>Agronomic Engine &middot; Section 02</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#111814] tracking-tight leading-[1.08]">
            Weather Data Becomes{' '}
            <span className="text-[#126B3A]">Clear Farm Decisions</span>
          </h2>
          <p className="text-sm sm:text-base text-[#66736B] mt-1.5 leading-relaxed">
            Farmers do not ask for millimetres of precipitation. They ask: &ldquo;Should I irrigate today?&rdquo;
            MausamSetu bridges weather science with actual field practice.
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E8E4] text-[#126B3A] hover:bg-[#F6F9F5] transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
              <span>{isPaused ? 'Resume' : 'Auto-animating Crops'}</span>
            </button>
            <span className="text-xs text-[#66736B]">Cycling crops every 5.5s</span>
          </div>
        </SectionReveal>

        {/* Crop Selector */}
        <SectionReveal variant="stagger" className="flex flex-wrap items-center gap-2.5 mb-5">
          {crops.map((crop) => {
            const isSelected = selectedCrop === crop
            return (
              <button
                key={crop}
                onClick={() => { setSelectedCrop(crop); setProgress(0) }}
                className={`relative overflow-hidden px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#126B3A] text-white shadow-sm ring-2 ring-[#126B3A]/30'
                    : 'bg-white border border-[#E2E8E4] text-[#66736B] hover:bg-[#F6F9F5]'
                }`}
              >
                {isSelected && (
                  <div className="absolute bottom-0 left-0 h-[2px] bg-[#86EFAC] transition-all duration-75" style={{ width: `${progress}%` }} />
                )}
                <span>{cropData[crop].name} ({cropData[crop].nameHindi})</span>
              </button>
            )
          })}
        </SectionReveal>

        {/* Translation Visual: Input → Flow → Advisory */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Card 1: Weather Input */}
          <SectionReveal variant="left" className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8E4] p-5 sm:p-6 shadow-sm text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-node-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#66736B]">Weather Input</span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-blue-100">
                Panchayat Scale
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCrop}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 gap-3 mt-4"
              >
                {[
                  { icon: <Thermometer size={14} className="text-[#D97706]" />, label: 'Temperature', value: active.weather.temp },
                  { icon: <CloudRain size={14} className="text-[#3B82F6]" />, label: 'Local Rain', value: active.weather.rain },
                  { icon: <Droplets size={14} className="text-teal-500" />, label: 'Humidity', value: active.weather.humidity },
                  { icon: <Sprout size={14} className="text-[#126B3A]" />, label: 'Soil Moisture', value: active.weather.soilMoisture },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-[#F6F9F5] border border-[#E2E8E4]">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#66736B]">
                      {icon}<span>{label}</span>
                    </div>
                    <p className="text-lg font-black text-[#111814] mt-0.5 font-mono count-up">{value}</p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </SectionReveal>

          {/* Animated flow bridge */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center my-1 lg:my-0">
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-full bg-[#126B3A] text-white flex items-center justify-center shadow-md lg:rotate-0 rotate-90"
            >
              <ArrowRight size={18} />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#126B3A] mt-1 hidden lg:block font-mono">
              Translates To
            </span>
          </div>

          {/* Card 2: Advisory Output */}
          <SectionReveal variant="scale" className="lg:col-span-5 bg-[#0B1E13] rounded-2xl border border-emerald-900/40 p-5 sm:p-6 text-white shadow-xl text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/30">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#86EFAC]" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Advisory Output</span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${active.decision.tagColor}`}>
                {active.decision.urgency}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCrop}
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-4 space-y-2"
              >
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  {active.decision.headline}
                </h3>
                <p className="text-sm font-semibold text-[#86EFAC]">{active.decision.headlineHindi}</p>
                <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{active.decision.explanation}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 pt-3 border-t border-emerald-800/30 flex items-center gap-1.5 text-[11px] text-emerald-300">
              <ShieldCheck size={13} className="text-[#86EFAC]" />
              <span>Reviewed by Block Agricultural Officer</span>
            </div>
          </SectionReveal>
        </div>

        {/* 3 Capability Pillars */}
        <SectionReveal variant="stagger" delay={150} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { icon: <Languages size={18} />, title: 'Multilingual Delivery', desc: 'Advisories in Hindi, Marathi, Telugu, Punjabi, and Tamil.' },
            { icon: <Volume2 size={18} />, title: 'Voice-First Access', desc: 'One-tap voice playback and speech queries for rural fields.' },
            { icon: <WifiOff size={18} />, title: 'Offline-Capable', desc: 'Service Worker caching keeps advisories accessible anywhere.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-3.5 rounded-2xl bg-white border border-[#E2E8E4] flex items-start gap-3 text-left shadow-2xs hover:border-[#126B3A]/40 transition-colors">
              <div className="p-2 rounded-xl bg-[#EAF5EC] text-[#126B3A] shrink-0">{icon}</div>
              <div>
                <h4 className="font-bold text-xs text-[#111814]">{title}</h4>
                <p className="text-[11px] text-[#66736B] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}
