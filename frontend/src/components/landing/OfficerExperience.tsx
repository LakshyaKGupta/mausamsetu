import React from 'react'
import { ShieldCheck, Check, Edit3, XCircle, ArrowRight, UserCheck, Eye } from 'lucide-react'
import { SectionHeading } from '../shared/SectionHeading'
import { Button } from '../shared/Button'
import { Link } from 'react-router-dom'

export const OfficerExperience: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-white border-b border-[#E2E8E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Officer Verification"
          title="Human-in-the-loop: The bridge of institutional trust."
          subtitle="Autonomous AI is not safe for agricultural livelihoods. Block Agricultural Officers review, adjust, and authorize every single advisory."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Column: Explanatory Text */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#166534] bg-[#DCFCE7] px-3 py-1 rounded-full">
                Officer Control
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17201A] mt-3">
                Empowering extension officers with calibrated AI forecasts.
              </h3>
              <p className="text-base text-[#647067] mt-2 leading-relaxed">
                Rather than replacing government agricultural workers, MausamSetu equips them with micro-level spatial downscaling and pre-drafted advisories. Officers retain full editorial authority to approve, modify, or reject advisories before dissemination.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17201A]">Full Editorial Discretion</h4>
                  <p className="text-xs text-[#647067] leading-relaxed">
                    Officers can edit Hindi, Marathi, and English translations or tailor notes to match local reservoir releases.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0 mt-0.5">
                  <Eye size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17201A]">Side-by-Side Model Audit</h4>
                  <p className="text-xs text-[#647067] leading-relaxed">
                    Compare official IMD block forecasts side-by-side with MausamSetu's refined Panchayat prediction and error bands.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17201A]">Cryptographic Audit Trail</h4>
                  <p className="text-xs text-[#647067] leading-relaxed">
                    Every review action is logged with timestamp, officer designation, and rationale for complete institutional transparency.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/login?role=officer">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Access Officer Portal Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Desktop Dashboard Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-[#F8FAFC] rounded-3xl border border-[#E2E8E4] p-5 sm:p-7 shadow-lg text-left space-y-5">
              {/* Dashboard Header Strip */}
              <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#166534]">OFFICER REVIEW CONSOLE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      Pending Review
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#17201A] mt-0.5">
                    Panchayat: Dhapewada (Kalmeshwar Block)
                  </h4>
                </div>
                <span className="text-xs text-[#647067] font-medium hidden sm:inline">
                  Crop: Soybean
                </span>
              </div>

              {/* Comparison Matrix Table */}
              <div className="bg-white rounded-2xl border border-[#E2E8E4] p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[#647067]">Official Block Forecast</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">18.5 mm</p>
                    <p className="text-[10px] text-slate-500 mt-1">Coarse 25km resolution</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                    <p className="text-[#166534] font-medium">MausamSetu Refined</p>
                    <p className="text-base font-bold text-[#166534] mt-0.5">22.1 mm</p>
                    <p className="text-[10px] text-[#14532D] mt-1">Expected error: ±1.4 mm</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
                  <span className="text-[#647067]">Downscaling Confidence:</span>
                  <span className="font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    HIGH (R² 0.94)
                  </span>
                </div>
              </div>

              {/* Recommended Advisory Box */}
              <div className="bg-white rounded-2xl border border-[#E2E8E4] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17201A]">Generated Advisory Content</span>
                  <span className="text-[11px] text-[#166534] font-medium">Hindi · Devanagari</span>
                </div>
                <p className="text-xs text-[#17201A] bg-[#F7FAF7] p-3 rounded-xl border border-[#E2E8E4] leading-relaxed">
                  "आगामी 24 घंटों में 22.1 मिमी वर्षा का अनुमान है। खेतों में जलभराव की स्थिति से बचने हेतु सिंचाई तुरंत रोकें तथा जल निकासी नालियों को साफ रखें।"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 grid grid-cols-3 gap-2 sm:gap-3">
                <button className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition-all shadow-sm">
                  <Check size={15} /> Approve
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-[#17201A] border border-[#E2E8E4] text-xs font-bold transition-all">
                  <Edit3 size={15} /> Modify
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition-all">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
