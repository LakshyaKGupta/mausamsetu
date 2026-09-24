import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  ArrowRight,
  ArrowDown,
} from 'lucide-react'
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
  const heroRef = useRef<HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Interactive Cursor Spotlight coordinates
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const springConfig = { damping: 25, stiffness: 120 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  // Floating text parallax movement based on cursor position
  const textMoveX = useTransform(smoothMouseX, [0, 1], [-14, 14])
  const textMoveY = useTransform(smoothMouseY, [0, 1], [-10, 10])

  // Inverse parallax for subtle depth layering
  const subtextMoveX = useTransform(smoothMouseX, [0, 1], [8, -8])
  const subtextMoveY = useTransform(smoothMouseY, [0, 1], [6, -6])

  // Spotlight position percentages
  const spotlightX = useTransform(smoothMouseX, (val) => `${val * 100}%`)
  const spotlightY = useTransform(smoothMouseY, (val) => `${val * 100}%`)

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x)
    mouseY.set(y)
  }

  // Guarantee seamless video playback across all browsers & mobile devices
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.defaultMuted = true
      const startVideo = () => {
        const p = video.play()
        if (p !== undefined) {
          p.catch(() => {})
        }
      }
      startVideo()
      window.addEventListener('touchstart', startVideo, { once: true, passive: true })
      window.addEventListener('click', startVideo, { once: true, passive: true })
      return () => {
        window.removeEventListener('touchstart', startVideo)
        window.removeEventListener('click', startVideo)
      }
    }
  }, [])

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        mouseX.set(0.5)
        mouseY.set(0.5)
      }}
      className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-[#0D2416]"
    >
      {/* ── Cinematic Video Background (Clean 12 Mbps Sharp Drone Master) ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero-farm-poster.jpg"
          onLoadedMetadata={(e) => {
            e.currentTarget.muted = true
            e.currentTarget.play().catch(() => {})
          }}
          className="absolute inset-0 w-full h-full object-cover scale-[1.01]"
        >
          <source src="/videos/hero-farm-bg.mp4" type="video/mp4" />
          <source src="/videos/hero-farm-bg.webm" type="video/webm" />
        </video>

        {/* Ambient base lighting — very subtle to let the video shine through with rich clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />

        {/* Interactive Cursor Spotlight with Video Glow (GPU-Accelerated & Silky Smooth) */}
        <motion.div
          className="absolute -top-32 -left-32 w-72 h-72 rounded-full pointer-events-none blur-2xl transition-opacity duration-300 will-change-transform"
          style={{
            left: spotlightX,
            top: spotlightY,
            opacity: isHovered ? 0.35 : 0.12,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(18, 107, 58, 0.08) 50%, transparent 80%)',
          }}
        />
      </div>

      {/* ── Floating Atmospheric Sky Clouds & Horizon Mist ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-5" aria-hidden="true">
        {/* Sky Cloud 1 (Top Left Drift) */}
        <motion.div
          animate={{ x: [-50, 50, -50], y: [0, -10, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 -left-24 w-[560px] h-48 rounded-full bg-white/22 blur-3xl will-change-transform"
        />
        {/* Sky Cloud 2 (Top Right Drift) */}
        <motion.div
          animate={{ x: [40, -60, 40], y: [-6, 12, -6] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute top-20 -right-28 w-[620px] h-52 rounded-full bg-white/20 blur-3xl will-change-transform"
        />
        {/* Horizon Mountain Mist Band */}
        <motion.div
          animate={{ x: [-35, 35, -35], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[38%] inset-x-0 h-40 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-2xl will-change-transform"
        />
      </div>

      {/* Subtle top spacer */}
      <div className="h-2 sm:h-4 w-full" />

      {/* ── Main Centered Content with Interactive Kinetic Typography ── */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center justify-center text-center my-auto py-3 sm:py-5">
        {/* Soft, compact radial backdrop localized directly behind headline */}
        <div className="absolute inset-0 max-w-lg mx-auto rounded-3xl bg-radial from-white/30 via-white/5 to-transparent blur-xs pointer-events-none -z-10" />

        {/* Main Headline with Parallax Cursor Movement & Ambient Pulse */}
        <motion.h1
          style={{ x: textMoveX, y: textMoveY }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-black text-[#111814] leading-[1.04] tracking-tight max-w-4xl will-change-transform select-none"
        >
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block"
          >
            From Weather
          </motion.span>
          <br />
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="inline-block text-[#126B3A]"
          >
            to Farm Decisions
          </motion.span>
        </motion.h1>

        {/* Supporting Copy with Counter Parallax */}
        <motion.p
          style={{ x: subtextMoveX, y: subtextMoveY }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl text-[#142018] leading-relaxed max-w-2xl mx-auto font-medium mt-6 mb-8 will-change-transform bg-white/75 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/80 shadow-xs"
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D1D5DB] bg-white/95 backdrop-blur-md hover:bg-white text-base font-semibold text-[#111814] transition-all duration-200 hover:border-[#126B3A]/40 shadow-xs"
          >
            See how it works
          </button>
        </motion.div>
      </div>

      {/* ── Expansive Multi-Tiered Atmospheric Rolling Cloud Sea at Hero Bottom / Ending ── */}
      <div className="absolute bottom-0 inset-x-0 h-64 sm:h-80 lg:h-96 pointer-events-none overflow-hidden select-none z-10" aria-hidden="true">
        {/* Tier 1: Deep Mountain Cloud Bank with Majestic Cumulus Lobes */}
        <motion.div
          animate={{ x: [-90, 90, -90], y: [-16, 12, -16], scaleY: [1, 1.08, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-14 -left-[20%] w-[140%] h-64 sm:h-80 opacity-70 will-change-transform"
        >
          <svg viewBox="0 0 1440 260" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,140 Q90,75 180,115 Q270,60 380,95 Q490,45 610,90 Q730,40 850,85 Q970,35 1100,80 Q1230,50 1340,105 Q1390,75 1440,100 L1440,260 L0,260 Z"
              fill="url(#cloudGradDeepV3)"
            />
            <defs>
              <linearGradient id="cloudGradDeepV3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 2: Mid-Level Billowing Cumulus Waves (Opposing lateral drift & breathing) */}
        <motion.div
          animate={{ x: [85, -85, 85], y: [14, -15, 14], scale: [1.03, 0.97, 1.03] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="absolute -bottom-10 -left-[15%] w-[130%] h-56 sm:h-68 opacity-82 will-change-transform"
        >
          <svg viewBox="0 0 1440 240" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,120 Q120,50 240,100 Q360,40 500,85 Q640,30 780,80 Q920,35 1060,75 Q1200,45 1320,95 Q1380,65 1440,85 L1440,240 L0,240 Z"
              fill="url(#cloudGradMidV3)"
            />
            <defs>
              <linearGradient id="cloudGradMidV3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 3: Billowing Cumulus Ridge (Distinct cauliflower dome arcs) */}
        <motion.div
          animate={{ x: [-70, 70, -70], y: [-10, 12, -10] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute -bottom-6 -left-[12%] w-[125%] h-48 sm:h-56 opacity-90 will-change-transform"
        >
          <svg viewBox="0 0 1440 220" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,100 Q80,50 160,85 Q240,35 340,75 Q440,25 560,70 Q680,30 800,65 Q920,25 1040,60 Q1160,35 1280,80 Q1360,45 1440,70 L1440,220 L0,220 Z"
              fill="url(#cloudGradRidgeV3)"
            />
            <defs>
              <linearGradient id="cloudGradRidgeV3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 4: Foreground Crisp Cloud Bank */}
        <motion.div
          animate={{ x: [55, -55, 55], y: [7, -7, 7] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-3 -left-[8%] w-[120%] h-36 sm:h-44 opacity-98 will-change-transform"
        >
          <svg viewBox="0 0 1440 180" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,80 Q100,35 210,70 Q320,25 450,65 Q580,20 720,55 Q860,20 1000,50 Q1140,25 1270,65 Q1350,35 1440,60 L1440,180 L0,180 Z"
              fill="url(#cloudGradFrontV3)"
            />
            <defs>
              <linearGradient id="cloudGradFrontV3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 5: Low Rolling Foam Bank (Solid White Anchor) */}
        <motion.div
          animate={{ x: [-40, 40, -40], y: [-4, 4, -4] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          className="absolute bottom-0 -left-[5%] w-[115%] h-28 opacity-100 will-change-transform"
        >
          <svg viewBox="0 0 1440 130" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,60 Q140,25 280,50 Q420,20 600,45 Q780,15 960,40 Q1140,20 1300,45 L1440,40 L1440,130 L0,130 Z"
              fill="#FFFFFF"
            />
          </svg>
        </motion.div>

        {/* ── Volumetric Billowing Cumulus Vapor Puffs (Organic Cloud Spheres) ── */}
        {/* Puff 1: Far Left Giant Rolling Mass */}
        <motion.div
          animate={{ x: [-45, 45, -45], y: [-15, 10, -15], scale: [1, 1.15, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-16 -left-[6%] w-[480px] h-48 rounded-full bg-white/80 blur-3xl will-change-transform"
        />
        {/* Puff 2: Left-Center Billowing Crest */}
        <motion.div
          animate={{ x: [35, -35, 35], y: [12, -14, 12], scale: [1.12, 0.96, 1.12] }}
          transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="absolute -bottom-14 left-[14%] w-[440px] h-44 rounded-full bg-white/85 blur-2xl will-change-transform"
        />
        {/* Puff 3: Mid-Left Rising Cloud Bank */}
        <motion.div
          animate={{ x: [-30, 30, -30], y: [-12, 14, -12], scale: [0.95, 1.14, 0.95] }}
          transition={{ duration: 12.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          className="absolute -bottom-8 left-[30%] w-[480px] h-40 rounded-full bg-white/80 blur-2xl will-change-transform"
        />
        {/* Puff 4: Center Low Deep Cloud Pillow */}
        <motion.div
          animate={{ x: [25, -25, 25], scale: [1.02, 1.18, 1.02] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 left-[22%] w-[580px] h-56 rounded-full bg-white/92 blur-3xl will-change-transform"
        />
        {/* Puff 5: Mid-Right High Billowing Ridge */}
        <motion.div
          animate={{ x: [-40, 40, -40], y: [14, -12, 14], scale: [1.1, 0.94, 1.1] }}
          transition={{ duration: 10.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute -bottom-10 right-[20%] w-[500px] h-44 rounded-full bg-white/88 blur-2xl will-change-transform"
        />
        {/* Puff 6: Far Right Rolling Giant Mass */}
        <motion.div
          animate={{ x: [45, -45, 45], y: [-12, 12, -12], scale: [1, 1.16, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute -bottom-16 -right-[8%] w-[540px] h-52 rounded-full bg-white/85 blur-3xl will-change-transform"
        />
        {/* Puff 7: Center Rising Wispy Cloud Mass */}
        <motion.div
          animate={{ x: [-25, 25, -25], y: [-10, 10, -10], scale: [0.95, 1.12, 0.95] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
          className="absolute -bottom-6 left-[45%] w-88 h-32 rounded-full bg-white/75 blur-xl will-change-transform"
        />
        {/* Puff 8: Upper Rising Tendril */}
        <motion.div
          animate={{ x: [30, -30, 30], y: [8, -12, 8] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute -bottom-4 right-[36%] w-80 h-28 rounded-full bg-white/70 blur-lg will-change-transform"
        />

        {/* ── Seamless Grounding Base Gradient into Section 01 ── */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white via-white/95 to-transparent" />
      </div>

      {/* ── Bottom Scroll Cue ─────────────────────────── */}
      <div className="relative z-20 pb-6 flex items-center justify-center w-full px-6">
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
              className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md border border-[#D1D5DB] flex items-center justify-center group-hover:border-[#126B3A] shadow-xs"
            >
              <ArrowDown size={14} />
            </motion.div>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
