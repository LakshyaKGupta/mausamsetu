import React from 'react'
import { Check, Mic, Volume2, Globe2, WifiOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { SectionHeading } from '../shared/SectionHeading'
import { Button } from '../shared/Button'
import { Link } from 'react-router-dom'

export const FarmerExperience: React.FC = () => {
  const benefits = [
    {
      title: 'Simple, direct language',
      desc: 'No confusing meteorological charts. Plain advice on irrigation, spraying, and harvesting.',
    },
    {
      title: 'Multilingual: Hindi, Marathi & English',
      desc: 'Seamlessly toggle dialects so every farmer understands critical weather guidance.',
    },
    {
      title: 'Voice-first assistant',
      desc: 'Farmers can speak their questions naturally in their native language and hear spoken answers.',
    },
    {
      title: 'Crop-specific guidance',
      desc: 'Tailored for individual field plantings (Soybean, Cotton, Orange, Gram, Wheat).',
    },
    {
      title: 'Officer verified',
      desc: 'Every advisory is checked and signed by the local Block Agricultural Officer.',
    },
    {
      title: 'Works with limited connectivity',
      desc: 'Lightweight PWA caches the latest forecast for offline viewing in remote field areas.',
    },
  ]

  return (
    <section className="py-20 sm:py-28 bg-[#F7FAF7] border-b border-[#E2E8E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Farmer Experience"
          title="Built for the field, not for a tech boardroom."
          subtitle="Designed from the ground up for farmers using budget Android phones under harsh sunlight and intermittent 2G/3G connectivity."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Column: Realistic Mobile Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[36px] bg-[#17201A] p-3 shadow-2xl border-4 border-slate-800">
              {/* Phone Speaker & Notch */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2" />

              {/* Phone Screen Container */}
              <div className="bg-[#F8FAFC] rounded-[28px] p-4 text-left space-y-3 overflow-hidden border border-slate-200">
                {/* Micro Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#166534]" />
                    <span className="text-xs font-bold text-[#17201A]">MausamSetu</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                    हिंदी
                  </span>
                </div>

                {/* Location Strip */}
                <div className="text-[11px] text-[#647067]">
                  <p className="font-semibold text-[#17201A]">धापेवाड़ा ग्राम पंचायत</p>
                  <p>नागपुर, महाराष्ट्र · आज</p>
                </div>

                {/* Weather Card */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#647067]">आज का मौसम</p>
                      <p className="text-2xl font-extrabold text-[#17201A]">28°C</p>
                      <p className="text-[11px] text-[#647067]">आंशिक बादल</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                        वर्षा: 4.2 mm
                      </span>
                      <p className="text-[10px] text-emerald-700 mt-1 font-medium">बारिश जोखिम: कम</p>
                    </div>
                  </div>
                </div>

                {/* Advisory Card */}
                <div className="bg-[#F0FDF4] rounded-2xl p-3.5 border border-[#BBF7D0] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14532D]">🌱 सोयाबीन सलाह</span>
                    <span className="text-[10px] font-semibold text-[#166534] bg-white px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                      सिंचाई: टालें
                    </span>
                  </div>
                  <p className="text-xs text-[#166534] leading-relaxed font-medium">
                    बारिश की संभावना को देखते हुए आज सिंचाई टालना उचित है ताकि फसल सुरक्षित रहे।
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-[#14532D]/80">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-[#166534]" /> अधिकारी द्वारा सत्यापित
                    </span>
                    <Volume2 size={14} className="text-[#166534] cursor-pointer" />
                  </div>
                </div>

                {/* Voice CTA Button */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0">
                    <Mic size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#17201A]">बोलकर पूछें</p>
                    <p className="text-[10px] text-[#647067]">"कल बारिश होगी क्या?"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Pillars & Bullet Points */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#166534] bg-[#DCFCE7] px-3 py-1 rounded-full">
                Farmer First
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A] mt-3">
                No complex dashboards. Just clear, trusted farm decisions.
              </h3>
              <p className="text-base text-[#647067] mt-2 leading-relaxed">
                Most agritech apps fail because they require technical literacy and desktop workflows. MausamSetu gives farmers exactly what they need in under five seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {benefits.map((b, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-[#E2E8E4] shadow-sm text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <h4 className="text-sm font-bold text-[#17201A]">{b.title}</h4>
                  </div>
                  <p className="text-xs text-[#647067] leading-relaxed pl-7">{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link to="/app/farmer">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Open Farmer PWA Experience
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
