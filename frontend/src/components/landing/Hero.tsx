import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  ArrowRight,
  ArrowDown,
  CloudRain,
  Sun,
  Sprout,
  Droplets,
  Wind,
  Leaf,
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
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#F6F9F5]"
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

        {/* Ambient base lighting — very subtle to let the video shine through */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />

        {/* Interactive Cursor Spotlight with Video Glow (Compact & Subtle) */}
        <motion.div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.75 : 0.25,
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) =>
                `radial-gradient(260px circle at ${x} ${y}, rgba(255, 255, 255, 0.35) 0%, rgba(18, 107, 58, 0.05) 50%, transparent 80%)`
            ),
          }}
        />

        {/* Minimal edge connection to Navbar & Downscaling section without cloudy white wash */}
        <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-[#F6F9F5]/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#F6F9F5]/50 to-transparent" />

        {/* Subtle static film grain */}
        <div className="absolute inset-0 bg-grain opacity-15 mix-blend-overlay" />
      </div>

      {/* Spacer for navbar clearance */}
      <div className="h-16 sm:h-20 w-full" />

      {/* ── Floating Palette-Matched Icons (Lower Opacity, Light Glassmorphic, Animated) ── */}
      {/* Top Left: Rain Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden sm:flex absolute top-28 left-6 md:left-12 lg:left-20 xl:left-28 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-white/45 backdrop-blur-md border border-[#D8E6DB]/50 shadow-xs flex items-center justify-center text-[#2563EB]/70 hover:opacity-90 transition-opacity"
        >
          <CloudRain size={20} className="stroke-[1.8]" />
        </motion.div>
      </motion.div>

      {/* Mid Left: Sprout Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="hidden md:flex absolute top-1/2 -translate-y-12 left-4 md:left-8 lg:left-14 xl:left-20 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ y: [7, -7, 7], rotate: [2, -2, 2] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/45 backdrop-blur-md border border-[#D8E6DB]/50 shadow-xs flex items-center justify-center text-[#126B3A]/70 hover:opacity-90 transition-opacity"
        >
          <Sprout size={20} className="stroke-[1.8]" />
        </motion.div>
      </motion.div>

      {/* Bottom Left: Droplets Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="hidden sm:flex absolute bottom-28 left-8 md:left-14 lg:left-24 xl:left-32 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/45 backdrop-blur-md border border-[#D8E6DB]/50 shadow-xs flex items-center justify-center text-[#0D9488]/70 hover:opacity-90 transition-opacity"
        >
          <Droplets size={18} className="stroke-[1.8]" />
        </motion.div>
      </motion.div>

      {/* Top Right: Sun Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="hidden sm:flex absolute top-28 right-6 md:right-12 lg:right-20 xl:right-28 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ y: [8, -8, 8], rotate: [2, -2, 2] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          className="w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-white/45 backdrop-blur-md border border-[#D8E6DB]/50 shadow-xs flex items-center justify-center text-[#D97706]/70 hover:opacity-90 transition-opacity"
        >
          <Sun size={20} className="stroke-[1.8]" />
        </motion.div>
      </motion.div>

      {/* Mid Right: Wind Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="hidden md:flex absolute top-1/2 -translate-y-12 right-4 md:right-8 lg:right-14 xl:right-20 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ y: [-7, 7, -7], rotate: [-2, 2, -2] }}
          transition={{ duration: 5.0, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/45 backdrop-blur-md border border-[#D8E6DB]/50 shadow-xs flex items-center justify-center text-[#3B82F6]/70 hover:opacity-90 transition-opacity"
        >
          <Wind size={20} className="stroke-[1.8]" />
        </motion.div>
      </motion.div>

      {/* Bottom Right: Leaf Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="hidden sm:flex absolute bottom-28 right-8 md:right-14 lg:right-24 xl:right-32 z-20 pointer-events-none"
      >
        <motion.div
          animate={{ y: [6, -6, 6] }}
          transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }}
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/45 backdrop-blur-md border border-[#D8E6DB]/50 shadow-xs flex items-center justify-center text-[#16A34A]/70 hover:opacity-90 transition-opacity"
        >
          <Leaf size={18} className="stroke-[1.8]" />
        </motion.div>
      </motion.div>

      {/* ── Main Centered Content with Interactive Kinetic Typography ── */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center justify-center text-center my-auto py-8 sm:py-12">
        {/* Soft, compact radial backdrop localized directly behind headline */}
        <div className="absolute inset-0 max-w-xl mx-auto rounded-3xl bg-radial from-white/55 via-white/15 to-transparent blur-md pointer-events-none -z-10" />

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
