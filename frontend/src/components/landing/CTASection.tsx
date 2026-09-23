import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Smartphone } from 'lucide-react'
import { SectionReveal } from '../shared/SectionReveal'

export const CTASection: React.FC = () => {
  return (
    <section className="relative w-full bg-[#0B4F2A] text-white flex flex-col justify-center overflow-hidden py-20 sm:py-28 lg:py-32">
      {/* Atmospheric topographic background */}
      <div className="absolute inset-0 bg-topo-animated opacity-15 pointer-events-none" aria-hidden="true" />

      {/* Subtle ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none animate-atmosphere"
        style={{ background: 'radial-gradient(circle, rgba(18,107,58,0.3) 0%, transparent 70%)' }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <SectionReveal variant="default" className="space-y-5">
          <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-bold text-[#86EFAC] border border-[#86EFAC]/20 bg-[#126B3A]/40 px-3.5 py-1.5 rounded-full">
            Panchayat Agricultural Intelligence
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.06]">
            Bringing Weather
            <br />
            <span className="text-[#86EFAC]">to the Last Mile.</span>
          </h2>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-white/75 leading-relaxed font-normal">
            Local weather intelligence for every Panchayat.
            Explore localized micro-forecasts or access the officer verification portal.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#0B4F2A] hover:bg-[#EAF5EC] font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 group hover:scale-[1.02]">
                <span>Explore MausamSetu</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link to="/app/farmer">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#126B3A]/70 border border-[#86EFAC]/20 text-white hover:bg-[#126B3A] font-semibold text-base transition-all flex items-center justify-center gap-2">
                <Smartphone size={18} />
                <span>Farmer PWA Demo</span>
              </button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-white/60">
            <span>Free for Indian Farmers</span>
            <span>•</span>
            <span>Hindi · Marathi · English</span>
            <span>•</span>
            <span>Offline-Capable</span>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
