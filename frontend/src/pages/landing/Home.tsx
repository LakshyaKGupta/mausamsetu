import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Hero } from '../../components/landing/Hero'
import { DownscalingSection } from '../../components/landing/DownscalingSection'
import { DecisionIntelligenceSection } from '../../components/landing/DecisionIntelligenceSection'
import { HumanVerificationSection } from '../../components/landing/HumanVerificationSection'
import { ExperienceSection } from '../../components/landing/ExperienceSection'
import { CTASection } from '../../components/landing/CTASection'

export const Home: React.FC = () => {
  const location = useLocation()

  // Handle hash scrolling when navigated from another page (e.g. /#downscaling)
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace('#', ''))
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.hash])

  return (
    <div className="w-full">
      {/* 0. Hero Section: Real Farm Video + Asymmetric Typography */}
      <Hero />

      {/* 1. Geographic Downscaling & Weather Refinement (Full Page Section) */}
      <DownscalingSection />

      {/* 2. Crop Decision Intelligence (Full Page Section) */}
      <DecisionIntelligenceSection />

      {/* 3. Human-in-the-Loop Verification (Full Page Section) */}
      <HumanVerificationSection />

      {/* 4. Farmer & Officer Portal Experience (Full Page Section) */}
      <ExperienceSection />

      {/* Epilogue: Final CTA */}
      <CTASection />
    </div>
  )
}

export default Home
