import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, Cpu, CheckCircle2, ShieldCheck, FileCheck, Send } from 'lucide-react'
import { SectionReveal } from '../shared/SectionReveal'
import { DataFlow } from '../shared/DataFlow'

export const HumanVerificationSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<number>(1) // 1: AI, 2: Officer, 3: Farmer

  const NODE_DURATION = 4000

  // Continuous auto-advancing through the verification workflow
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((prev) => (prev >= 4 ? 1 : prev + 1))
    }, NODE_DURATION)
    return () => clearInterval(timer)
  }, [])

  const pipelineStages = [
    {
      id: 'ai',
      label: 'AI Forecast Model',
      sublabel: 'Terrain-refined prediction generated',
    },
    {
      id: 'officer',
      label: 'Officer Review Portal',
      sublabel: 'Block Agricultural Officer inspects & signs',
    },
    {
      id: 'advisory',
      label: 'Verified Advisory',
      sublabel: 'Advisory marked approved + timestamp',
    },
    {
      id: 'farmer',
      label: 'Farmer Delivery',
      sublabel: 'Delivered via PWA + voice in local language',
    },
  ]

  // activeNode maps to pipeline 1→0, 2→1, 3→2, 4→3
  const pipelineActive = activeNode - 1

  const nodeDetails: Record<number, { title: string; body: string; state: string; stateColor: string }> = {
    1: {
      title: '1. Model Downscaled Proposal',
      body: 'Numerical forecast downscaled using local topography and AWS calibration. Draft recommendation generated for Panchayat cluster.',
      state: 'Draft Proposal',
      stateColor: 'bg-[#EFF6FF] text-[#3B82F6] border-blue-200',
    },
    2: {
      title: '2. Officer Inspection & Calibration',
      body: 'Block Agricultural Extension Officer inspects local pest risks, ground-station telemetry, and field conditions.',
      state: 'In Review',
      stateColor: 'bg-[#FFFBEB] text-[#D97706] border-amber-200',
    },
    3: {
      title: '3. Digital Signature & Verification',
      body: 'Advisory approved and cryptographically stamped with officer credentials. Draft status immediately transforms to verified public notice.',
      state: 'Verified',
      stateColor: 'bg-[#EAF5EC] text-[#126B3A] border-[#126B3A]/30',
    },
    4: {
      title: '4. Last-Mile Field Delivery',
      body: 'Disseminated instantly to farmers through offline-capable PWA, WhatsApp integration, and native vernacular voice playback.',
      state: 'Dispatched',
      stateColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
  }

  const detail = nodeDetails[activeNode]

  return (
    <section
      id="verification"
      className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] w-full bg-white border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden py-12 lg:py-10"
    >
      <div className="absolute inset-0 bg-topo-grid opacity-15 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-[15%] left-[10%] w-[420px] h-[420px] rounded-full bg-[#EAF5EC]/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
        {/* Section Header */}
        <SectionReveal variant="default" className="max-w-3xl mb-6 sm:mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EC] border border-[#126B3A]/20 text-[#126B3A] text-xs font-mono font-semibold uppercase tracking-wider mb-2.5">
            <UserCheck size={13} />
            <span>Governance &middot; Section 03</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#111814] tracking-tight leading-[1.08]">
            Verified by Agricultural Officers{' '}
            <span className="text-[#126B3A]">Before Reaching Farmers</span>
          </h2>
          <p className="text-sm sm:text-base text-[#66736B] mt-2 leading-relaxed">
            No machine learning advisory is ever sent directly to a farmer without human oversight.
            Block Agricultural Officers review, customise, and digitally sign every recommendation.
          </p>
        </SectionReveal>

        {/* 2-Column: Pipeline left, Detail right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: DataFlow pipeline */}
          <SectionReveal variant="left" className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-[#E2E8E4] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#F1F5F9]">
                <span className="w-2 h-2 rounded-full bg-[#126B3A] animate-node-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#66736B]">Advisory Pipeline</span>
              </div>
              <DataFlow
                stages={pipelineStages}
                activeIndex={pipelineActive}
                vertical={true}
              />
              {/* Progress bar at bottom */}
              <div className="mt-5 pt-3 border-t border-[#F1F5F9]">
                <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <motion.div
                    key={`pipeline-progress-${activeNode}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 4, ease: 'linear' }}
                    style={{ originX: 0 }}
                    className="h-full bg-[#126B3A] rounded-full will-change-transform"
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-[#66736B]">
                  <span>Stage {pipelineActive + 1} of {pipelineStages.length}</span>
                  <span className="font-mono font-semibold text-[#126B3A]">Auto-advancing</span>
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* Right: Animated detail */}
          <SectionReveal variant="scale" className="lg:col-span-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl border border-[#E2E8E4] p-5 shadow-sm space-y-4"
              >
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${detail.stateColor}`}>
                    {detail.state}
                  </span>
                  <span className="text-[10px] text-[#66736B] font-mono">Stage {pipelineActive + 1}/{pipelineStages.length}</span>
                </div>

                {/* Main content */}
                <div>
                  <h3 className="text-base sm:text-xl font-black text-[#111814] leading-snug">{detail.title}</h3>
                  <p className="text-sm text-[#66736B] mt-1.5 leading-relaxed">{detail.body}</p>
                </div>

                {/* Visual node indicator */}
                {activeNode === 1 && (
                  <div className="rounded-xl bg-[#EFF6FF] border border-blue-100 p-3.5 flex items-center gap-3">
                    <Cpu size={22} className="text-[#3B82F6] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#1E40AF]">Draft Advisory Ready</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-semibold">Stage 1</span>
                      </div>
                      <p className="text-[11px] text-[#66736B] mt-0.5">Topography downscaled · Awaiting extension officer review</p>
                    </div>
                  </div>
                )}
                {activeNode === 2 && (
                  <div className="rounded-xl bg-[#FFFBEB] border border-amber-200 p-3.5 flex items-center gap-3">
                    <FileCheck size={22} className="text-[#D97706] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#92400E]">Officer Console Active</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-semibold">Stage 2</span>
                      </div>
                      <p className="text-[11px] text-[#66736B] mt-0.5">Evaluating soil telemetry & adjusting pesticide timing</p>
                    </div>
                  </div>
                )}
                {activeNode === 3 && (
                  <div className="rounded-xl bg-[#EAF5EC] border border-[#126B3A]/30 p-3.5 flex items-center gap-3">
                    <ShieldCheck size={22} className="text-[#126B3A] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#126B3A]">Digitally Signed & Verified</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#126B3A] text-white font-mono font-bold">✓ VERIFIED</span>
                      </div>
                      <p className="text-[11px] text-[#4B6354] mt-0.5 font-mono">
                        Signed: 09:14 IST · Officer ID: BAO-704 · Nagpur East
                      </p>
                    </div>
                  </div>
                )}
                {activeNode === 4 && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3">
                    <Send size={22} className="text-emerald-700 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-emerald-900">Broadcast Dispatched</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold">Stage 4</span>
                      </div>
                      <p className="text-[11px] text-[#66736B] mt-0.5">PWA audio + SMS + WhatsApp in Marathi & Hindi</p>
                    </div>
                  </div>
                )}

                {/* Step nav dots */}
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setActiveNode(n)}
                      className={`rounded-full transition-all duration-300 ${
                        activeNode === n ? 'bg-[#126B3A] w-6 h-1.5' : 'bg-[#E2E8E4] w-1.5 h-1.5 hover:bg-[#126B3A]/40'
                      }`}
                      aria-label={`Stage ${n}`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Key governance pillars */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: <UserCheck size={16} />, label: 'Human in Loop' },
                { icon: <FileCheck size={16} />, label: 'Digital Signature' },
                { icon: <Send size={16} />, label: 'Local Language' },
              ].map(({ icon, label }) => (
                <div key={label} className="bg-white rounded-xl border border-[#E2E8E4] p-3 flex flex-col items-center gap-1.5 text-center shadow-2xs">
                  <div className="text-[#126B3A]">{icon}</div>
                  <span className="text-[10px] font-semibold text-[#66736B]">{label}</span>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}
