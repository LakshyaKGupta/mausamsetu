import React from 'react'
import { Hero } from '../../components/landing/Hero'
import { ProblemSection } from '../../components/landing/ProblemSection'
import { SolutionSection } from '../../components/landing/SolutionSection'
import { HowItWorks } from '../../components/landing/HowItWorks'
import { FarmerExperience } from '../../components/landing/FarmerExperience'
import { OfficerExperience } from '../../components/landing/OfficerExperience'
import { TechnologySection } from '../../components/landing/TechnologySection'
import { CTASection } from '../../components/landing/CTASection'

export const Home: React.FC = () => {
  return (
    <div className="w-full">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <FarmerExperience />
      <OfficerExperience />
      <TechnologySection />
      <CTASection />
    </div>
  )
}

export default Home
