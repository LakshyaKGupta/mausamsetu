import React from 'react'
import { SectionHeading } from '../../components/shared/SectionHeading'
import { Mic, Globe2, WifiOff, Sprout, ShieldCheck, ArrowRight, Smartphone, Volume2 } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Link } from 'react-router-dom'

export const FarmersPage: React.FC = () => {
  const features = [
    {
      title: 'Panchayat-Level Forecasts',
      desc: 'Weather calibrated specifically to your village and surrounding farm contours, not an average 25 km block estimate.',
      icon: Smartphone,
    },
    {
      title: 'Multilingual Voice Assistant',
      desc: 'Speak naturally in Hindi, Marathi, or English. Press the microphone button to ask: "कल बारिश होगी?" or "आज सिंचाई करूँ?" and hear the spoken reply.',
      icon: Mic,
    },
    {
      title: 'Crop-Specific Action Advice',
      desc: 'Guidance tailored to your exact crop: Soybean, Cotton, Orange, Gram, Wheat. Actionable directives on irrigation, spraying, and sowing.',
      icon: Sprout,
    },
    {
      title: 'Offline Field Resilience',
      desc: 'Built as a Progressive Web App (PWA). Once loaded, the latest weather and advisories remain accessible in your pocket even without cellular coverage in deep fields.',
      icon: WifiOff,
    },
    {
      title: 'Officer Verification',
      desc: 'Every advisory is checked and signed off by your local Block Agricultural Extension Officer. No unreliable machine hallucinations.',
      icon: ShieldCheck,
    },
    {
      title: 'Zero Literacy Barrier',
      desc: 'Large visual weather cards, intuitive color codes (Green for safe, Amber for caution), and text-to-speech audio for every recommendation.',
      icon: Volume2,
    },
  ]

  return (
    <div className="py-12 sm:py-20 bg-[#F7FAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <SectionHeading
          eyebrow="Farmer Portal"
          title="Weather intelligence designed for your field."
          subtitle="Everything a farmer needs to protect crops, optimize water, and reduce input costs — simple, local, and accessible in your language."
        />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-white rounded-3xl border border-[#E2E8E4] p-6 shadow-sm flex flex-col justify-between hover:border-[#166534]/30 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#17201A] mb-2">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-[#647067] leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8E4] text-[11px] font-semibold text-[#166534]">
                  Field Tested Feature
                </div>
              </div>
            )
          })}
        </div>

        {/* Voice Feature Highlight Card */}
        <div className="bg-white rounded-3xl border border-[#E2E8E4] p-8 sm:p-12 shadow-sm text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-[#166534] bg-[#DCFCE7] px-3 py-1 rounded-full">
                Accessible to Everyone
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A]">
                Can't read complex charts? Just ask by voice.
              </h3>
              <p className="text-sm text-[#647067] leading-relaxed">
                Indian farmers often don't have time to navigate text menus. With MausamSetu, tap the green microphone button and speak in your local dialect. The assistant understands Marathi, Hindi, and English, providing clear spoken guidance.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F7FAF7] border border-[#E2E8E4] text-[#17201A]">
                  "कल बारिश होगी?"
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F7FAF7] border border-[#E2E8E4] text-[#17201A]">
                  "आज सोयाबीन में कीटनाशक डालूँ?"
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F7FAF7] border border-[#E2E8E4] text-[#17201A]">
                  "उद्या पाऊस पडेल का?"
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm p-6 rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#166534] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                  <Mic size={36} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#14532D]">बोलकर पूछें</h4>
                  <p className="text-xs text-[#166534] mt-1">
                    "मौसम, सिंचाई या फसल की सलाह पूछें"
                  </p>
                </div>
                <Link to="/app/farmer" className="block pt-2">
                  <Button variant="primary" size="md" className="w-full">
                    Try Voice Assistant in App
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 rounded-3xl bg-[#166534] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">Start receiving local weather advisory today</h3>
            <p className="text-sm text-[#DCFCE7]">
              Free and open for all farmers in Nagpur District and across India.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/signup">
              <button className="px-6 py-3 rounded-xl bg-white text-[#166534] font-bold text-sm hover:bg-[#F7FAF7] transition-all flex items-center gap-2">
                <span>Farmer Registration</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmersPage
