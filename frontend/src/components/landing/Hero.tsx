import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CloudRain, Wind, Droplets, ShieldCheck, ArrowRight, MapPin, CheckCircle2, Sparkles } from 'lucide-react'
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
      advisory: 'सोयाबीन: हल्की बारिश की संभावना, सिंचाई आज टालें।',
      reliability: 'HIGH (±0.11 mm)',
    },
    Kalamna: {
      temp: '27°C',
      condition: 'Light Showers',
      rain: '6.8 mm',
      humidity: '78%',
      wind: '16 km/h',
      advisory: 'कपास: कीटनाशक छिड़काव 24 घंटे के लिए स्थगित करें।',
      reliability: 'HIGH (±0.14 mm)',
    },
    Mohpa: {
      temp: '29°C',
      condition: 'Overcast',
      rain: '1.5 mm',
      humidity: '65%',
      wind: '12 km/h',
      advisory: 'धान: सामान्य जल निकासी बनाए रखें।',
      reliability: 'HIGH (±0.09 mm)',
    },
  }

  const current = panchayatData[selectedPanchayat]

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-[#F7FAF7]">
      {/* Subtle background contour pattern */}
      <div className="absolute inset-0 opacity-40 bg-contour-pattern pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] border border-[#166534]/20 text-[#14532D] text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
              PANCHAYAT-LEVEL WEATHER INTELLIGENCE
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#17201A] leading-[1.12]">
              Weather that speaks to your farm, <span className="text-[#166534]">not just your block.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-[#647067] leading-relaxed max-w-2xl font-normal">
              MausamSetu transforms block-level weather forecasts into localized, hyper-accurate agricultural decisions for every Gram Panchayat.
            </p>

            {/* Dual CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link to="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-base" rightIcon={<ArrowRight size={18} />}>
                  Explore MausamSetu
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust Line */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-[#647067]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#166534]" /> Powered by IMD Data
              </span>
              <span className="text-[#E2E8E4] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#166534]" /> Local ML Downscaling
              </span>
              <span className="text-[#E2E8E4] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#166534]" /> Officer Verified
              </span>
            </div>
          </motion.div>

          {/* Right Column: Realistic Animated Weather Intelligence Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            {/* Subtle Panchayat Selector Pills */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              {(['Dhapewada', 'Kalamna', 'Mohpa'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPanchayat(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    selectedPanchayat === p
                      ? 'bg-[#166534] text-white shadow-sm'
                      : 'bg-white text-[#647067] border border-[#E2E8E4] hover:bg-[#F7FAF7]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Primary Weather Intelligence Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8E4] shadow-sm p-6 sm:p-7 relative overflow-hidden text-left">
              {/* Card Header: Location */}
              <div className="flex items-start justify-between border-b border-[#E2E8E4] pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#166534] font-semibold mb-0.5">
                    <MapPin size={14} />
                    <span>Nagpur, Maharashtra</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#17201A]">
                    {selectedPanchayat} Panchayat
                  </h3>
                  <p className="text-xs text-[#647067]">आज · 19 सितंबर 2026</p>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#14532D]">
                  <ShieldCheck size={14} /> Verified
                </span>
              </div>

              {/* Temperature & Visual Condition */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <motion.div
                    key={current.temp}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl font-extrabold text-[#17201A] tracking-tight"
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
              <div className="grid grid-cols-3 gap-2.5 my-5">
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

              {/* Recommended Action Pill */}
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">🌱</span>
                <div>
                  <p className="text-xs font-bold text-[#14532D]">आज की सलाह (Verified Advisory)</p>
                  <p className="text-xs text-[#166534] mt-0.5 leading-relaxed">{current.advisory}</p>
                </div>
              </div>

              {/* Card Footer: Local Verification Notice */}
              <div className="mt-4 pt-3 border-t border-[#E2E8E4] flex items-center justify-between text-[11px] text-[#647067]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
                  Downscaled ML: <strong className="text-[#17201A]">{current.reliability}</strong>
                </span>
                <span className="text-[#166534] font-medium hover:underline cursor-pointer">
                  Data provenance →
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
