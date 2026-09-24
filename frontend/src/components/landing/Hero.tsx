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

      {/* ── Bottom Scroll Cue ─────────────────────────── */}
      <div className="relative z-10 pb-6 flex items-center justify-center w-full px-6">
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
      </div>
    </section>
  )
}
