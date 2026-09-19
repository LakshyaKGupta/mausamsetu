import React from 'react'
import { CloudRain, Sprout, ShieldCheck, ArrowRight, Layers, Sliders, CheckCircle } from 'lucide-react'
import { SectionHeading } from '../shared/SectionHeading'
import { Link } from 'react-router-dom'

export const SolutionSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#F7FAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core Capabilities"
          title="Three pillars of Panchayat weather intelligence."
          subtitle="Built specifically for the realities of Indian agriculture: variable micro-climates, crop sensitivity, and human accountability."
        />

        <div className="space-y-16 sm:space-y-24">
          {/* Capability 1: Local Weather Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold">
                <CloudRain size={24} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#2563EB]">
                01 · Spatial Downscaling
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A] tracking-tight leading-tight">
                Panchayat-level refinement from coarse forecasts and local topography.
              </h3>
              <p className="text-base text-[#647067] leading-relaxed">
                Standard meteorological models forecast weather in 10–25 km blocks. MausamSetu ingests these regional baselines and couples them with high-resolution digital elevation models (SRTM DEM), slope, aspect, and distance-to-water bodies to downscale rainfall and temperature to each Gram Panchayat.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-[#17201A]">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Elevation bias correction accounts for orographic rainfall shifts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Quantified error margins (±E80 confidence intervals) for every prediction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Continuous calibration against AWS ground observations</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4">
                  <span className="text-xs font-bold text-[#647067] uppercase tracking-wider">
                    Downscaling Comparison · Nagpur
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                    Resolution: ~2 km
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#647067]">Official Block Forecast (Kalmeshwar)</p>
                      <p className="text-lg font-bold text-slate-700">18.5 mm (Block Average)</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-medium">Coarse Grid</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#166534] font-medium">MausamSetu Refined (Dhapewada GP)</p>
                      <p className="text-xl font-bold text-[#166534]">22.1 mm <span className="text-xs font-normal text-[#14532D]">(±1.4 mm error)</span></p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-[#DCFCE7] text-[#14532D] font-bold">Refined Local</span>
                  </div>
                </div>

                <p className="text-xs text-[#647067] pt-2 border-t border-[#E2E8E4]">
                  *Dhapewada sits at 348m elevation, creating a +3.6 mm localized rainfall delta compared to lower valley fields.
                </p>
              </div>
            </div>
          </div>

          {/* Capability 2: Agricultural Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4">
                  <span className="text-xs font-bold text-[#647067] uppercase tracking-wider">
                    Crop Decision Engine
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D]">
                    Crop: Soybean (सोयाबीन)
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#D97706]">सिंचाई सलाह (Irrigation Action)</span>
                      <span className="text-[11px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded">
                        Action: POSTPONE
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#17201A] leading-snug">
                      आगामी 24 घंटों में 4.2 मिमी वर्षा का अनुमान है। आज सिंचाई टालें ताकि खेत में जलभराव न हो।
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8E4]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#647067]">छिड़काव सलाह (Spraying Action)</span>
                      <span className="text-[11px] font-semibold text-[#647067] bg-slate-200 px-2 py-0.5 rounded">
                        Action: AVOID
                      </span>
                    </div>
                    <p className="text-xs text-[#647067] leading-snug">
                      हवा की गति 14 किमी/घंटा और वर्षा की संभावना के कारण कीटनाशक छिड़काव से दवा धुलने का जोखिम है।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] flex items-center justify-center font-bold">
                <Sprout size={24} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#166534]">
                02 · Agricultural Rules
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A] tracking-tight leading-tight">
                Converting weather parameters into crop-specific field actions.
              </h3>
              <p className="text-base text-[#647067] leading-relaxed">
                Weather numbers alone do not prevent crop damage. MausamSetu's decision matrix translates temperature, rainfall probability, humidity, and wind speed into concrete recommendations for major crops like Soybean, Cotton, Orange, and Gram.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-[#17201A]">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Growth-stage specific sensitivity thresholds</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Pest & fungal disease outbreak risk alerts based on humidity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Clear, unambiguous action directives (Irrigate / Delay / Spray / Harvest)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Capability 3: Trusted Decisions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#166534]">
                03 · Human-in-the-Loop
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A] tracking-tight leading-tight">
                Officer verification guarantees trustworthiness before delivery.
              </h3>
              <p className="text-base text-[#647067] leading-relaxed">
                No autonomous AI output is sent directly to vulnerable farmers without human accountability. Agricultural Extension Officers review AI-generated advisories on a dedicated portal, verify localized conditions against field knowledge, and modify or approve advisories before broadcast.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-[#17201A]">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Official verification timestamp and officer credential provenance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Audit trail of all approvals, modifications, and rejections</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Fosters farmer trust through recognized government extension authority</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4">
                  <span className="text-xs font-bold text-[#647067] uppercase tracking-wider">
                    Officer Verification Protocol
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D]">
                    Status: APPROVED
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#F7FAF7] border border-[#E2E8E4] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#647067]">
                    <span>Reviewing Officer</span>
                    <strong className="text-[#17201A]">Dr. R. K. Deshmukh (BDO Kalmeshwar)</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#647067]">
                    <span>Verification Time</span>
                    <strong className="text-[#17201A]">19 Sep 2026 · 09:30 AM</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#647067]">
                    <span>Officer Note</span>
                    <span className="text-xs italic text-[#166534]">"Verified against local canal discharge schedule."</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] flex items-center gap-2 text-xs font-semibold text-[#14532D]">
                  <CheckCircle size={16} className="text-[#166534]" />
                  <span>Cryptographically signed & broadcasted to 1,240 registered farmers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
