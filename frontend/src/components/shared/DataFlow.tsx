import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FlowStage {
  id: string
  label: string
  sublabel?: string
  icon?: React.ReactNode
  state?: 'idle' | 'active' | 'done' | 'modified'
}

interface DataFlowProps {
  stages: FlowStage[]
  /** Currently active stage index (0-based) */
  activeIndex: number
  className?: string
  vertical?: boolean
}

const STATE_COLORS = {
  idle: { dot: '#CBD5E1', border: '#E2E8F0', bg: '#F8FAFC', text: '#66736B' },
  active: { dot: '#3B82F6', border: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF' },
  done: { dot: '#126B3A', border: '#126B3A', bg: '#EAF5EC', text: '#126B3A' },
  modified: { dot: '#D97706', border: '#D97706', bg: '#FFFBEB', text: '#92400E' },
}

export const DataFlow: React.FC<DataFlowProps> = ({
  stages,
  activeIndex,
  className = '',
  vertical = true,
}) => {
  const [packetPos, setPacketPos] = useState(0)

  // Animate packet from stage to stage
  useEffect(() => {
    setPacketPos(activeIndex)
  }, [activeIndex])

  if (vertical) {
    return (
      <div className={`flex flex-col items-start gap-0 ${className}`}>
        {stages.map((stage, i) => {
          const stateKey: FlowStage['state'] =
            i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'idle'
          const state = stage.state || stateKey
          const colors = STATE_COLORS[state]
          const isLast = i === stages.length - 1

          return (
            <div key={stage.id} className="flex flex-col items-start w-full">
              {/* Stage row */}
              <div className="flex items-center gap-3 w-full">
                {/* Dot + connector */}
                <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                  <motion.div
                    animate={{
                      backgroundColor: colors.dot,
                      scale: state === 'active' ? 1.25 : 1,
                    }}
                    transition={{ duration: 0.35 }}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.dot }}
                  />
                </div>

                {/* Stage label card */}
                <motion.div
                  animate={{
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                  }}
                  transition={{ duration: 0.35 }}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium"
                  style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span style={{ color: colors.text }} className="font-semibold text-xs">
                        {stage.label}
                      </span>
                      {stage.sublabel && (
                        <p className="text-[10px] text-[#66736B] mt-0.5">{stage.sublabel}</p>
                      )}
                    </div>
                    {state === 'done' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[#126B3A] text-xs font-bold"
                      >
                        ✓
                      </motion.span>
                    )}
                    {state === 'active' && (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="text-xs font-mono"
                        style={{ color: colors.text }}
                      >
                        ●
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Animated connector line with packet */}
              {!isLast && (
                <div className="flex items-start gap-0" style={{ paddingLeft: 8 }}>
                  <div className="relative" style={{ width: 4, height: 28 }}>
                    {/* Static line */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0"
                      style={{
                        width: 1.5,
                        backgroundColor: i < activeIndex ? '#126B3A' : '#E2E8F0',
                        transition: 'background-color 0.4s',
                      }}
                    />
                    {/* Traveling packet */}
                    {i === activeIndex - 1 && (
                      <motion.div
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: 24, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#126B3A]"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal layout
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      {stages.map((stage, i) => {
        const stateKey: FlowStage['state'] =
          i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'idle'
        const state = stage.state || stateKey
        const colors = STATE_COLORS[state]
        const isLast = i === stages.length - 1

        return (
          <div key={stage.id} className="flex items-center">
            <motion.div
              animate={{ borderColor: colors.border, backgroundColor: colors.bg }}
              transition={{ duration: 0.35 }}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
              style={{ borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}
            >
              {stage.label}
            </motion.div>
            {!isLast && (
              <div className="relative mx-1" style={{ width: 32, height: 2 }}>
                <div className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: i < activeIndex ? '#126B3A' : '#E2E8F0' }} />
                {i === activeIndex - 1 && (
                  <motion.div
                    initial={{ left: 0, opacity: 0 }}
                    animate={{ left: 28, opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#126B3A]"
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
