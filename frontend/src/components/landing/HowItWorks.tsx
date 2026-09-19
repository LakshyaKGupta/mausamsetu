import React from 'react'
import { motion } from 'framer-motion'
import { Database, Mountain, Cpu, ShieldAlert, Sprout, UserCheck, Smartphone } from 'lucide-react'
import { SectionHeading } from '../shared/SectionHeading'

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Weather Data Ingestion',
      category: 'Input Layer',
      desc: 'Ingests regional NWP models from IMD, ECMWF/ERA5, and high-frequency Open-Meteo numerical weather forecasts.',
      icon: Database,
    },
    {
      num: '02',
      title: 'Local Topography & Features',
      category: 'Geospatial Context',
      desc: 'Enriches coarse data with high-resolution SRTM Digital Elevation Models, slope, aspect, and distance to water bodies for each Panchayat.',
      icon: Mountain,
    },
    {
      num: '03',
      title: 'ML Spatial Downscaling',
      category: 'Downscaling Engine',
      desc: 'Elevation bias correction and gradient-boosted regression downscale predictions from 25 km coarse grid to 1–2 km Panchayat resolution.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'Reliability & Calibration',
      category: 'Uncertainty Bounds',
      desc: 'Computes ±E80 confidence intervals. If uncertainty exceeds acceptable thresholds, conservative agricultural guidance is triggered.',
      icon: ShieldAlert,
    },
    {
      num: '05',
      title: 'Agricultural Decision Engine',
      category: 'Expert Rules',
      desc: 'Translates calibrated micro-climate parameters into crop-specific recommendations based on physiological growth stages.',
      icon: Sprout,
    },
    {
      num: '06',
      title: 'Officer Verification',
      category: 'Human Accountability',
      desc: 'Block Agricultural Extension Officers review the advisory, cross-check local irrigation schedules, and approve or modify.',
      icon: UserCheck,
    },
    {
      num: '07',
      title: 'Farmer Delivery',
      category: 'Field Impact',
      desc: 'Delivered in Hindi, Marathi, and English via mobile PWA, interactive voice assistant, and SMS/WhatsApp notifications.',
      icon: Smartphone,
    },
  ]

  return (
    <section className="py-20 sm:py-28 bg-white border-b border-[#E2E8E4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Data Pipeline"
          title="From meteorological data to farm decisions."
          subtitle="Every advisory follows a rigorous 7-stage pipeline ensuring scientific precision, calibrated uncertainty, and human accountability."
        />

        {/* Pipeline Stepper Visualization */}
        <div className="max-w-4xl mx-auto relative">
          {/* Subtle Vertical Connector Line with Moving Pulse */}
          <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-0.5 bg-[#E2E8E4]">
            <div className="w-full h-24 bg-gradient-to-b from-transparent via-[#166534] to-transparent animate-pulse" />
          </div>

          <div className="space-y-6 sm:space-y-8 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-start gap-4 sm:gap-6 group"
                >
                  {/* Step Icon Badge */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#F7FAF7] border border-[#E2E8E4] text-[#166534] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 group-hover:border-[#166534]/40 z-10">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#166534]" />
                  </div>

                  {/* Step Card */}
                  <div className="flex-1 bg-[#F7FAF7] border border-[#E2E8E4] rounded-2xl p-5 sm:p-6 text-left group-hover:bg-white group-hover:shadow-sm transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                          {step.num}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-[#17201A]">
                          {step.title}
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-[#647067] uppercase tracking-wider">
                        {step.category}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#647067] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
