import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Smartphone, Sparkles, Shield, Wifi } from 'lucide-react'
import { SectionReveal } from '../shared/SectionReveal'

export const CTASection: React.FC = () => {
  return (
    <section className="relative w-full bg-[#0B4F2A] text-white flex flex-col justify-center overflow-hidden py-20 sm:py-28 lg:py-32">
      {/* Atmospheric topographic background */}
      <div className="absolute inset-0 bg-topo-animated opacity-15 pointer-events-none" aria-hidden="true" />

      {/* Rotating ambient aurora glow in deep emerald */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.25) 0%, rgba(18,107,58,0.1) 50%, transparent 75%)' }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <SectionReveal variant="default" className="space-y-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#86EFAC] border border-[#86EFAC]/30 bg-[#126B3A]/60 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs"
          >
            <Sparkles size={11} className="text-[#86EFAC]" />
            <span>Panchayat Agricultural Intelligence</span>
          </motion.div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.06]">
            Bringing Weather
            <br />
            <span className="text-[#86EFAC]">to the Last Mile.</span>
          </h2>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-white/80 leading-relaxed font-normal">
            Local weather intelligence for every Panchayat.
            Explore localized micro-forecasts or access the officer verification portal.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#0B4F2A] hover:bg-[#EAF5EC] font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore MausamSetu</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>
            <Link to="/app/farmer">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#126B3A]/80 border border-[#86EFAC]/30 text-white hover:bg-[#126B3A] font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Smartphone size={18} />
                <span>Farmer PWA Demo</span>
              </motion.button>
            </Link>
          </div>

          <div className="pt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-white/70">
            <span className="inline-flex items-center gap-1">
              <Shield size={13} className="text-[#86EFAC]" />
              Free for Indian Farmers
            </span>
            <span>&bull;</span>
            <span>Hindi &middot; Marathi &middot; English</span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <Wifi size={13} className="text-[#86EFAC]" />
              Offline-Capable
            </span>
          </div>
        </SectionReveal>
      </div>

      {/* ── Atmospheric Rolling Cloud Mist at Section Ending (Transition into Footer) ── */}
      <div className="absolute bottom-0 inset-x-0 h-24 sm:h-32 pointer-events-none overflow-hidden select-none z-5" aria-hidden="true">
        {/* Tier 1: Soft Emerald Mist Cloud */}
        <motion.div
          animate={{ x: [-40, 40, -40], y: [0, -6, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-6 -left-[10%] w-[120%] h-24 opacity-35 will-change-transform"
        >
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,60 C240,90 480,30 720,70 C960,110 1200,40 1440,60 L1440,120 L0,120 Z"
              fill="url(#ctaMistGrad1)"
            />
            <defs>
              <linearGradient id="ctaMistGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86EFAC" stopOpacity="0" />
                <stop offset="60%" stopColor="#126B3A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#17201A" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 2: Rolling Billow Wave */}
        <motion.div
          animate={{ x: [35, -35, 35], y: [-4, 5, -4] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-2 -left-[8%] w-[116%] h-20 opacity-40 will-change-transform"
        >
          <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,45 C200,75 420,20 660,55 C900,90 1140,25 1440,50 L1440,100 L0,100 Z"
              fill="#17201A"
            />
          </svg>
        </motion.div>

        {/* Grounding Scrim into Dark Footer */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#17201A] to-transparent" />
      </div>
    </section>
  )
}
