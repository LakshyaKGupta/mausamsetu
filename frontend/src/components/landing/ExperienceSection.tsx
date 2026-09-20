import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Monitor, Mic, Volume2, CloudRain, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../shared/Button'

export const ExperienceSection: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'hi' | 'mr' | 'en'>('hi')
  const [voiceQueryActive, setVoiceQueryActive] = useState(false)

  const content = {
    hi: {
      title: 'आज का मौसम',
      temp: '28°C',
      rainChance: 'हल्की बारिश (4.2 mm)',
      advisoryTitle: 'सोयाबीन फसल सलाह',
      advisoryText: 'आज सिंचाई टालना उचित है। शाम के समय हल्की वर्षा हो सकती है।',
      voicePrompt: '🎙 बोलकर पूछें: "कल बारिश होगी?"',
      voiceResponse: '"कल दोपहर 2 बजे हल्की बूंदाबांदी का अनुमान है। कीटनाशक छिड़काव स्थगित रखें।"',
      badge: 'अधिकारी द्वारा सत्यापित',
    },
    mr: {
      title: 'आजचे हवामान',
      temp: '28°C',
      rainChance: 'हलका पाऊस (4.2 mm)',
      advisoryTitle: 'सोयाबीन पीक सल्ला',
      advisoryText: 'आज पाणी देणे टाळावे. संध्याकाळी हलक्या पावसाची शक्यता आहे.',
      voicePrompt: '🎙 विचारण्यासाठी बोला: "उद्या पाऊस पडेल का?"',
      voiceResponse: '"उद्या दुपारी हलक्या पावसाचा अंदाज आहे. फवारणी पुढे ढकला."',
      badge: 'कृषी अधिकाऱ्यांनी प्रमाणित',
    },
    en: {
      title: "Today's Weather",
      temp: '28°C',
      rainChance: 'Light Showers (4.2 mm)',
      advisoryTitle: 'Soybean Crop Advisory',
      advisoryText: 'Delay irrigation for 24 hours. Light evening rain anticipated.',
      voicePrompt: '🎙 Ask by Voice: "Will it rain tomorrow?"',
      voiceResponse: '"Light rain expected tomorrow afternoon. Postpone chemical spray."',
      badge: 'Officer Verified',
    },
  }

  const c = content[activeLang]

  return (
    <section
      id="experience"
      className="snap-section relative w-full bg-[#F7FAF7] border-b border-[#E2E8E4] flex flex-col justify-center overflow-hidden"
    >
      {/* Floating Telemetry Icon 1: 2G SMS Failover */}
      <div className="hidden xl:flex absolute top-6 right-24 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#BBF7D0] shadow-xs text-xs font-semibold text-[#14532D] animate-float-slow backdrop-blur-sm">
        <Radio size={13} className="text-[#166534]" />
        <span>SMS & IVR Failover: Active on 2G Networks</span>
      </div>

      {/* Floating Telemetry Icon 2: Voice Waveform */}
      <div className="hidden xl:flex absolute bottom-8 right-16 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#E2E8E4] shadow-xs text-xs font-semibold text-[#17201A] animate-float-drift backdrop-blur-sm">
        <Volume2 size={13} className="text-[#166534]" />
        <span>Speech-to-Speech: Hindi • Marathi • English</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-4 sm:mb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-semibold uppercase tracking-wider mb-2">
            <Smartphone size={13} />
            <span>04 • Farmer & Officer Experience</span>
          </div>
          <h2 className="text-2xl sm:text-4xl xl:text-5xl font-black text-[#17201A] tracking-tight leading-tight">
            Built for the field. <br />
            <span className="text-[#166534]">Proven on desktop & mobile.</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#647067] mt-1.5 leading-relaxed font-normal">
            Farmers access hyper-local weather, voice-assisted advisories, and offline SMS in their native language. Agricultural officers manage hundreds of Panchayats from an executive control console.
          </p>
        </div>

        {/* Split Screen Experience Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* Left: Mobile Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            {/* Phone Frame */}
            <div className="w-full max-w-[310px] bg-[#17201A] rounded-[36px] p-2.5 shadow-xl border-4 border-[#17201A] relative">
              {/* Speaker Notch */}
              <div className="w-20 h-3.5 bg-[#17201A] rounded-full mx-auto mb-1.5 relative z-30 flex items-center justify-center">
                <div className="w-6 h-1 bg-[#374151] rounded-full" />
              </div>

              {/* Inner Screen */}
              <div className="bg-[#F7FAF7] rounded-[28px] overflow-hidden p-3.5 space-y-2.5 text-left border border-[#E2E8E4]">
                {/* Language Switcher */}
                <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-1.5">
                  <span className="text-xs font-bold text-[#17201A]">MausamSetu</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E2E8E4]">
                    {(['hi', 'mr', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          activeLang === lang ? 'bg-[#166534] text-white' : 'text-[#647067]'
                        }`}
                      >
                        {lang === 'hi' ? 'हिन्दी' : lang === 'mr' ? 'मराठी' : 'EN'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather Card */}
                <div className="bg-white rounded-xl border border-[#E2E8E4] p-3 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#647067]">
                    <span>Dhapewada, Kalmeshwar</span>
                    <span className="text-[#166534] font-semibold text-[9px]">✓ {c.badge}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <div className="text-2xl font-black text-[#17201A]">{c.temp}</div>
                      <p className="text-[11px] text-[#166534] font-semibold">{c.rainChance}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <CloudRain size={22} />
                    </div>
                  </div>
                </div>

                {/* Advisory Card */}
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-2.5 space-y-0.5">
                  <p className="text-[11px] font-bold text-[#14532D]">🌱 {c.advisoryTitle}</p>
                  <p className="text-[11px] text-[#166534] leading-snug">{c.advisoryText}</p>
                </div>

                {/* Voice Assistant Interaction */}
                <div className="bg-white rounded-xl border border-[#E2E8E4] p-2.5 space-y-1.5">
                  <button
                    onClick={() => setVoiceQueryActive(!voiceQueryActive)}
                    className="w-full py-2 px-2.5 rounded-lg bg-[#166534] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all hover:bg-[#14532D]"
                  >
                    <Mic size={13} className="animate-pulse" />
                    <span>{c.voicePrompt}</span>
                  </button>

                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8E4] text-[10px] text-[#17201A] flex items-start gap-1.5">
                    <Volume2 size={12} className="text-[#166534] shrink-0 mt-0.5" />
                    <p className="italic leading-tight">{c.voiceResponse}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Officer Dashboard Console Preview */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8E4] p-5 sm:p-6 shadow-xs text-left">
            <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <Monitor size={15} className="text-[#166534]" />
                  <h3 className="text-base font-bold text-[#17201A]">
                    Officer Multi-Panchayat Management
                  </h3>
                </div>
                <p className="text-[11px] text-[#647067] mt-0.5">
                  Real-time approval stream for 84 Panchayats in Kalmeshwar Block
                </p>
              </div>

              <Link to="/app/officer">
                <Button variant="outline" size="sm">
                  Open Console
                </Button>
              </Link>
            </div>

            {/* Micro Dashboard Table */}
            <div className="space-y-2 mb-4">
              {[
                { panchayat: 'Dhapewada', rain: '4.2 mm', conf: 'HIGH (±0.11)', status: 'APPROVED', action: 'Broadcasted' },
                { panchayat: 'Kalamna', rain: '6.8 mm', conf: 'HIGH (±0.14)', status: 'PENDING', action: 'Needs Review' },
                { panchayat: 'Mohpa', rain: '1.5 mm', conf: 'HIGH (±0.09)', status: 'APPROVED', action: 'Broadcasted' },
                { panchayat: 'Savner Rural', rain: '11.4 mm', conf: 'MODERATE', status: 'IN_REVIEW', action: 'Hold Advisory' },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-[#E2E8E4] bg-[#F7FAF7] flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#166534]" />
                    <span className="font-bold text-[#17201A]">{row.panchayat}</span>
                  </div>
                  <div className="text-[#647067]">
                    Rain: <strong className="text-[#17201A]">{row.rain}</strong>
                  </div>
                  <span className="font-mono text-[10px] text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    {row.conf}
                  </span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                    row.status === 'APPROVED' ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}>
                    {row.action}
                  </span>
                </div>
              ))}
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl border border-[#E2E8E4] bg-white text-center">
                <p className="text-lg font-bold text-[#166534]">1-Click</p>
                <p className="text-[10px] text-[#647067] font-medium">Batch Sanctioning</p>
              </div>
              <div className="p-2.5 rounded-xl border border-[#E2E8E4] bg-white text-center">
                <p className="text-lg font-bold text-[#166534]">100%</p>
                <p className="text-[10px] text-[#647067] font-medium">Human Verified</p>
              </div>
              <div className="p-2.5 rounded-xl border border-[#E2E8E4] bg-white text-center">
                <p className="text-lg font-bold text-[#166534]">SMS & PWA</p>
                <p className="text-[10px] text-[#647067] font-medium">Dual Dispatch</p>
              </div>
            </div>

            {/* Enter portals CTA */}
            <div className="mt-4 pt-3 border-t border-[#E2E8E4] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-[#647067]">Ready to test the live applications?</span>
              <div className="flex items-center gap-2">
                <Link to="/app/farmer">
                  <Button variant="outline" size="sm">
                    Farmer PWA
                  </Button>
                </Link>
                <Link to="/app/officer">
                  <Button variant="primary" size="sm">
                    Officer Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
