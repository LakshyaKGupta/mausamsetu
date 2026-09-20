import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Hero } from '../../components/landing/Hero'
import { DownscalingSection } from '../../components/landing/DownscalingSection'
import { DecisionIntelligenceSection } from '../../components/landing/DecisionIntelligenceSection'
import { HumanVerificationSection } from '../../components/landing/HumanVerificationSection'
import { ExperienceSection } from '../../components/landing/ExperienceSection'
import { CTASection } from '../../components/landing/CTASection'

export const Home: React.FC = () => {
  const location = useLocation()
  const [activeSection, setActiveSection] = useState<string>('hero')

  const sections = [
    { id: 'hero', label: '01 • Overview' },
    { id: 'downscaling', label: '02 • Downscaling' },
    { id: 'decision-intelligence', label: '03 • Decision Engine' },
    { id: 'verification', label: '04 • Verification' },
    { id: 'experience', label: '05 • Portals' },
  ]

  // Track active section for right-hand floating pagination
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3
      for (const sec of sections) {
        const el = document.getElementById(sec.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id)
            return
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle hash scrolling when navigated from another page (e.g. /#downscaling)
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 72
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="w-full relative">
      {/* Right-Hand Floating Section Navigator (Desktop only) */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-3 pointer-events-auto">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className="group flex items-center gap-2.5 focus:outline-none"
              aria-label={`Scroll to ${sec.label}`}
            >
              {/* Tooltip on hover */}
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                  isActive
                    ? 'bg-[#166534] text-white opacity-100 shadow-xs'
                    : 'bg-white text-[#647067] border border-[#E2E8E4] opacity-0 group-hover:opacity-100'
                }`}
              >
                {sec.label}
              </span>

              {/* Indicator Dot */}
              <span
                className={`w-3 h-3 rounded-full transition-all border ${
                  isActive
                    ? 'bg-[#166534] border-[#166534] scale-125 ring-4 ring-[#DCFCE7]'
                    : 'bg-white border-[#CBD5E1] group-hover:border-[#166534] group-hover:scale-110'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* 0. Hero Section: Renovated 4-Step Narrative Engine + Floating Telemetry */}
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
