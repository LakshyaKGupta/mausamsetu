import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hero } from '../../components/landing/Hero'
import { DownscalingSection } from '../../components/landing/DownscalingSection'
import { DecisionIntelligenceSection } from '../../components/landing/DecisionIntelligenceSection'
import { HumanVerificationSection } from '../../components/landing/HumanVerificationSection'
import { ExperienceSection } from '../../components/landing/ExperienceSection'
import { CTASection } from '../../components/landing/CTASection'

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
    <div className="w-full relative selection:bg-emerald-200 selection:text-emerald-900">
      {/* 0. Hero Section: Animated atmospheric weather background, editorial typography, pan-India resolution engine */}
      <Hero />

      {/* 1. How It Works: Geographic Downscaling & Weather Refinement */}
      <motion.div
        initial={{ opacity: 0.92, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <DownscalingSection />
      </motion.div>

      {/* Smooth Transition Divider: Downscaling -> Decision Intelligence */}
      <div className="w-full h-8 bg-gradient-to-b from-[#FFFFFF] to-[#F8FAF8] pointer-events-none" />

      {/* 2. Crop Decision Intelligence: Weather to Field Actions */}
      <motion.div
        initial={{ opacity: 0.92, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <DecisionIntelligenceSection />
      </motion.div>

      {/* Smooth Transition Divider: Decision Intelligence -> Verification */}
      <div className="w-full h-8 bg-gradient-to-b from-[#F8FAF8] to-[#FFFFFF] pointer-events-none" />

      {/* 3. Human-in-the-Loop Verification: Officer Review & Digital Sign-off */}
      <motion.div
        initial={{ opacity: 0.92, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <HumanVerificationSection />
      </motion.div>

      {/* Smooth Transition Divider: Verification -> Experience */}
      <div className="w-full h-8 bg-gradient-to-b from-[#FFFFFF] to-[#F8FAF8] pointer-events-none" />

      {/* 4. Farmer & Officer Portal Experience: Mobile PWA & Command Console */}
      <motion.div
        initial={{ opacity: 0.92, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <ExperienceSection />
      </motion.div>

      {/* Smooth Transition Divider: Experience -> CTA */}
      <div className="w-full h-12 bg-gradient-to-b from-[#F8FAF8] to-[#166534] pointer-events-none" />

      {/* 5. Closing CTA Section */}
      <CTASection />
    </div>
  )
}

export default Home
