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
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#0D2416]"
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

      {/* Spacer for navbar clearance */}
      <div className="h-16 sm:h-20 w-full" />

      {/* ── Main Centered Content with Interactive Kinetic Typography ── */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center justify-center text-center my-auto py-8 sm:py-12">
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
          className="text-base sm:text-lg md:text-xl text-[#263238] leading-relaxed max-w-2xl mx-auto font-medium mt-6 mb-8 will-change-transform"
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

      {/* ── Multi-Tiered Atmospheric Cloud Mist Sea at Hero Bottom ── */}
      <div className="absolute bottom-0 inset-x-0 h-36 sm:h-48 pointer-events-none overflow-hidden select-none z-10" aria-hidden="true">
        {/* Tier 1: Deep Back Rolling Cloud Wave (Gentle, majestic drift) */}
        <motion.div
          animate={{ x: [-45, 45, -45], y: [0, -8, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-8 -left-[15%] w-[130%] h-36 opacity-60 will-change-transform"
        >
          <svg viewBox="0 0 1440 180" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,90 C180,45 320,130 500,80 C680,30 840,110 1020,70 C1200,30 1340,95 1440,75 L1440,180 L0,180 Z"
              fill="url(#cloudGradDeep)"
            />
            <defs>
              <linearGradient id="cloudGradDeep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 2: Mid-Level Billowing Wave (Undulating crests) */}
        <motion.div
          animate={{ x: [40, -40, 40], y: [-6, 6, -6] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-4 -left-[12%] w-[125%] h-32 opacity-75 will-change-transform"
        >
          <svg viewBox="0 0 1440 160" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,80 C240,120 400,40 640,90 C880,140 1040,50 1260,85 C1360,105 1410,65 1440,75 L1440,160 L0,160 Z"
              fill="url(#cloudGradMid)"
            />
            <defs>
              <linearGradient id="cloudGradMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 3: Front Crisp Cloud Ridge */}
        <motion.div
          animate={{ x: [-30, 30, -30], y: [4, -4, 4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1 -left-[8%] w-[120%] h-28 opacity-85 will-change-transform"
        >
          <svg viewBox="0 0 1440 140" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,60 C200,95 360,30 560,75 C760,120 920,40 1140,70 C1280,90 1370,50 1440,65 L1440,140 L0,140 Z"
              fill="url(#cloudGradFront)"
            />
            <defs>
              <linearGradient id="cloudGradFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tier 4: Soft Cumulus Vapor Puffs Floating Across Base */}
        <motion.div
          animate={{ x: [-35, 35, -35], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-10 left-[10%] w-[420px] h-32 rounded-full bg-white/60 blur-2xl will-change-transform"
        />
        <motion.div
          animate={{ x: [30, -30, 30], scale: [1.06, 0.95, 1.06] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-12 right-[12%] w-[480px] h-36 rounded-full bg-white/70 blur-2xl will-change-transform"
        />
        <motion.div
          animate={{ x: [-20, 20, -20], y: [-5, 5, -5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-8 left-[45%] w-72 h-24 rounded-full bg-white/55 blur-xl will-change-transform"
        />

        {/* Seamless blend gradient into Section 01 */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent" />
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
