import React from 'react'
import { ArrowDown, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { SectionHeading } from '../shared/SectionHeading'

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 bg-white border-y border-[#E2E8E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Agricultural Reality"
          title="Weather forecasts are available. But farmers need decisions."
          subtitle="A coarse 25 km block forecast cannot tell a farmer whether their specific field on a higher contour will receive rainfall today."
        />

        {/* Visual Problem vs Solution Comparison */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Step 1: The Raw Regional Forecast */}
            <div className="bg-[#F8FAFC] border border-[#E2E8E4] rounded-2xl p-6 text-left relative">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <span className="text-xs font-semibold text-[#647067] uppercase tracking-wider block mb-1">
                Regional Forecast
              </span>
              <h4 className="text-lg font-bold text-[#17201A] mb-2">Block Level</h4>
              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E4] mb-3">
                <p className="text-xs text-[#647067]">IMD Coarse Grid (25 km)</p>
                <p className="text-xl font-bold text-[#17201A] mt-1">"Rain: 12.0 mm"</p>
              </div>
              <p className="text-xs text-[#647067] leading-relaxed">
                A single generalized prediction covering 50+ diverse villages with varying elevations and micro-climates.
              </p>
            </div>

            {/* Step 2: The Farmer's Actual Question */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6 text-left relative">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wider block mb-1">
                The Practical Gap
              </span>
              <h4 className="text-lg font-bold text-[#92400E] mb-2">Farmer's Dilemma</h4>
              <div className="bg-white p-3.5 rounded-xl border border-[#FDE68A] mb-3">
                <p className="text-xs text-[#D97706] font-medium flex items-center gap-1">
                  <HelpCircle size={14} /> Action needed
                </p>
                <p className="text-base font-bold text-[#17201A] mt-1">"Should I irrigate my Soybean field today?"</p>
              </div>
              <p className="text-xs text-[#92400E] leading-relaxed">
                If the farmer irrigates and heavy rain falls, seeds rot. If they don't irrigate and rain misses their hill, crops dry.
              </p>
            </div>

            {/* Step 3: MausamSetu's Local Bridge */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-6 text-left relative shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <span className="text-xs font-semibold text-[#166534] uppercase tracking-wider block mb-1">
                MausamSetu Solution
              </span>
              <h4 className="text-lg font-bold text-[#14532D] mb-2">Actionable Decision</h4>
              <div className="bg-white p-3.5 rounded-xl border border-[#BBF7D0] mb-3">
                <p className="text-xs text-[#166534] font-medium flex items-center gap-1">
                  <CheckCircle2 size={14} /> Verified Advisory
                </p>
                <p className="text-sm font-bold text-[#166534] mt-1 leading-snug">
                  "Dhapewada: Rain 4.2 mm. Delay irrigation for 24 hours."
                </p>
              </div>
              <p className="text-xs text-[#166534] leading-relaxed">
                Downscaled to the Panchayat using topography, paired with crop biology, and verified by agricultural officers.
              </p>
            </div>
          </div>

          {/* Bottom Statement Banner */}
          <div className="mt-10 p-5 rounded-2xl bg-[#F7FAF7] border border-[#E2E8E4] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h5 className="text-base font-bold text-[#17201A]">
                MausamSetu bridges the gap between meteorological data and farm survival.
              </h5>
              <p className="text-xs text-[#647067] mt-0.5">
                Protecting input capital, optimizing fertilizer spray timing, and preventing avoidable crop loss.
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold text-[#166534] bg-[#DCFCE7] px-4 py-2 rounded-xl">
              Zero Guesswork
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
