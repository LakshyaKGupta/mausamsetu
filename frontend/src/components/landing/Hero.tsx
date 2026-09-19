import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CloudRain, Wind, Droplets, ShieldCheck, ArrowRight, MapPin, CheckCircle2, ChevronDown } from 'lucide-react'
import { Button } from '../shared/Button'

export const Hero: React.FC = () => {
  const [selectedPanchayat, setSelectedPanchayat] = useState<'Dhapewada' | 'Kalamna' | 'Mohpa'>('Dhapewada')

  const panchayatData = {
    Dhapewada: {
      temp: '28°C',
      condition: 'Partly Cloudy',
      rain: '4.2 mm',
      humidity: '72%',
      wind: '14 km/h',
      advisory: 'सोयाबीन: हल्की वर्षा का अनुमान, सिंचाई 24 घंटे के लिए टालें।',
      reliability: 'HIGH (±0.11 mm)',
      elevation: '295 m',
      block: 'Kalmeshwar Block',
    },
    Kalamna: {
      temp: '27°C',
      condition: 'Light Showers',
      rain: '6.8 mm',
      humidity: '78%',
      wind: '16 km/h',
      advisory: 'कपास: कीटनाशक छिड़काव वर्षा थमने तक स्थगित करें।',
      reliability: 'HIGH (±0.14 mm)',
      elevation: '312 m',
      block: 'Nagpur Rural',
    },
    Mohpa: {
      temp: '29°C',
      condition: 'Overcast',
      rain: '1.5 mm',
      humidity: '65%',
      wind: '12 km/h',
      advisory: 'सब्जियां: जल निकास नाली खुली रखें, फफूंदनाशक स्प्रे उपयुक्त।',
      reliability: 'HIGH (±0.09 mm)',
      elevation: '280 m',
      block: 'Kalmeshwar Block',
    },
  }

  const current = panchayatData[selectedPanchayat]

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="hero" className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-[#F7FAF7] border-b border-[#E2E8E4]">
      {/* Background: Subtle contour pattern */}
      <div className="absolute inset-0 opacity-30 bg-contour-pattern pointer-events-none" />

      {/* Main Hero Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-12 relative z-10 flex-1 flex flex-col justify-center">
        {/* Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column (Editorial Headline + Real Farm Video Window) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Primary Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#17201A] leading-[1.06]">
              FROM FORECAST <br />
              <span className="text-[#166534]">TO FARM DECISION.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-2xl text-[#647067] font-medium leading-relaxed max-w-xl">
              Local weather intelligence for every Panchayat.
            </p>

            {/* Editorial Video Window: Real Agricultural/Weather Footage */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E2E8E4] shadow-sm bg-[#17201A] max-w-lg aspect-[16/9] group">
              {/* Fallback Poster */}
              <img
                src="/images/hero-farm-poster.jpg"
                alt="Agricultural field under monsoon rain"
                className="video-poster-fallback absolute inset-0 w-full h-full object-cover opacity-90 hidden"
              />

              {/* Looping 6s Muted Video */}
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/images/hero-farm-poster.jpg"
                className="w-full h-full object-cover brightness-95 contrast-105"
                aria-label="Monsoon rainfall over Vidarbha agricultural farmland"
              >
                <source src="/videos/hero-farm-loop.mp4" type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>

              {/* Video Overlay Tag */}
              <div className="absolute bottom-3 left-3 bg-[#17201A]/85 backdrop-blur-sm px-3 py-1 rounded-md text-[11px] font-medium text-white/90 flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                <span>Ground Observation • Vidarbha Agro-Climatic Zone</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link to="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-base" rightIcon={<ArrowRight size={18} />}>
                  Explore MausamSetu
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => handleScrollToSection('downscaling')}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#E2E8E4] text-[#17201A] bg-white hover:bg-[#F7FAF7] font-semibold text-base transition-colors shadow-sm"
              >
                See How It Works
              </button>
            </div>

            {/* Trust Line */}
            <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-[#647067]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#166534]" /> IMD & ERA5 Data
              </span>
              <span className="text-[#E2E8E4] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#166534]" /> Topographic ML Downscaling
              </span>
              <span className="text-[#E2E8E4] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#166534]" /> Officer Verified
              </span>
            </div>
          </motion.div>

          {/* Right Column: Live Animated Weather Intelligence Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            {/* Floating Contextual Badge: Elevation */}
            <div className="absolute -top-3.5 right-6 z-20 bg-white border border-[#E2E8E4] shadow-sm px-3 py-1 rounded-full text-xs font-semibold text-[#14532D] flex items-center gap-1.5 animate-float-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
              <span>Elevation {current.elevation}</span>
            </div>

            {/* Panchayat Selector Pills */}
            <div className="flex items-center justify-start gap-2 mb-3">
              {(['Dhapewada', 'Kalamna', 'Mohpa'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPanchayat(p)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                    selectedPanchayat === p
                      ? 'bg-[#166534] text-white shadow-sm'
                      : 'bg-white text-[#647067] border border-[#E2E8E4] hover:bg-[#F7FAF7]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Weather Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8E4] shadow-sm p-6 sm:p-7 relative overflow-hidden text-left">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E2E8E4] pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#166534] font-semibold mb-0.5">
                    <MapPin size={14} />
                    <span>{current.block}, Nagpur</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#17201A]">
                    {selectedPanchayat} Panchayat
                  </h3>
                  <p className="text-xs text-[#647067] mt-0.5">आज का वास्तविक मौसम • 19 सितंबर 2026</p>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#14532D]">
                  <ShieldCheck size={14} /> Verified
                </span>
              </div>

              {/* Temperature & Visual Condition */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <motion.div
                    key={current.temp}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl font-black text-[#17201A] tracking-tight"
                  >
                    {current.temp}
                  </motion.div>
                  <p className="text-sm font-medium text-[#647067] mt-1">{current.condition}</p>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-sm">
                  <CloudRain size={36} className="animate-pulse" />
                </div>
              </div>

              {/* Weather Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#2563EB] mb-1">
                    <CloudRain size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067] font-medium">Rainfall</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{current.rain}</p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#2563EB] mb-1">
                    <Droplets size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067] font-medium">Humidity</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{current.humidity}</p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-[#2563EB] mb-1">
                    <Wind size={16} />
                  </div>
                  <p className="text-[11px] text-[#647067] font-medium">Wind</p>
                  <p className="text-sm font-bold text-[#17201A] mt-0.5">{current.wind}</p>
                </div>
              </div>

              {/* Recommended Action Box */}
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">🌱</span>
                <div>
                  <p className="text-xs font-bold text-[#14532D]">आज की कृषि सलाह (Crop Advisory)</p>
                  <p className="text-xs text-[#166534] mt-0.5 leading-relaxed">{current.advisory}</p>
                </div>
              </div>

              {/* Card Footer: Empirical Calibration */}
              <div className="mt-4 pt-3 border-t border-[#E2E8E4] flex items-center justify-between text-[11px] text-[#647067]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#166534]" />
                  ML Confidence: <strong className="text-[#17201A]">{current.reliability}</strong>
                </span>
                <span className="text-[#166534] font-medium hover:underline cursor-pointer">
                  Data provenance →
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="pb-4 text-center hidden md:block">
        <button
          onClick={() => handleScrollToSection('downscaling')}
          className="inline-flex items-center gap-1.5 text-xs text-[#647067] font-medium hover:text-[#166534] transition-colors"
          aria-label="Scroll to Downscaling section"
        >
          <span>Scroll to explore narrative</span>
          <ChevronDown size={14} className="animate-bounce" />
        </button>
      </div>
    </section>
  )
}
