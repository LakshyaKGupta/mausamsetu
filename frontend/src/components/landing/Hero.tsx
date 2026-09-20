import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudRain,
  Wind,
  Droplets,
  Mountain,
  Compass,
  ArrowRight,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Activity,
  Radio,
  Sprout,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { Button } from '../shared/Button'

export const Hero: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true)
  const [selectedPanchayat, setSelectedPanchayat] = useState<'Dhapewada' | 'Kalamna' | 'Mohpa'>('Dhapewada')

  // 4 Simple Steps that frame the entire MausamSetu concept
  const steps = [
    {
      step: 1,
      tag: 'Step 01: Coarse Regional Forecast',
      title: 'Block-Level Blanket Forecast',
      desc: 'Official weather models treat an entire 40×40 km block as a single flat number, ignoring local micro-climates.',
      metricLabel: 'Coarse IMD Block Forecast',
      metricValue: '12.0 mm',
      metricSub: 'Identical rain applied to all 84 villages',
      badge: 'Coarse 40km Grid',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      step: 2,
      tag: 'Step 02: Topographic ML Downscaling',
      title: 'Terrain & Elevation Physics',
      desc: 'MausamSetu incorporates 30m Digital Elevation Models, slope angles, aspect vectors, and 8 local AWS stations.',
      metricLabel: 'Topographic Elevation Correction',
      metricValue: '+3.6 mm',
      metricSub: 'Lapse rate adjusted for 295m altitude',
      badge: 'DEM + AWS Spatially Calibrated',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      step: 3,
      tag: 'Step 03: Panchayat Micro-Prediction',
      title: 'Hyper-Local Village Weather',
      desc: 'Downscaled to 1km resolution with empirical uncertainty intervals calibrated on 8 years of historical ground observations.',
      metricLabel: 'Refined Panchayat Rain',
      metricValue: '4.2 mm',
      metricSub: 'Error margin: ±0.11 mm (High Reliability)',
      badge: 'Panchayat Micro-Climate',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      step: 4,
      tag: 'Step 04: Actionable Farmer Advisory',
      title: 'From Millimetres to Decisions',
      desc: 'Raw weather is translated into crop-specific field advice verified by Agricultural Officers before farmer dispatch.',
      metricLabel: 'Soybean Action Rule',
      metricValue: 'सिंचाई टालें (Hold Irrigation)',
      metricSub: '24h light rain maintains root zone moisture',
      badge: 'Officer Verified Advisory',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
    },
  ]

  // Auto-cycle steps every 5 seconds if not paused
  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 1 : prev + 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const panchayatData = {
    Dhapewada: {
      temp: '28°C',
      condition: 'Partly Cloudy',
      rain: '4.2 mm',
      humidity: '72%',
      wind: '14 km/h NW',
      elevation: '295 m',
      block: 'Kalmeshwar Block',
      advisory: 'सोयाबीन: हल्की वर्षा का अनुमान, आज सिंचाई 24 घंटे टालें।',
    },
    Kalamna: {
      temp: '27°C',
      condition: 'Light Showers',
      rain: '6.8 mm',
      humidity: '78%',
      wind: '16 km/h W',
      elevation: '312 m',
      block: 'Nagpur Rural',
      advisory: 'कपास: कीटनाशक छिड़काव वर्षा थमने तक 48 घंटे स्थगित रखें।',
    },
    Mohpa: {
      temp: '29°C',
      condition: 'Overcast',
      rain: '1.5 mm',
      humidity: '65%',
      wind: '12 km/h N',
      elevation: '280 m',
      block: 'Kalmeshwar Block',
      advisory: 'सब्जियां: जल निकास नाली खुली रखें, फफूंदनाशक स्प्रे उपयुक्त।',
    },
  }

  const currentPanchayat = panchayatData[selectedPanchayat]
  const currentStepData = steps[activeStep - 1]

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="hero"
      className="snap-section relative w-full bg-[#F7FAF7] border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden"
    >
      {/* Dynamic Background: Animated Topo Grid & Soft Radar Sweep */}
      <div className="absolute inset-0 bg-topo-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-contour-pattern opacity-40 pointer-events-none" />

      {/* Floating Telemetry Icon 1: Elevation & Coordinates */}
      <div className="hidden xl:flex absolute top-8 left-12 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#E2E8E4] shadow-sm text-xs font-semibold text-[#14532D] animate-float-slow backdrop-blur-sm">
        <Mountain size={14} className="text-[#166534]" />
        <span>Dhapewada: 295m Alt • Topo Station</span>
        <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
      </div>

      {/* Floating Telemetry Icon 2: Wind Drift Vector */}
      <div className="hidden xl:flex absolute bottom-12 left-16 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#E2E8E4] shadow-sm text-xs font-semibold text-[#17201A] animate-float-drift backdrop-blur-sm">
        <Compass size={14} className="text-[#3B82F6] animate-spin" style={{ animationDuration: '12s' }} />
        <span>Wind Vector: 14 km/h NW • Aspect 38°</span>
      </div>

      {/* Floating Telemetry Icon 3: Empirical Uncertainty */}
      <div className="hidden xl:flex absolute top-12 right-12 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#BBF7D0] shadow-sm text-xs font-semibold text-[#166534] animate-float-drift backdrop-blur-sm">
        <Activity size={14} className="text-[#166534]" />
        <span>Empirical Calibration: E80 ±0.11 mm (High)</span>
      </div>

      {/* Floating Telemetry Icon 4: Subsurface Moisture */}
      <div className="hidden xl:flex absolute bottom-10 right-20 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#E2E8E4] shadow-sm text-xs font-semibold text-[#17201A] animate-float-slow backdrop-blur-sm">
        <Droplets size={14} className="text-[#3B82F6]" />
        <span>Soil Moisture: 28% • Black Clay Loam</span>
      </div>

      {/* Central Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Big Statement + Simple 4-Step Narrative Scrubber */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
            {/* Live Model Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8E4] shadow-xs text-xs font-medium text-[#14532D]">
              <Radio size={12} className="text-[#166534] animate-pulse" />
              <span>Live Operational Pilot • Kalmeshwar Block, Nagpur</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#17201A] leading-[1.08]">
              FROM FORECAST <br />
              <span className="text-[#166534]">TO FARM DECISION.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#647067] font-normal leading-relaxed max-w-xl">
              Local weather intelligence for every Panchayat. Bridging the gap between 40km coarse forecasts and actionable crop decisions.
            </p>

            {/* The 4-Step Interactive Pipeline Progress */}
            <div className="bg-white rounded-2xl border border-[#E2E8E4] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-[#647067]">
                <span className="font-bold text-[#17201A] uppercase tracking-wider">
                  How MausamSetu Works in 4 Steps
                </span>
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#166534] hover:underline"
                >
                  <RefreshCw size={11} className={isAutoPlaying ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                  <span>{isAutoPlaying ? 'Auto-playing' : 'Paused'}</span>
                </button>
              </div>

              {/* Step Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5">
                {steps.map((s) => {
                  const isActive = activeStep === s.step
                  return (
                    <button
                      key={s.step}
                      onClick={() => {
                        setActiveStep(s.step)
                        setIsAutoPlaying(false)
                      }}
                      className={`relative p-2 rounded-xl text-left transition-all border ${
                        isActive
                          ? 'bg-[#F0FDF4] border-[#166534] shadow-xs'
                          : 'bg-[#F8FAFC] border-transparent hover:bg-slate-100 text-[#647067]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold font-mono">0{s.step}</span>
                      <span className="block text-[11px] font-bold truncate mt-0.5 text-[#17201A]">
                        {s.step === 1 ? 'Forecast' : s.step === 2 ? 'Terrain' : s.step === 3 ? 'Panchayat' : 'Advisory'}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#166534] rounded-full"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Active Step Content Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="pt-1 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#166534]">{currentStepData.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentStepData.badgeColor}`}>
                      {currentStepData.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#647067] leading-relaxed">{currentStepData.desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/signup">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                  Explore MausamSetu
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => handleScrollToSection('downscaling')}
                className="px-5 py-3 rounded-xl border border-[#E2E8E4] bg-white hover:bg-[#F7FAF7] text-[#17201A] font-semibold text-sm transition-all shadow-xs"
              >
                See How It Works ↓
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Weather & Step Visualizer Engine */}
          <div className="lg:col-span-6 relative">
            {/* Panchayat Pill Selector */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E2E8E4] shadow-xs">
                {(['Dhapewada', 'Kalamna', 'Mohpa'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPanchayat(p)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      selectedPanchayat === p
                        ? 'bg-[#166534] text-white shadow-xs'
                        : 'text-[#647067] hover:bg-[#F7FAF7]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#14532D]">
                <ShieldCheck size={13} /> Officer Verified
              </span>
            </div>

            {/* Central Weather Intelligence Panel */}
            <div className="bg-white rounded-3xl border border-[#E2E8E4] shadow-md p-5 sm:p-7 relative overflow-hidden text-left">
              {/* Radar Sweep Effect in Card Header */}
              <div className="flex items-start justify-between border-b border-[#E2E8E4] pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#166534] font-semibold mb-0.5">
                    <MapPin size={14} />
                    <span>{currentPanchayat.block}, Nagpur</span>
                  </div>
                  <h2 className="text-2xl font-black text-[#17201A]">
                    {selectedPanchayat} Panchayat
                  </h2>
                  <p className="text-xs text-[#647067] mt-0.5">
                    Elevation {currentPanchayat.elevation} • आज का मौसम • 20 सितंबर 2026
                  </p>
                </div>

                {/* Live Step Impact Box */}
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#647067]">
                    {currentStepData.metricLabel}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#166534] tracking-tight">
                    {currentStepData.metricValue}
                  </div>
                  <span className="text-[10px] text-[#647067] font-medium">
                    {currentStepData.metricSub}
                  </span>
                </div>
              </div>

              {/* Temperature & Main Conditions */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-5xl sm:text-6xl font-black text-[#17201A] tracking-tight">
                    {currentPanchayat.temp}
                  </div>
                  <p className="text-sm font-semibold text-[#647067] mt-1 flex items-center gap-2">
                    <span>{currentPanchayat.condition}</span>
                    <span className="text-[#166534] font-bold">• 1km Resolved</span>
                  </p>
                </div>

                {/* Condition Animation */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-xs relative overflow-hidden">
                  <CloudRain size={42} className="animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/10 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#2563EB] mb-1">
                    <CloudRain size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067] font-medium">Refined Rain</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{currentPanchayat.rain}</p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#2563EB] mb-1">
                    <Droplets size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067] font-medium">Humidity</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{currentPanchayat.humidity}</p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#2563EB] mb-1">
                    <Wind size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067] font-medium">Wind Drift</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{currentPanchayat.wind}</p>
                </div>
              </div>

              {/* Actionable Field Advisory Box */}
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Sprout size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#14532D]">
                    आज की प्रमाणित कृषि सलाह (Officer Verified Crop Action)
                  </p>
                  <p className="text-xs text-[#166534] mt-1 leading-relaxed font-medium">
                    {currentPanchayat.advisory}
                  </p>
                </div>
              </div>

              {/* Provenance Footer */}
              <div className="mt-4 pt-3 border-t border-[#E2E8E4] flex items-center justify-between text-[11px] text-[#647067]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#166534]" />
                  <span>XGBoost R²: <strong>0.991</strong> • Residual Error: <strong>±0.11 mm</strong></span>
                </span>
                <span
                  onClick={() => handleScrollToSection('downscaling')}
                  className="text-[#166534] font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  Inspect terrain model <ChevronRight size={12} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
