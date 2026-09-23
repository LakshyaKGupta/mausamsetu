import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Monitor,
  Mic,
  Volume2,
  ArrowRight,
  Check,
  Play,
  Pause,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionReveal } from '../shared/SectionReveal'
import { Button } from '../shared/Button'

type PhoneStep = 'weather' | 'advisory' | 'voice_question' | 'voice_answer' | 'offline'

export const ExperienceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'farmer' | 'officer'>('farmer')
  const [phoneTab, setPhoneTab] = useState<PhoneStep>('weather')
  const [officerTab, setOfficerTab] = useState<'queue' | 'alerts'>('queue')
  const [isOfficerApproved, setIsOfficerApproved] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const TAB_DURATION = 6500 // 6.5 seconds per tab

  // Auto-animate between Farmer & Officer tabs
  useEffect(() => {
    if (isPaused) return

    setProgress(0)
    const startTime = Date.now()

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, (elapsed / TAB_DURATION) * 100)
      setProgress(pct)
    }, 50)

    timerRef.current = setTimeout(() => {
      setActiveTab((prev) => (prev === 'farmer' ? 'officer' : 'farmer'))
    }, TAB_DURATION)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [activeTab, isPaused])

  return (
    <section
      id="experience"
      className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] w-full bg-[#F6F9F5] border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden py-12 lg:py-10"
    >
      {/* Subtle topographic background */}
      <div className="absolute inset-0 bg-topo-grid opacity-15 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-[10%] right-[20%] w-[420px] h-[420px] rounded-full bg-[#EAF5EC]/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
        {/* Section Header */}
        <SectionReveal variant="default" className="max-w-3xl mb-5 sm:mb-7 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EC] border border-[#126B3A]/20 text-[#126B3A] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Smartphone size={13} />
            <span>Deployment &middot; Section 04</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#111814] tracking-tight leading-[1.08]">
            From Field Farmers to{' '}
            <span className="text-[#126B3A]">District Officers</span>
          </h2>
          <p className="text-sm sm:text-base text-[#66736B] mt-1.5 leading-relaxed">
            Tailored interfaces for both audiences: a voice-first, offline-capable PWA for rural farmers, and a comprehensive oversight portal for agricultural officers.
          </p>

          {/* Auto-Play Control Pill */}
          <div className="flex items-center gap-3 mt-2.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E8E4] text-[#166534] shadow-2xs hover:bg-[#F8FAFC] transition-colors"
              aria-label={isPaused ? 'Resume auto-animation' : 'Pause auto-animation'}
            >
              {isPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
              <span>{isPaused ? 'Tab Cycling Paused' : 'Auto-alternating Views'}</span>
            </button>
            <span className="text-xs text-[#94A3B8]">
              Switching tabs every 6.5s • Click to lock view
            </span>
          </div>
        </SectionReveal>

        {/* Tab Switcher (Pill Style with Active Progress) */}
        <SectionReveal variant="stagger" className="flex items-center justify-start gap-2 mb-5">
          <div className="bg-white p-1.5 rounded-2xl border border-[#E2E8E4] shadow-xs flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('farmer')
                setProgress(0)
              }}
              className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === 'farmer'
                  ? 'bg-[#126B3A] text-white shadow-sm'
                  : 'text-[#66736B] hover:text-[#111814] hover:bg-[#F6F9F5]'
              }`}
            >
              {activeTab === 'farmer' && (
                <div
                  className="absolute bottom-0 left-0 h-[2.5px] bg-[#86EFAC] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              )}
              <Smartphone size={15} />
              <span>For Farmers (Mobile PWA)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('officer')
                setProgress(0)
              }}
              className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === 'officer'
                  ? 'bg-[#126B3A] text-white shadow-sm'
                  : 'text-[#66736B] hover:text-[#111814] hover:bg-[#F6F9F5]'
              }`}
            >
              {activeTab === 'officer' && (
                <div
                  className="absolute bottom-0 left-0 h-[2.5px] bg-[#86EFAC] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              )}
              <Monitor size={15} />
              <span>For Agricultural Officers</span>
            </button>
          </div>
        </SectionReveal>

        {/* Tab Content Display */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'farmer' ? (
              <motion.div
                key="farmer-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Left Column: Feature Highlights */}
                <div className="lg:col-span-6 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <span>📱 Progressive Web App (PWA)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
                    Zero-Friction Mobile App Designed for Rural India
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    No complex app stores or heavy downloads required. Works instantly in any mobile browser, installs with one tap to the home screen, and functions even with unstable 2G or zero connectivity.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-emerald-100 text-[#166534] mt-0.5">
                        <Check size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Native Vernacular Support</p>
                        <p className="text-[11px] text-[#64748B]">Read advisories in Hindi, Marathi, Telugu, Tamil, and English.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-emerald-100 text-[#166534] mt-0.5">
                        <Check size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Voice Query & Audio Playback</p>
                        <p className="text-[11px] text-[#64748B]">Ask questions by voice and listen to spoken advice directly in the field.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-emerald-100 text-[#166534] mt-0.5">
                        <Check size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Offline-First Syncing</p>
                        <p className="text-[11px] text-[#64748B]">Caches latest forecasts automatically for access when away from cellular towers.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link to="/app/farmer">
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight size={15} />}>
                        Open Farmer Portal
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Interactive Mobile Phone Mockup */}
                <div className="lg:col-span-6 flex flex-col items-center">
                  {/* Phone State Step Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3.5 max-w-sm">
                    {[
                      { id: 'weather', label: '1. Weather' },
                      { id: 'advisory', label: '2. Advisory' },
                      { id: 'voice_question', label: '3. Voice Ask' },
                      { id: 'voice_answer', label: '4. Spoken Reply' },
                      { id: 'offline', label: '5. Offline Cache' },
                    ].map((step) => {
                      const isActive = phoneTab === step.id
                      return (
                        <button
                          key={step.id}
                          onClick={() => setPhoneTab(step.id as any)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                            isActive
                              ? 'bg-[#126B3A] text-white shadow-xs'
                              : 'bg-white border border-[#E2E8E4] text-[#66736B] hover:text-[#111814]'
                          }`}
                        >
                          {step.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="w-full max-w-[330px] rounded-[40px] bg-[#0F172A] p-3 shadow-2xl border-4 border-[#1E293B] relative">
                    {/* Phone Notch */}
                    <div className="w-20 h-4 bg-[#1E293B] rounded-full mx-auto mb-2.5" />

                    {/* Screen Content */}
                    <div className="rounded-[28px] bg-white overflow-hidden p-3.5 space-y-2.5 text-left border border-[#E2E8F0] min-h-[360px] flex flex-col justify-between">
                      {/* Phone Status Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-0.5 pb-1 border-b border-[#F8FAFC]">
                          <span>09:41</span>
                          <div className="flex items-center gap-1.5">
                            <span className={phoneTab === 'offline' ? 'text-amber-500 font-bold' : ''}>
                              {phoneTab === 'offline' ? 'No Service' : '5G'}
                            </span>
                            <div className="w-3.5 h-1.5 rounded-xs border border-slate-400 p-0.5 flex items-center">
                              <div className="w-full h-full bg-slate-400 rounded-2xs" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-[#F1F5F9] pt-1.5 pb-1.5">
                          <span className="font-bold text-xs text-[#126B3A]">MausamSetu PWA</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            phoneTab === 'offline'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${phoneTab === 'offline' ? 'bg-amber-600' : 'bg-emerald-600 animate-pulse'}`} />
                            {phoneTab === 'offline' ? 'Offline Storage' : 'Live Sync'}
                          </span>
                        </div>
                      </div>

                      {/* Animated Phone Screen States */}
                      <div className="flex-1 py-1">
                        <AnimatePresence mode="wait">
                          {/* State 1: Weather */}
                          {phoneTab === 'weather' && (
                            <motion.div
                              key="state-weather"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2"
                            >
                              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#126B3A] to-[#0B4F2A] text-white shadow-sm">
                                <span className="text-[9px] uppercase font-bold text-emerald-200">
                                  आज का मौसम • Dhapewada
                                </span>
                                <p className="text-2xl font-black mt-0.5">27°C • हल्की वर्षा</p>
                                <p className="text-[10px] text-emerald-100 mt-0.5">4.2 mm वर्षा अनुमान • आर्द्रता 74%</p>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 text-center">
                                <div className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8E4]">
                                  <span className="text-[9px] text-[#66736B] block">दोपहर 12:00</span>
                                  <span className="text-xs font-bold text-[#111814]">28°C</span>
                                </div>
                                <div className="p-1.5 rounded-lg bg-[#EAF5EC] border border-[#126B3A]/30">
                                  <span className="text-[9px] text-[#126B3A] block">दोपहर 03:00</span>
                                  <span className="text-xs font-bold text-[#126B3A]">वर्षा 3mm</span>
                                </div>
                                <div className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8E4]">
                                  <span className="text-[9px] text-[#66736B] block">शाम 06:00</span>
                                  <span className="text-xs font-bold text-[#111814]">25°C</span>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* State 2: Crop Advisory */}
                          {phoneTab === 'advisory' && (
                            <motion.div
                              key="state-advisory"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2"
                            >
                              <div className="p-3 rounded-2xl bg-white border border-[#126B3A]/30 shadow-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#111814]">सोयाबीन फसल सलाह</span>
                                  <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✓ अधिकारी सत्यापित
                                  </span>
                                </div>
                                <p className="text-sm font-black text-[#126B3A]">सिंचाई 24 घंटे टालें</p>
                                <p className="text-[10.5px] text-[#66736B] leading-relaxed">
                                  आगामी वर्षा से मिट्टी में नमी बनी रहेगी। जलभराव रोकने के लिए जल निकासी नाली साफ रखें।
                                </p>
                                <div className="pt-1 text-[9px] font-mono text-[#94A3B8] border-t border-[#F1F5F9]">
                                  सत्यापित: 09:14 IST · ब्लॉक कृषि अधिकारी
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* State 3: Voice Question */}
                          {phoneTab === 'voice_question' && (
                            <motion.div
                              key="state-question"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-3 py-2 text-center"
                            >
                              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#126B3A] flex items-center justify-center mx-auto animate-pulse">
                                <Mic size={24} />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700">
                                  ध्वनि प्रश्न (Voice Query)
                                </span>
                                <p className="text-xs font-bold text-[#111814] px-2">
                                  &ldquo;क्या कल कपास में पानी देना ठीक रहेगा?&rdquo;
                                </p>
                              </div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                <span>आवाज़ पहचानी गई (Recognised)</span>
                              </div>
                            </motion.div>
                          )}

                          {/* State 4: Voice Answer */}
                          {phoneTab === 'voice_answer' && (
                            <motion.div
                              key="state-answer"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2.5 py-1"
                            >
                              <div className="p-3 rounded-2xl bg-[#EAF5EC] border border-[#126B3A]/30 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-[#126B3A] flex items-center gap-1">
                                    <Volume2 size={13} className="text-[#126B3A]" />
                                    <span>बोलकर उत्तर (Spoken Reply)</span>
                                  </span>
                                  <span className="text-[8.5px] font-mono bg-white px-1.5 py-0.5 rounded text-[#126B3A]">
                                    Marathi / Hindi
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-[#111814] leading-relaxed">
                                  &ldquo;नाही, उद्या हलका पाऊस अपेक्षित आहे. कपाशीला सध्या पाणी देऊ नका.&rdquo;
                                </p>
                                {/* Soundwave bars */}
                                <div className="flex items-center justify-center gap-1 py-1 h-5">
                                  {[12, 18, 22, 14, 20, 16, 24, 12, 18, 10].map((h, i) => (
                                    <span
                                      key={i}
                                      className="w-1 bg-[#126B3A] rounded-full animate-pulse"
                                      style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* State 5: Offline State */}
                          {phoneTab === 'offline' && (
                            <motion.div
                              key="state-offline"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2.5 py-1"
                            >
                              <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-amber-200 text-left space-y-1.5">
                                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                                  <span>⚡ ऑफलाइन मोड सक्रिय (Offline Active)</span>
                                </div>
                                <p className="text-[10.5px] text-amber-900 leading-relaxed">
                                  मोबाइल नेटवर्क उपलब्ध नाही. कॅश केलेला डेटा उपलब्ध आहे.
                                </p>
                                <div className="p-2 rounded-xl bg-white border border-amber-200 text-[10px] text-[#66736B]">
                                  <span className="font-bold text-[#111814] block">अंतिम अद्यतन (Cached):</span>
                                  <span>आज सकाळी 08:30 वाजता • 4.2mm पाऊस अंदाज</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Bottom App Navigation */}
                      <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-5 gap-1 text-center text-[8px] text-[#64748B]">
                        {[
                          { id: 'weather', label: 'मौसम' },
                          { id: 'advisory', label: 'सलाह' },
                          { id: 'voice_question', label: 'प्रश्न' },
                          { id: 'voice_answer', label: 'ऑडियो' },
                          { id: 'offline', label: 'ऑफलाइन' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setPhoneTab(btn.id as any)}
                            className={`py-1 rounded-md transition-colors ${
                              phoneTab === btn.id
                                ? 'text-[#126B3A] font-bold bg-[#EAF5EC]'
                                : 'hover:text-[#111814]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="officer-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Left Column: Feature Highlights */}
                <div className="lg:col-span-6 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                    <span>🖥️ District & Block Console</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
                    Command Center for Agricultural Extension Officers
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    Manage hundreds of Panchayats with real-time discrepancy alerts. Review AI proposals, edit advice for local pest outbreaks, and broadcast verified notices in seconds.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-blue-100 text-blue-700 mt-0.5">
                        <Check size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Cluster-Wide Review Queue</p>
                        <p className="text-[11px] text-[#64748B]">Batch approve or fine-tune advisories across blocks with one click.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-blue-100 text-blue-700 mt-0.5">
                        <Check size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Automated Discrepancy Flagging</p>
                        <p className="text-[11px] text-[#64748B]">Highlighted alerts whenever local sensors deviate from regional forecast models.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-full bg-blue-100 text-blue-700 mt-0.5">
                        <Check size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Broadcast & Impact Telemetry</p>
                        <p className="text-[11px] text-[#64748B]">Monitor delivery rates across SMS, WhatsApp, voice call, and PWA notifications.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link to="/app/officer">
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight size={15} />}>
                        Open Officer Portal
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Desktop Dashboard Mockup */}
                <div className="lg:col-span-6">
                  <div className="rounded-3xl bg-[#0F172A] p-4 shadow-2xl border border-[#334155] text-left text-white space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-xs text-slate-400 font-mono ml-2">MausamSetu Officer Console</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        84 Panchayats Live
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-[#1E293B] border border-[#334155]">
                        <span className="text-[9px] uppercase text-slate-400 font-semibold">Pending Review</span>
                        <p className="text-lg font-black text-amber-400 mt-0.5">
                          {isOfficerApproved ? '2' : '3'} Advisories
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#1E293B] border border-[#334155]">
                        <span className="text-[9px] uppercase text-slate-400 font-semibold">Dispatched Today</span>
                        <p className="text-lg font-black text-emerald-400 mt-0.5">
                          {isOfficerApproved ? '82' : '81'} Verified
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#1E293B] border border-[#334155]">
                        <span className="text-[9px] uppercase text-slate-400 font-semibold">Farmers Reached</span>
                        <p className="text-lg font-black text-white mt-0.5">
                          {isOfficerApproved ? '15,700' : '14,280'}
                        </p>
                      </div>
                    </div>

                    {/* Officer Sub-tabs: Advisory Queue vs Discrepancy Alerts */}
                    <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] space-y-2">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-[#334155]/60">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOfficerTab('queue')}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                              officerTab === 'queue' ? 'bg-[#0F172A] text-emerald-400 border border-[#334155]' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Advisory Queue ({isOfficerApproved ? 2 : 3})
                          </button>
                          <button
                            onClick={() => setOfficerTab('alerts')}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                              officerTab === 'alerts' ? 'bg-[#0F172A] text-amber-400 border border-[#334155]' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Discrepancy Flags (1)
                          </button>
                        </div>
                        <span className="text-emerald-400 text-[10px] font-semibold">Live System</span>
                      </div>

                      {officerTab === 'queue' ? (
                        <div className="p-2 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-200 text-[11px]">Soybean • Valley Cluster</p>
                              {isOfficerApproved && (
                                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                                  ✓ Signed
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {isOfficerApproved
                                ? 'Signed by BAO-704 · Dispatched to 1,420 farmers'
                                : 'Recommendation: Hold irrigation 24h'}
                            </p>
                          </div>
                          {isOfficerApproved ? (
                            <button
                              onClick={() => setIsOfficerApproved(false)}
                              className="px-2 py-1 rounded-md bg-[#1E293B] text-slate-300 hover:text-white font-mono text-[9px] transition-colors"
                            >
                              Reset
                            </button>
                          ) : (
                            <button
                              onClick={() => setIsOfficerApproved(true)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-xs active:scale-95"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-[#0F172A] border border-amber-900/50 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              <p className="font-semibold text-amber-300 text-[11px]">Sensor Deviation Detected</p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Valley AWS recorded 12.4mm vs 3.8mm NWP model. Auto-calibrated.
                            </p>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                            Auto-Calibrated
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
