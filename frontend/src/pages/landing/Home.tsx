import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hero } from '../../components/landing/Hero'
import { DownscalingSection } from '../../components/landing/DownscalingSection'
import { DecisionIntelligenceSection } from '../../components/landing/DecisionIntelligenceSection'
import { HumanVerificationSection } from '../../components/landing/HumanVerificationSection'
import { ExperienceSection } from '../../components/landing/ExperienceSection'
import { CTASection } from '../../components/landing/CTASection'

const sectionScrollVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export const Home: React.FC = () => {
  const location = useLocation()

  // Handle hash scrolling when navigated from navbar or external link (e.g. /#downscaling)
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace('#', ''))
      if (element) {
        setTimeout(() => {
          const headerOffset = 72
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })
        }, 100)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.hash])

  return (
    <div className="w-full relative selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      {/* 0. Hero Section: Cinematic weather drone backdrop, interactive cursor spotlight, kinetic text parallax */}
      <Hero />

      {/* 1. How It Works: Geographic Downscaling & 360° Doppler Meteorological Radar */}
      <motion.div
        variants={sectionScrollVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        className="w-full relative z-10"
      >
        <DownscalingSection />
      </motion.div>

      {/* Seamless Transition Divider: Downscaling (White) -> Decision Intelligence (#F6F9F5) */}
      <div className="w-full h-12 bg-gradient-to-b from-white via-[#F8FAF7] to-[#F6F9F5] pointer-events-none relative z-10" />

      {/* 2. Crop Decision Intelligence: Weather to Field Actions */}
      <motion.div
        variants={sectionScrollVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        className="w-full relative z-10"
      >
        <DecisionIntelligenceSection />
      </motion.div>

      {/* Seamless Transition Divider: Decision Intelligence (#F6F9F5) -> Verification (White) */}
      <div className="w-full h-12 bg-gradient-to-b from-[#F6F9F5] via-[#F8FAF7] to-white pointer-events-none relative z-10" />

      {/* 3. Human-in-the-Loop Verification: Officer Review & Digital Sign-off */}
      <motion.div
        variants={sectionScrollVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        className="w-full relative z-10"
      >
        <HumanVerificationSection />
      </motion.div>

      {/* Seamless Transition Divider: Verification (White) -> Experience (#F6F9F5) */}
      <div className="w-full h-12 bg-gradient-to-b from-white via-[#F8FAF7] to-[#F6F9F5] pointer-events-none relative z-10" />

      {/* 4. Farmer & Officer Portal Experience: Floating Mobile PWA & Command Console */}
      <motion.div
        variants={sectionScrollVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        className="w-full relative z-10"
      >
        <ExperienceSection />
      </motion.div>

      {/* Atmospheric Transition Divider: Experience (#F6F9F5) -> CTA (#0B4F2A Deep Emerald) */}
      <div className="w-full h-16 bg-gradient-to-b from-[#F6F9F5] via-[#103D23]/60 to-[#0B4F2A] pointer-events-none relative z-10" />

      {/* 5. Closing CTA Section with Aurora Glow */}
      <motion.div
        variants={sectionScrollVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        className="w-full relative z-10"
      >
        <CTASection />
      </motion.div>
    </div>
  )
}

export default Home
