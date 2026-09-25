import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { LocationBar } from '@/components/farmer/LocationBar'
import { TodayWeatherCard } from '@/components/farmer/TodayWeatherCard'
import { TomorrowForecastCard } from '@/components/farmer/TomorrowForecastCard'
import { CropAdvisoryCard } from '@/components/farmer/CropAdvisoryCard'
import { VoiceAssistantCard } from '@/components/farmer/VoiceAssistantCard'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { PWAInstallBanner } from '@/components/shared/PWAInstallBanner'
import { weatherApi, advisoryApi, chatbotApi } from '@/api/client'
import type { Language, WeatherSummary, Advisory, ChatbotMessage } from '@/types'

export interface AppOutletContext {
  lang: Language
  setLang: (lang: Language) => void
  panchayatName?: string
  districtName?: string
  userName?: string
}

const DEFAULT_PANCHAYAT_ID = 1

export default function FarmerHome() {
  const outlet = useOutletContext<AppOutletContext | undefined>()
  const [internalLang, setInternalLang] = useState<Language>(() => {
    return (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  })

  // Synchronize with outlet or custom event
  useEffect(() => {
    const handleLangEvent = (e: any) => {
      if (e.detail) setInternalLang(e.detail)
    }
    window.addEventListener('mausamsetu_lang_change', handleLangEvent)
    return () => window.removeEventListener('mausamsetu_lang_change', handleLangEvent)
  }, [])

  const lang = outlet?.lang || internalLang
  const setLang = outlet?.setLang || setInternalLang
  const [weather, setWeather] = useState<WeatherSummary | null>(null)
  const [advisories, setAdvisories] = useState<Advisory[]>([])
  const [loading, setLoading] = useState(true)

  // Voice / Chatbot state
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const [sessionId, setSessionId] = useState<number | undefined>()
  const [listening, setListening] = useState(false)

  useEffect(() => {
    Promise.all([
      weatherApi.getToday(DEFAULT_PANCHAYAT_ID),
      advisoryApi.getApprovedForPanchayat(DEFAULT_PANCHAYAT_ID),
    ]).then(([w, a]) => {
      setWeather(w)
      setAdvisories(a)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Web Speech Synthesis (Read aloud)
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  }

  // Web Speech Recognition (Voice Input)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(lang === 'hi' ? 'आपके ब्राउज़र में वॉइस सपोर्ट उपलब्ध नहीं है।' : 'Voice recognition is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        handleSendMessage(transcript)
      }
    }
    recognition.start()
  }

  const stopListening = () => {
    setListening(false)
  }

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatbotMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await chatbotApi.message({
        message: text,
        language: lang,
        panchayat_id: DEFAULT_PANCHAYAT_ID,
        session_id: sessionId,
      })
      setSessionId(res.session_id)

      const botMsg: ChatbotMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMsg])
      speak(res.reply)
    } catch (err) {
      console.error('Chatbot error:', err)
    }
  }

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 flex flex-col font-sans pb-20 md:pb-6">
      <FarmerNav lang={lang} />

      {/* Responsive Application Shell */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        
        {/* PWA App Install Banner Card */}
        <div className="mb-5">
          <PWAInstallBanner lang={lang} variant="card" />
        </div>

        {/* Responsive Grid: Single-column on mobile, Two-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Left Column: Location + Weather Today + Tomorrow */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* WHERE AM I? (Location + Date) */}
            <LocationBar
              panchayatName={weather?.panchayat_name || 'धापेवाड़ा'}
              blockName="कलमेश्वर"
              districtName="नागपुर"
              dateStr={weather?.date}
              lang={lang}
            />

            {/* WHAT IS TODAY'S WEATHER? (Today's Weather Card) */}
            <TodayWeatherCard
              weather={weather}
              lang={lang}
              loading={loading}
            />

            {/* WHAT HAPPENS TOMORROW? (Tomorrow's Forecast Card) */}
            <TomorrowForecastCard
              weather={weather}
              lang={lang}
            />

          </div>

          {/* Right Column: Crop Actions + Voice Assistant */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* WHAT SHOULD I DO? (Crop Action Advisories) */}
            <CropAdvisoryCard
              advisories={advisories}
              lang={lang}
              onSpeak={speak}
            />

            {/* ASK BY VOICE (Voice Assistant) */}
            <VoiceAssistantCard
              lang={lang}
              onSendMessage={handleSendMessage}
              messages={messages}
              onSpeak={speak}
              listening={listening}
              startListening={startListening}
              stopListening={stopListening}
            />

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-medium">
          MausamSetu · भारत मौसम विज्ञान विभाग (IMD) एवं कृषि मंत्रालय के सहयोग से पंचायत स्तरीय सेवा
        </div>
      </footer>

    </div>
  )
}
