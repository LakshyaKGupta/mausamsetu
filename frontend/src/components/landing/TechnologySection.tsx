import React from 'react'
import { Database, Map, Cpu, BookOpen, ShieldCheck, Plus } from 'lucide-react'
import { SectionHeading } from '../shared/SectionHeading'

export const TechnologySection: React.FC = () => {
  const techStack = [
    {
      title: 'IMD & Open Weather Sources',
      badge: 'Data Layer',
      desc: 'Ingests numerical weather prediction models (GFS, ECMWF, Open-Meteo) and IMD regional observations.',
      icon: Database,
    },
    {
      title: 'Geospatial Topography',
      badge: 'Spatial Context',
      desc: 'SRTM 30m Digital Elevation Models (DEM), slope analysis, aspect, and distance to water bodies.',
      icon: Map,
    },
    {
      title: 'ML Downscaling Models',
      badge: 'Inference',
      desc: 'Topographic bias correction coupled with gradient-boosted regression for Panchayat resolution.',
      icon: Cpu,
    },
    {
      title: 'Agricultural Rules Engine',
      badge: 'Decision Logic',
      desc: 'Agronomic heuristics calibrated to crop growth stages, soil moisture retention, and pest triggers.',
      icon: BookOpen,
    },
    {
      title: 'Human Officer Verification',
      badge: 'Accountability',
      desc: 'Extension officers review and sign off before advisories are pushed to mobile devices.',
      icon: ShieldCheck,
    },
  ]

  return (
    <section className="py-20 sm:py-28 bg-[#F7FAF7] border-b border-[#E2E8E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Grounded Engineering"
          title="Built on real weather intelligence, not buzzwords."
          subtitle="A transparent, verifiable technical architecture where every prediction can be traced back to its meteorological source, elevation delta, and human sign-off."
        />

        {/* Modular Tech Flow Diagram */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon
              return (
                <div
                  key={tech.title}
                  className="bg-white rounded-2xl p-5 border border-[#E2E8E4] shadow-sm flex flex-col justify-between text-left relative"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold mb-3">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] bg-[#F7FAF7] px-2 py-0.5 rounded">
                      {tech.badge}
                    </span>
                    <h4 className="text-sm font-bold text-[#17201A] mt-2 mb-1.5 leading-snug">
                      {tech.title}
                    </h4>
                    <p className="text-xs text-[#647067] leading-relaxed">
                      {tech.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E2E8E4] text-[11px] font-semibold text-[#166534]">
                    Stage 0{idx + 1}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Calibrated Statistics Note */}
          <div className="mt-8 p-4 rounded-2xl bg-white border border-[#E2E8E4] text-xs text-[#647067] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="flex items-center gap-1.5 font-medium text-[#17201A]">
              <ShieldCheck size={16} className="text-[#166534]" />
              Spatial downscaling validated on regional AWS weather stations in Nagpur District.
            </span>
            <span className="text-[#166534] font-semibold">
              Open-source architecture for SIH 2026
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
