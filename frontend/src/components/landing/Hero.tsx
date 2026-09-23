import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { Button } from '../shared/Button'
import { WeatherField } from '../shared/WeatherField'

// ─── Hero Weather Visualization Phases ───────────────────────────────────────
// The right panel cycles through 3 states to tell the weather→farm story:
// 1. Regional   — coarse regional forecast block
// 2. Resolving  — field resolves into nodes
// 3. Panchayat  — single Panchayat highlighted with advisory

type HeroPhase = 'regional' | 'resolving' | 'panchayat'

const PHASE_DURATION = 4000

const PHASE_META: Record<HeroPhase, { eyebrow: string; value: string; detail: string; next: HeroPhase }> = {
  regional: {
    eyebrow: 'REGIONAL FORECAST',
    value: '18.0 mm',
    detail: 'Same value across ~1,600 km²',
    next: 'resolving',
  },
  resolving: {
    eyebrow: 'LOCAL REFINEMENT',
    value: 'Processing…',
    detail: 'Terrain + sensor fusion active',
    next: 'panchayat',
  },
  panchayat: {
    eyebrow: 'DHAPEWADA PANCHAYAT',
    value: '4.2 mm',
    detail: '→ Hold irrigation 24h',
    next: 'regional',
  },
}

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export const Hero: React.FC = () => {
  const [phase, setPhase] = useState<HeroPhase>('regional')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPhase((p) => PHASE_META[p].next)
    }, PHASE_DURATION)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  const meta = PHASE_META[phase]

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex flex-col overflow-hidden bg-[#F6F9F5]"
    >
      {/* ── Atmospheric Background ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Moving topographic grid */}
        <div className="absolute inset-0 bg-topo-animated opacity-100" />
        {/* Grain texture */}
        <div className="absolute inset-0 bg-grain opacity-60" />
        {/* Ambient radial glow — top right */}
        <div
          className="absolute top-[-12%] right-[-8%] w-[680px] h-[680px] rounded-full pointer-events-none animate-atmosphere"
          style={{ background: 'radial-gradient(circle, rgba(18,107,58,0.09) 0%, transparent 70%)' }}
        />
        {/* Ambient radial glow — bottom left */}
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', animationDelay: '9s' }}
        />
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center w-full py-16 lg:py-0">

          {/* Left — Editorial Typography */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-7">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-bold text-[#126B3A] border border-[#126B3A]/20 bg-[#EAF5EC] px-3 py-1 rounded-full">
                Panchayat Weather Intelligence
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.6rem] sm:text-5xl xl:text-[3.6rem] font-black text-[#111814] leading-[1.06] tracking-tight"
            >
              From Weather
              <br />
              <span className="text-[#126B3A]">to Farm Decisions.</span>
            </motion.h1>

            {/* Supporting copy */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-[#66736B] leading-relaxed max-w-xl"
            >
              Localized weather intelligence for Panchayats and agricultural decisions.
              Coarse regional forecasts refined to local terrain, then verified by officers
              before reaching farmers.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link to="/signup">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight size={16} />}
                  className="shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  Explore MausamSetu
                </Button>
              </Link>
              <button
                onClick={() => scrollToSection('downscaling')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F6F9F5] text-sm font-semibold text-[#111814] transition-all duration-200 hover:border-[#126B3A]/40"
              >
                See how it works
              </button>
            </motion.div>

            {/* Capability pills — product statements, not stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {[
                'Panchayat-level weather',
                'Crop-specific advisory',
                'Officer verification',
                'Voice-first access',
                'Offline-capable PWA',
              ].map((cap) => (
                <span
                  key={cap}
                  className="inline-block px-3 py-1 rounded-full bg-white border border-[#E2E8E4] text-[11px] text-[#66736B] font-medium shadow-2xs"
                >
                  {cap}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — Cinematic Weather Field Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 xl:col-span-5"
          >
            <div className="relative rounded-2xl bg-white/90 backdrop-blur-sm border border-[#E2E8E4] shadow-lg overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#126B3A] animate-node-pulse" />
                  <span className="text-xs font-semibold text-[#111814]">Live Forecast Field</span>
                </div>
                <span className="text-[10px] font-mono text-[#66736B] bg-[#F6F9F5] px-2 py-0.5 rounded-md border border-[#E2E8E4]">
                  Nagpur Region
                </span>
              </div>

              {/* Weather Field SVG */}
              <div className="relative px-2 pt-2 pb-0 bg-[#0B1120]">
                <WeatherField
                  phase={phase}
                  activeNodeId={phase === 'panchayat' ? 'dhapewada' : undefined}
                  showWind={true}
                  showContours={true}
                  height={280}
                />

                {/* Phase label overlay — bottom left of viz */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/80"
                  >
                    <span className="text-[#86EFAC] font-bold">{meta.eyebrow}</span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Data readout footer */}
              <div className="px-4 py-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase + 'val'}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.28 }}
                    className="flex items-baseline gap-2"
                  >
                    <span className="text-xl font-black text-[#111814] font-mono tracking-tight">
                      {meta.value}
                    </span>
                    <span className="text-xs text-[#66736B]">{meta.detail}</span>
                  </motion.div>
                </AnimatePresence>

                {/* Phase progress dots */}
                <div className="flex items-center gap-1.5">
                  {(['regional', 'resolving', 'panchayat'] as HeroPhase[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPhase(p)}
                      className={`rounded-full transition-all duration-300 ${
                        phase === p
                          ? 'w-5 h-2 bg-[#126B3A]'
                          : 'w-2 h-2 bg-[#D1D5DB] hover:bg-[#126B3A]/50'
                      }`}
                      aria-label={`Switch to ${p} phase`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Scroll cue ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="relative z-10 pb-8 flex justify-center"
      >
        <button
          onClick={() => scrollToSection('downscaling')}
          className="text-[#66736B] hover:text-[#126B3A] transition-colors p-2"
          aria-label="Scroll to How It Works"
        >
          <ArrowDown size={18} />
        </button>
      </motion.div>
    </section>
  )
}
