import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Volume2, Leaf, Cloud,
  Thermometer, Droplets, Wind, MessageCircle, X
} from 'lucide-react'
import { chatbotApi, weatherApi, advisoryApi } from '@/api/client'
import type { Language, WeatherSummary, Advisory, ChatbotMessage } from '@/types'
import { cn, cropEmoji, weatherEmoji, formatDate } from '@/lib/utils'

const DEFAULT_PANCHAYAT_ID = 1

const LANG_LABELS: Record<Language, string> = {
  hi: 'हिंदी', mr: 'मराठी', en: 'English',
}

const HERO_TEXT: Record<Language, { greeting: string; subtitle: string; placeholder: string }> = {
  hi: {
    greeting: 'नमस्ते किसान भाई 🙏',
    subtitle: 'आज का मौसम और फसल सलाह',
    placeholder: 'मौसम या फसल के बारे में पूछें...',
  },
  mr: {
    greeting: 'नमस्ते शेतकरी बंधू 🙏',
    subtitle: 'आजचे हवामान आणि पीक सल्ला',
    placeholder: 'हवामान किंवा पिकाबद्दल विचारा...',
  },
  en: {
    greeting: 'Hello Farmer 🙏',
    subtitle: "Today's Weather & Crop Advisory",
    placeholder: 'Ask about weather or crops...',
  },
}

export default function FarmerHome() {
  const [lang, setLang] = useState<Language>('hi')
  const [weather, setWeather] = useState<WeatherSummary | null>(null)
  const [advisories, setAdvisories] = useState<Advisory[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<number | undefined>()
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ---------------------------------------------------------------------------
  // Voice input (Web Speech API)
  // ---------------------------------------------------------------------------
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }
    recognition.start()
  }

  // ---------------------------------------------------------------------------
  // TTS (Web Speech Synthesis)
  // ---------------------------------------------------------------------------
  const speak = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg) return

    const userMsg: ChatbotMessage = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const res = await chatbotApi.message({
      message: msg,
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
  }

  const text = HERO_TEXT[lang]
  const weatherBg =
    weather?.condition === 'rainy' ? 'weather-rainy'
    : weather?.condition === 'cloudy' ? 'weather-cloudy'
    : weather?.condition === 'partly_cloudy' ? 'weather-partly-cloudy'
    : 'weather-sunny'

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto">

      {/* Hero Weather Card */}
      <div className={cn('text-white px-6 pt-12 pb-8', weatherBg)}>
        {/* Language selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-1">
            {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-semibold transition-all',
                  lang === l ? 'bg-white text-slate-800' : 'text-white/80 hover:text-white'
                )}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <div className="text-4xl">{weather ? weatherEmoji(weather.condition) : '🌤️'}</div>
        </div>

        {/* Greeting */}
        <div className={cn('mb-6', lang !== 'en' && 'devanagari')}>
          <h1 className="text-2xl font-display font-bold mb-1">{text.greeting}</h1>
          <p className="text-white/80 text-sm">{text.subtitle}</p>
        </div>

        {/* Weather data */}
        {loading ? (
          <div className="h-20 animate-pulse bg-white/20 rounded-2xl" />
        ) : weather ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Thermometer size={18} className="mx-auto mb-1 text-white/70" />
                <p className="text-2xl font-bold">{weather.temperature_max}°</p>
                <p className="text-xs text-white/70">Max Temp</p>
              </div>
              <div className="text-center">
                <Droplets size={18} className="mx-auto mb-1 text-white/70" />
                <p className="text-2xl font-bold">{weather.rainfall_mm}</p>
                <p className="text-xs text-white/70">mm Rain</p>
              </div>
              <div className="text-center">
                <Cloud size={18} className="mx-auto mb-1 text-white/70" />
                <p className="text-2xl font-bold">{weather.humidity_pct}%</p>
                <p className="text-xs text-white/70">Humidity</p>
              </div>
            </div>
            <p className="text-center text-xs text-white/60 mt-3">
              {weather.panchayat_name} · {weather.date}
            </p>
          </div>
        ) : null}
      </div>

      {/* Advisories */}
      <div className="px-5 py-6">
        <h2 className={cn(
          'text-base font-display font-bold text-slate-800 mb-4',
          lang !== 'en' && 'devanagari'
        )}>
          {lang === 'hi' ? '📋 आज की फसल सलाह' : lang === 'mr' ? '📋 आजचा पीक सल्ला' : '📋 Today\'s Crop Advisory'}
        </h2>

        {advisories.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🌱</div>
            <p className={cn('text-slate-400 text-sm', lang !== 'en' && 'devanagari')}>
              {lang === 'hi' ? 'आज कोई सलाह उपलब्ध नहीं है'
                : lang === 'mr' ? 'आज कोणताही सल्ला उपलब्ध नाही'
                : 'No advisory available today'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {advisories.map((advisory, i) => (
              <motion.div
                key={advisory.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {cropEmoji(advisory.crop)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-800 capitalize">{advisory.crop}</span>
                      <span className="badge-green text-xs">✓ Approved</span>
                    </div>
                    <p className={cn(
                      'text-sm text-slate-600 leading-relaxed',
                      lang !== 'en' && 'devanagari'
                    )}>
                      {lang === 'hi' ? advisory.content_hi
                        : lang === 'mr' ? (advisory.content_mr || advisory.content_hi)
                        : advisory.content_en}
                    </p>
                    <button
                      onClick={() => speak(
                        lang === 'hi' ? advisory.content_hi
                          : lang === 'mr' ? (advisory.content_mr || advisory.content_hi)
                          : advisory.content_en
                      )}
                      className="flex items-center gap-1.5 mt-3 text-xs text-brand-600 font-medium"
                    >
                      <Volume2 size={13} />
                      {lang === 'hi' ? 'सुनें' : lang === 'mr' ? 'ऐका' : 'Listen'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chatbot FAB */}
      <button
        onClick={() => setChatOpen(true)}
        className={cn(
          'fixed bottom-6 right-5 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40',
          'flex items-center justify-center transition-all hover:bg-brand-700 hover:scale-105 active:scale-95'
        )}
      >
        <MessageCircle size={24} />
      </button>

      {/* Chatbot Panel */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 z-40"
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl z-50 h-[75vh] flex flex-col"
            >
              {/* Chat header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold text-slate-800', lang !== 'en' && 'devanagari')}>
                      {lang === 'hi' ? 'AI सहायक' : lang === 'mr' ? 'AI सहायक' : 'AI Assistant'}
                    </p>
                    <p className="text-xs text-brand-500 font-medium">● Online</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)}>
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-3">👋</div>
                    <p className={cn('text-slate-400 text-sm', lang !== 'en' && 'devanagari')}>
                      {lang === 'hi' ? 'मुझसे मौसम या फसल के बारे में पूछें'
                        : lang === 'mr' ? 'मला हवामान किंवा पिकाबद्दल विचारा'
                        : 'Ask me about weather or crops'}
                    </p>
                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {(lang === 'hi'
                        ? ['आज का मौसम?', 'गेहूं की सलाह', 'बारिश कब होगी?']
                        : lang === 'mr'
                        ? ['आजचे हवामान?', 'गव्हाचा सल्ला', 'पाऊस कधी होईल?']
                        : ["Today's weather?", "Wheat advisory", "Will it rain?"]
                      ).map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendMessage(chip)}
                          className={cn(
                            'px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-xl border border-brand-100',
                            'hover:bg-brand-100 transition-colors',
                            lang !== 'en' && 'devanagari'
                          )}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-700 rounded-bl-sm',
                      lang !== 'en' && 'devanagari'
                    )}>
                      {msg.content}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speak(msg.content)}
                          className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-slate-600"
                        >
                          <Volume2 size={11} />
                          {lang === 'hi' ? 'सुनें' : lang === 'mr' ? 'ऐका' : 'Listen'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
                  <input
                    className={cn(
                      'flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none',
                      lang !== 'en' && 'devanagari'
                    )}
                    placeholder={text.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={startListening}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                      listening ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-brand-600'
                    )}
                  >
                    {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
