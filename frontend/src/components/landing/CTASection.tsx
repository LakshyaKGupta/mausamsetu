import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '../shared/Button'

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 bg-[#166534] text-white relative overflow-hidden">
      {/* Background contour overlay */}
      <div className="absolute inset-0 opacity-10 bg-contour-pattern pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <span className="inline-block text-xs uppercase tracking-widest font-semibold text-[#DCFCE7] bg-[#14532D] px-3.5 py-1.5 rounded-full">
          Ready for Field Deployment
        </span>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight uppercase">
          FROM FORECAST TO FARM DECISION.
        </h2>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#DCFCE7] leading-relaxed font-normal">
          Local weather intelligence for every Panchayat. Start exploring localized micro-forecasts or access the officer verification portal.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <button className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-[#166534] hover:bg-[#F7FAF7] active:bg-slate-100 font-bold text-base shadow-md transition-all flex items-center justify-center gap-2">
              <span>Get Started</span>
              <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/app/farmer">
            <button className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#14532D] border border-white/20 text-white hover:bg-[#0f3d21] font-semibold text-base transition-all flex items-center justify-center gap-2">
              <Smartphone size={18} />
              <span>Explore Farmer App Demo</span>
            </button>
          </Link>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#DCFCE7]/80">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} /> Free for all Indian farmers
          </span>
          <span>•</span>
          <span>No credit card required</span>
          <span>•</span>
          <span>Hindi, Marathi & English support</span>
        </div>
      </div>
    </section>
  )
}
