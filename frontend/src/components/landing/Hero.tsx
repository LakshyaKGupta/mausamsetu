import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowDown, Play, Pause } from 'lucide-react'
import { Button } from '../shared/Button'

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export const Hero: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)

  // Guarantee video playback across all browsers
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.defaultMuted = true
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Hero video autoplay blocked by browser policy:', err)
            setIsPlaying(false)
          })
      }
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.error)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#F6F9F5]"
    >
      {/* ── Cinematic Full-Bleed Video Background (15s Continuous Loop) ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Full-bleed high-definition video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero-farm-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover scale-[1.01] brightness-[0.98] contrast-[1.04]"
        >
          <source src="/videos/hero-farm-bg.mp4" type="video/mp4" />
          <source src="/videos/hero-farm-bg.webm" type="video/webm" />
        </video>

        {/* 1. Translucent ambient light wash: reveals the video clearly while maintaining visual depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F6F9F5]/45 via-transparent to-[#F6F9F5]/70" />

        {/* 2. Soft central atmospheric glow: ensures 100% WCAG AAA readability for centered text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[850px] max-w-[95vw] h-[520px] rounded-full bg-white/70 blur-3xl opacity-85" />
        </div>

        {/* 3. Top and bottom edge vignettes for smooth connection to Navbar & Downscaling section */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#F6F9F5]/90 via-[#F6F9F5]/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#F6F9F5] via-[#F6F9F5]/75 to-transparent" />

        {/* 4. Subtle animated topographic contour lines superimposed on the landscape */}
        <div className="absolute inset-0 bg-topo-animated opacity-20 mix-blend-multiply" />

        {/* 5. Tactile film grain */}
        <div className="absolute inset-0 bg-grain opacity-25 mix-blend-overlay" />

        {/* 6. Ambient emerald radial glow matching #126B3A / #0B4F2A palette */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[680px] h-[680px] rounded-full pointer-events-none animate-atmosphere"
          style={{ background: 'radial-gradient(circle, rgba(18,107,58,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', animationDelay: '9s' }}
        />
      </div>

      {/* Empty spacer for navbar clearance */}
      <div className="h-20 sm:h-24 w-full" />

      {/* ── Main Centered Content ───────────────────────────────── */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center justify-center text-center my-auto py-12">
        
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-black text-[#111814] leading-[1.04] tracking-tight max-w-4xl"
        >
          From Weather
          <br />
          <span className="text-[#126B3A]">to Farm Decisions.</span>
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl text-[#263238] leading-relaxed max-w-2xl mx-auto font-medium mt-6 mb-8"
        >
          Localized weather intelligence for Panchayats and agricultural decisions.
          Coarse regional forecasts refined to local terrain, then verified by officers
          before reaching farmers.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="flex flex-wrap items-center justify-center gap-3.5"
        >
          <Link to="/signup">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              className="shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 px-7 py-3 text-base"
            >
              Explore MausamSetu
            </Button>
          </Link>
          <button
            onClick={() => scrollToSection('downscaling')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D1D5DB] bg-white/90 backdrop-blur-md hover:bg-white text-base font-semibold text-[#111814] transition-all duration-200 hover:border-[#126B3A]/40 shadow-xs"
          >
            See how it works
          </button>
        </motion.div>

      </div>

      {/* ── Bottom Controls & Scroll cue ─────────────────────────── */}
      <div className="relative z-10 pb-6 flex items-center justify-center w-full px-6">
        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex justify-center"
        >
          <button
            onClick={() => scrollToSection('downscaling')}
            className="inline-flex flex-col items-center gap-1 text-xs font-semibold text-[#66736B] hover:text-[#126B3A] transition-colors group"
            aria-label="Scroll to How It Works"
          >
            <span className="tracking-wide">Explore Methodology</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md border border-[#D1D5DB] flex items-center justify-center group-hover:border-[#126B3A] shadow-xs"
            >
              <ArrowDown size={14} />
            </motion.div>
          </button>
        </motion.div>

        {/* Video playback interactive toggle in bottom right corner */}
        <div className="absolute right-6 bottom-6">
          <button
            onClick={togglePlay}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-[#E2E8E4] text-xs font-semibold text-[#111814] shadow-xs transition-all hover:scale-105"
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
          >
            {isPlaying ? (
              <Pause size={12} className="fill-current text-[#126B3A]" />
            ) : (
              <Play size={12} className="fill-current text-[#126B3A]" />
            )}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play video'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
