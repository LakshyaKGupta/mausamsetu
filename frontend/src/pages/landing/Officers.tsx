import React from 'react'
import { SectionHeading } from '../../components/shared/SectionHeading'
import { ShieldCheck, UserCheck, Eye, Edit3, CheckCircle2, ArrowRight, BarChart3, AlertTriangle, Layers } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Link } from 'react-router-dom'

export const OfficersPage: React.FC = () => {
  const officerTools = [
    {
      title: 'Side-by-Side Model Comparison',
      desc: 'Inspect official IMD block-level forecasts against MausamSetu downscaled predictions, topographic elevation deltas, and estimated error margins.',
      icon: Eye,
    },
    {
      title: 'Editorial Advisory Control',
      desc: 'Modify pre-generated advisory text in Hindi, Marathi, and English. Add hyper-local caveats such as dam release schedules or localized pest alerts.',
      icon: Edit3,
    },
    {
      title: 'Institutional Cryptographic Sign-Off',
      desc: 'Every approved advisory is stamped with officer ID, department designation, and timestamp, establishing an immutable provenance trail.',
      icon: ShieldCheck,
    },
    {
      title: 'Panchayat Health & Sensor Monitoring',
      desc: 'Track AWS station calibration, sensor health, and historical downscaling accuracy across all Panchayats in your assigned block.',
      icon: BarChart3,
    },
    {
      title: 'Priority Risk Alerts',
      desc: 'Automated warnings when severe rainfall (>50mm), unseasonal frost, or high wind events exceed safety thresholds in vulnerable terrain.',
      icon: AlertTriangle,
    },
    {
      title: 'Mass Multilingual Dissemination',
      desc: 'Approved advisories automatically broadcast via PWA notifications, SMS gateway, and localized WhatsApp community channels.',
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="py-12 sm:py-20 bg-[#F7FAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <SectionHeading
          eyebrow="Extension Officer Console"
          title="Empowering agricultural officers with localized intelligence."
          subtitle="A specialized portal for Block Development Officers, Agricultural Extension Officers, and Krishi Vigyan Kendra (KVK) scientists to review, verify, and broadcast crop-weather advisories."
        />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {officerTools.map((tool, i) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.title}
                className="bg-white rounded-3xl border border-[#E2E8E4] p-6 shadow-sm flex flex-col justify-between hover:border-[#166534]/30 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#17201A] mb-2">{tool.title}</h3>
                  <p className="text-xs sm:text-sm text-[#647067] leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8E4] text-[11px] font-semibold text-[#166534]">
                  Officer Tool
                </div>
              </div>
            )
          })}
        </div>

        {/* Institutional Workflow Card */}
        <div className="bg-white rounded-3xl border border-[#E2E8E4] p-8 sm:p-12 shadow-sm text-left">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#166534] bg-[#DCFCE7] px-3 py-1 rounded-full">
              Verification Protocol
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A]">
              Why human verification is non-negotiable in public agriculture.
            </h3>
            <p className="text-sm text-[#647067] leading-relaxed">
              In developing rural economies, an incorrect advisory to "delay irrigation" when no rain arrives can ruin an entire season's harvest. Similarly, telling farmers to spray pesticides before an unexpected downpour washes away costly inputs.
            </p>
            <p className="text-sm text-[#647067] leading-relaxed">
              MausamSetu combines the computational speed of machine-learning spatial downscaling with the wisdom and ground-reality experience of Indian agricultural officers.
            </p>

            <div className="pt-4">
              <Link to="/login?role=officer">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Login to Officer Review Console
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Pilot Deployment Notice */}
        <div className="p-8 rounded-3xl bg-[#14532D] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">Nagpur District Pilot</h3>
            <p className="text-sm text-[#DCFCE7]">
              Covering Kalmeshwar, Saoner, Katol, and Ramtek blocks across 78 Gram Panchayats.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login?role=officer">
              <button className="px-6 py-3 rounded-xl bg-white text-[#166534] font-bold text-sm hover:bg-[#F7FAF7] transition-all flex items-center gap-2">
                <span>Access Officer Portal</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfficersPage
