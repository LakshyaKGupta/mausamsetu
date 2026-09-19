import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Monitor, Mic, Volume2, CloudRain, ShieldCheck, Check, Globe2, Radio, Send } from 'lucide-react'
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
      className="relative min-h-screen flex flex-col justify-center bg-[#F7FAF7] border-b border-[#E2E8E4] py-16 lg:py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-semibold uppercase tracking-wider mb-3">
            <Smartphone size={14} />
            <span>04 • Farmer & Officer Experience</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#17201A] tracking-tight leading-tight">
            Built for the field. <br />
            <span className="text-[#166534]">Proven on desktop & mobile.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#647067] mt-4 leading-relaxed font-normal">
            Farmers access hyper-local weather, voice-assisted advisories, and offline SMS in their native language. Agricultural officers manage hundreds of Panchayats from an executive control console.
          </p>
        </div>

        {/* Split Screen Experience Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Mobile Phone Mockup (Farmer Experience) */}
          <div className="lg:col-span-5 flex justify-center">
            {/* Phone Frame */}
            <div className="w-full max-w-[340px] bg-[#17201A] rounded-[42px] p-3 shadow-2xl border-4 border-[#17201A] relative">
              {/* Floating Low-Connectivity Indicator */}
              <div className="absolute -top-3.5 -left-3.5 bg-white border border-[#E2E8E4] px-3 py-1 rounded-full text-[11px] font-semibold text-[#166534] shadow-sm flex items-center gap-1.5 animate-float-subtle">
                <Radio size={12} className="text-[#166534]" />
                <span>Works on 2G / SMS</span>
              </div>

              {/* Speaker Notch */}
              <div className="w-24 h-4 bg-[#17201A] rounded-full mx-auto mb-2 relative z-30 flex items-center justify-center">
                <div className="w-8 h-1 bg-[#374151] rounded-full" />
              </div>

              {/* Inner Screen */}
              <div className="bg-[#F7FAF7] rounded-[34px] overflow-hidden p-4 space-y-3.5 text-left border border-[#E2E8E4]">
                {/* Language Switcher */}
                <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-2">
                  <span className="text-xs font-bold text-[#17201A]">MausamSetu</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E2E8E4]">
                    {(['hi', 'mr', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          activeLang === lang ? 'bg-[#166534] text-white' : 'text-[#647067]'
                        }`}
                      >
                        {lang === 'hi' ? 'हिन्दी' : lang === 'mr' ? 'मराठी' : 'EN'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather Card */}
                <div className="bg-white rounded-2xl border border-[#E2E8E4] p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[#647067]">
                    <span>Dhapewada, Kalmeshwar</span>
                    <span className="text-[#166534] font-semibold text-[10px]">✓ {c.badge}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <div className="text-3xl font-black text-[#17201A]">{c.temp}</div>
                      <p className="text-xs text-[#166534] font-semibold mt-0.5">{c.rainChance}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <CloudRain size={26} />
                    </div>
                  </div>
                </div>

                {/* Advisory Card */}
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3.5 space-y-1">
                  <p className="text-xs font-bold text-[#14532D]">🌱 {c.advisoryTitle}</p>
                  <p className="text-xs text-[#166534] leading-relaxed">{c.advisoryText}</p>
                </div>

                {/* Voice Assistant Interaction */}
                <div className="bg-white rounded-2xl border border-[#E2E8E4] p-3.5 space-y-2">
                  <button
                    onClick={() => setVoiceQueryActive(!voiceQueryActive)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#166534] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-[#14532D]"
                  >
                    <Mic size={16} className="animate-pulse" />
                    <span>{c.voicePrompt}</span>
                  </button>

                  {/* Simulated Response */}
                  <motion.div
                    initial={false}
                    animate={{ opacity: 1 }}
                    className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8E4] text-[11px] text-[#17201A] flex items-start gap-2"
                  >
                    <Volume2 size={14} className="text-[#166534] shrink-0 mt-0.5" />
                    <p className="italic leading-snug">{c.voiceResponse}</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Officer Dashboard Console Preview */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 shadow-sm text-left">
            <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-[#166534]" />
                  <h3 className="text-lg font-bold text-[#17201A]">
                    Officer Multi-Panchayat Management
                  </h3>
                </div>
                <p className="text-xs text-[#647067] mt-0.5">
                  Real-time approval stream for 84 Panchayats in Kalmeshwar Block
                </p>
              </div>

              <Link to="/app/officer">
                <Button variant="outline" size="sm">
                  Open Officer Console
                </Button>
              </Link>
            </div>

            {/* Micro Dashboard Table */}
            <div className="space-y-3 mb-6">
              {[
                { panchayat: 'Dhapewada', rain: '4.2 mm', conf: 'HIGH (±0.11)', status: 'APPROVED', action: 'Broadcasted' },
                { panchayat: 'Kalamna', rain: '6.8 mm', conf: 'HIGH (±0.14)', status: 'PENDING', action: 'Needs Review' },
                { panchayat: 'Mohpa', rain: '1.5 mm', conf: 'HIGH (±0.09)', status: 'APPROVED', action: 'Broadcasted' },
                { panchayat: 'Savner Rural', rain: '11.4 mm', conf: 'MODERATE', status: 'IN_REVIEW', action: 'Hold Advisory' },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[#E2E8E4] bg-[#F7FAF7] flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#166534]" />
                    <span className="font-bold text-[#17201A]">{row.panchayat}</span>
                  </div>
                  <div className="text-[#647067]">
                    Refined Rain: <strong className="text-[#17201A]">{row.rain}</strong>
                  </div>
                  <span className="font-mono text-[11px] text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    {row.conf}
                  </span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    row.status === 'APPROVED' ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}>
                    {row.action}
                  </span>
                </div>
              ))}
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-[#E2E8E4] bg-white text-center">
                <p className="text-xl font-bold text-[#166534]">1-Click</p>
                <p className="text-xs text-[#647067] mt-1 font-medium">Batch Sanctioning</p>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E2E8E4] bg-white text-center">
                <p className="text-xl font-bold text-[#166534]">100%</p>
                <p className="text-xs text-[#647067] mt-1 font-medium">Human Verified</p>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E2E8E4] bg-white text-center">
                <p className="text-xl font-bold text-[#166534]">SMS & PWA</p>
                <p className="text-xs text-[#647067] mt-1 font-medium">Dual Dispatch</p>
              </div>
            </div>

            {/* Enter portals CTA */}
            <div className="mt-6 pt-4 border-t border-[#E2E8E4] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#647067]">Ready to test the live applications?</span>
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
