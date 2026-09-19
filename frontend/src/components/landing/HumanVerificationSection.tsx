import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, UserCheck, CheckCircle2, AlertCircle, RefreshCw, FileText, ArrowRight } from 'lucide-react'
import { Button } from '../shared/Button'

export const HumanVerificationSection: React.FC = () => {
  const [advisoryStatus, setAdvisoryStatus] = useState<'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED'>('PENDING')
  const [officerNote, setOfficerNote] = useState<string>('Heavy rainfall expected in low-lying fields. Ensure drainage channels are clear.')

  const handleAction = (status: 'APPROVED' | 'MODIFIED' | 'REJECTED') => {
    setAdvisoryStatus(status)
  }

  return (
    <section
      id="verification"
      className="relative min-h-screen flex flex-col justify-center bg-white border-b border-[#E2E8E4] py-16 lg:py-24 overflow-hidden"
    >
      {/* Background subtle contour */}
      <div className="absolute inset-0 opacity-25 bg-contour-pattern pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-semibold uppercase tracking-wider mb-3">
            <UserCheck size={14} />
            <span>03 • Human-in-the-Loop Verification</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#17201A] tracking-tight leading-tight">
            AI proposes. <br />
            <span className="text-[#166534]">Agricultural officers verify.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#647067] mt-4 leading-relaxed font-normal">
            No machine learning output ever reaches a farmer without the review and digital sign-off of an authorized Block Agricultural Officer. This eliminates AI hallucinations and guarantees field accountability.
          </p>
        </div>

        {/* The Human-in-the-Loop Workflow Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 4-Step Verification Chain */}
          <div className="lg:col-span-5 bg-[#F7FAF7] rounded-2xl border border-[#E2E8E4] p-6 sm:p-7 flex flex-col justify-between text-left relative">
            <div>
              <h3 className="text-lg font-bold text-[#17201A] mb-1">
                Data Provenance & Audit Trail
              </h3>
              <p className="text-xs text-[#647067] mb-6">
                Every advisory is digitally stamped with its origin and approval hash.
              </p>

              {/* Steps */}
              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'ML Downscaling',
                    desc: 'XGBoost model downscales IMD block forecast to 1km Panchayat grid.',
                    status: 'COMPLETED',
                    time: '06:00 AM IST',
                  },
                  {
                    step: '02',
                    title: 'Empirical Uncertainty Check',
                    desc: 'Residuals validated against 2022-2023 ground truth (E80 error: ±0.11 mm).',
                    status: 'PASSED',
                    time: '06:05 AM IST',
                  },
                  {
                    step: '03',
                    title: 'Officer Review & Sanction',
                    desc: 'Block Officer reviews discrepancy and authorizes dispatch.',
                    status: advisoryStatus === 'PENDING' ? 'IN_REVIEW' : 'COMPLETED',
                    time: '06:15 AM IST',
                  },
                  {
                    step: '04',
                    title: 'Farmer Broadcast',
                    desc: 'PWA notification, SMS broadcast, and Voice Assistant update.',
                    status: advisoryStatus === 'PENDING' ? 'QUEUED' : 'ACTIVE',
                    time: '06:30 AM IST',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8E4] flex items-center justify-center text-xs font-bold text-[#166534] shadow-sm shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1 bg-white border border-[#E2E8E4] rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#17201A]">{item.title}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          item.status === 'COMPLETED' || item.status === 'PASSED' || item.status === 'ACTIVE'
                            ? 'bg-[#DCFCE7] text-[#14532D]'
                            : item.status === 'IN_REVIEW'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#F1F5F9] text-[#647067]'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#647067] mt-1">{item.desc}</p>
                      <p className="text-[10px] text-[#94A3B8] font-mono mt-1.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Audit Tag */}
            <div className="mt-6 pt-4 border-t border-[#E2E8E4] flex items-center justify-between text-xs text-[#647067]">
              <span>Officer: Dr. A. Sharma (KVK Nagpur)</span>
              <span className="font-semibold text-[#166534]">Digital Cryptographic Stamp</span>
            </div>
          </div>

          {/* Right Column: Interactive Officer Console Preview */}
          <div className="lg:col-span-7 bg-[#F7FAF7] rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 flex flex-col justify-between text-left">
            <div>
              {/* Console Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8E4] pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#166534] animate-pulse" />
                    <h3 className="text-lg font-bold text-[#17201A]">
                      Officer Review Console • Dhapewada Panchayat
                    </h3>
                  </div>
                  <p className="text-xs text-[#647067] mt-0.5">
                    Kalmeshwar Block, Nagpur • Advisory ID: ADV-2026-0919-DH
                  </p>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  advisoryStatus === 'APPROVED'
                    ? 'bg-[#DCFCE7] text-[#14532D]'
                    : advisoryStatus === 'MODIFIED'
                    ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                    : advisoryStatus === 'REJECTED'
                    ? 'bg-[#FEF2F2] text-[#DC2626]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}>
                  STATUS: {advisoryStatus}
                </span>
              </div>

              {/* Data Comparison Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-[#E2E8E4] rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-[#647067] font-medium">Official IMD Forecast</p>
                  <p className="text-xl font-bold text-[#17201A] mt-1">18.5 mm</p>
                  <p className="text-[10px] text-[#647067] mt-0.5">Coarse Block Level</p>
                </div>

                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-[#14532D] font-medium">MausamSetu Refined</p>
                  <p className="text-xl font-bold text-[#166534] mt-1">22.1 mm</p>
                  <p className="text-[10px] text-[#166534] mt-0.5">Topographic Bias: +3.6mm</p>
                </div>

                <div className="bg-white border border-[#E2E8E4] rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-[#647067] font-medium">Uncertainty Bounds</p>
                  <p className="text-xl font-bold text-[#17201A] mt-1">±1.4 mm</p>
                  <p className="text-[10px] text-[#166534] font-semibold mt-0.5">HIGH RELIABILITY</p>
                </div>
              </div>

              {/* Recommended Advisory Text Box */}
              <div className="bg-white border border-[#E2E8E4] rounded-xl p-5 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#17201A] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#166534]" />
                    <span>Proposed Advisory Text for Farmers</span>
                  </label>
                  <span className="text-[11px] text-[#647067]">Bilingual (Hindi + Marathi + English)</span>
                </div>
                <textarea
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  rows={2}
                  className="w-full text-xs text-[#17201A] bg-[#F8FAFC] border border-[#E2E8E4] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#166534]"
                />
              </div>

              {/* Action Buttons: Approve, Modify, Reject */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleAction('APPROVED')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                    advisoryStatus === 'APPROVED'
                      ? 'bg-[#166534] text-white shadow-md'
                      : 'bg-[#166534] text-white hover:bg-[#14532D]'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve & Dispatch</span>
                </button>

                <button
                  onClick={() => handleAction('MODIFIED')}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs border border-[#3B82F6] text-[#1D4ED8] bg-white hover:bg-[#EFF6FF] transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  <span>Modify Advisory</span>
                </button>

                <button
                  onClick={() => handleAction('REJECTED')}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs border border-[#EF4444] text-[#DC2626] bg-white hover:bg-[#FEF2F2] transition-all flex items-center gap-1.5"
                >
                  <AlertCircle size={14} />
                  <span>Reject (Fallback to IMD)</span>
                </button>
              </div>

              {/* Dispatch Feedback Message */}
              {advisoryStatus !== 'PENDING' && (
                <div className="mt-4 p-3 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-xs text-[#14532D] font-medium flex items-center justify-between">
                  <span>✓ Action recorded by Officer. Farmers in Dhapewada notified via PWA & SMS.</span>
                  <button onClick={() => setAdvisoryStatus('PENDING')} className="text-[#166534] underline text-[11px]">
                    Reset Demo
                  </button>
                </div>
              )}
            </div>

            {/* Officer Assurance */}
            <div className="mt-6 pt-4 border-t border-[#E2E8E4] text-[11px] text-[#647067]">
              * If an officer does not approve within 60 minutes, the system automatically falls back to the baseline official IMD forecast to ensure uninterrupted farmer safety.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
