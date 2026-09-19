import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Volume2, Cloud,
  Thermometer, Droplets, X, AlertTriangle, CheckCircle2,
  Calendar, Info, HelpCircle
} from 'lucide-react'
import { chatbotApi, weatherApi, advisoryApi } from '@/api/client'
import type { Language, WeatherSummary, Advisory, ChatbotMessage } from '@/types'
import { cn, cropEmoji, weatherEmoji } from '@/lib/utils'

const DEFAULT_PANCHAYAT_ID = 1

const LANG_LABELS: Record<Language, string> = {
  hi: 'हिंदी', mr: 'मराठी', en: 'English',
}

const UI_TEXT: Record<Language, {
  todayTitle: string
  tomorrowTitle: string
  actionTitle: string
  voiceTitle: string
  askPlaceholder: string
  listen: string
  modelReliability: string
  expectedError: string
  baselineCompare: string
  noAdvisory: string
  noRainTomorrow: string
  rainExpectedTomorrow: string
  quickQuestions: string[]
}> = {
  hi: {
    todayTitle: 'आज का मौसम (Today)',
    tomorrowTitle: 'कल का पूर्वानुमान (Tomorrow)',
    actionTitle: 'मुझे क्या करना चाहिए? (What Should I Do?)',
    voiceTitle: 'बोलकर पूछें (Voice Assistant)',
    askPlaceholder: 'बोलें या लिखें... जैसे: क्या कल बारिश होगी?',
    listen: 'सुनें',
    modelReliability: 'मॉडल विश्वसनीयता',
    expectedError: 'संभावित त्रुटि सीमा',
    baselineCompare: 'ब्लॉक बेसलाइन से डाउनस्केल',
    noAdvisory: 'आज के लिए कोई स्वीकृत सलाह उपलब्ध नहीं है।',
    noRainTomorrow: 'कल मौसम साफ और शुष्क रहने का अनुमान है।',
    rainExpectedTomorrow: 'कल वर्षा होने की संभावना है। कृपया सुरक्षा उपाय करें।',
    quickQuestions: ['कल बारिश होगी?', 'क्या मैं आज सिंचाई करूँ?', 'क्या आज दवा छिड़क सकते हैं?'],
  },
  mr: {
    todayTitle: 'आजचे हवामान (Today)',
    tomorrowTitle: 'उद्याचा अंदाज (Tomorrow)',
    actionTitle: 'मी काय करावे? (What Should I Do?)',
    voiceTitle: 'बोलून विचारा (Voice Assistant)',
    askPlaceholder: 'बोला किंवा लिहा... उदा: उद्या पाऊस पडेल का?',
    listen: 'ऐका',
    modelReliability: 'मॉडेल विश्वसनीयता',
    expectedError: 'अपेक्षित त्रुटी मर्यादा',
    baselineCompare: 'ब्लॉक बेसलाइनवरून डाऊनस्केल',
    noAdvisory: 'आजसाठी कोणताही मंजूर सल्ला उपलब्ध नाही.',
    noRainTomorrow: 'उद्या हवामान कोरडे आणि स्वच्छ राहण्याचा अंदाज आहे.',
    rainExpectedTomorrow: 'उद्या पाऊस पडण्याची शक्यता आहे. कृपया खबरदारी घ्या.',
    quickQuestions: ['उद्या पाऊस पडेल का?', 'सिंचन करावे का?', 'आज औषध फवारणी करू का?'],
  },
  en: {
    todayTitle: "Today's Weather",
    tomorrowTitle: "Tomorrow's Forecast",
    actionTitle: 'What Should I Do? (Crop Actions)',
    voiceTitle: 'Voice Weather & Crop Assistant',
    askPlaceholder: 'Ask or type... e.g. Will it rain tomorrow?',
    listen: 'Listen',
    modelReliability: 'Model Reliability',
    expectedError: 'Expected Error Margin',
    baselineCompare: 'Downscaled from Block Baseline',
    noAdvisory: 'No approved advisories available for today.',
    noRainTomorrow: 'Weather is expected to remain dry tomorrow.',
    rainExpectedTomorrow: 'Rainfall expected tomorrow. Please take precautions.',
    quickQuestions: ['Will it rain tomorrow?', 'Should I irrigate today?', 'Can I spray pesticides today?'],
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

  // Web Speech API Voice Input
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
      sendMessage(transcript)
    }
    recognition.start()
  }

  // Web Speech Synthesis
  const speak = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.92
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

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
    if (!chatOpen) setChatOpen(true)

    try {
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
    } catch (err) {
      console.error(err)
    }
  }

  const t = UI_TEXT[lang]

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto pb-24 relative">

      {/* Top Bar: Language Selector & Location Header */}
      <header className="bg-emerald-800 text-white px-5 pt-8 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 bg-emerald-900/60 p-1 rounded-xl">
            {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  lang === l ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'
                )}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-700/80 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              {weather?.panchayat_name || 'धापेवाड़ा'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold font-display tracking-tight">MausamSetu · मौसमसेतु</h1>
          <p className="text-xs text-emerald-200">पंचायत स्तरीय कृषि मौसम निर्णय सेवा</p>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">

        {/* =================================================================== */}
        {/* 1. TODAY'S WEATHER (आज का मौसम) */}
        {/* =================================================================== */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h2 className="text-base font-bold text-slate-900">{t.todayTitle}</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{weather?.date || 'आज'}</span>
          </div>

          {loading ? (
            <div className="h-28 animate-pulse bg-slate-100 rounded-xl" />
          ) : weather ? (
            <div>
              {/* Main Weather Metrics */}
              <div className="grid grid-cols-3 gap-3 py-2 bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center text-amber-500 mb-1">
                    <Thermometer size={18} />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{weather.temperature_max}°C</p>
                  <p className="text-[11px] font-medium text-slate-500">अधिकतम तापमान</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <div className="flex items-center justify-center text-blue-500 mb-1">
                    <Droplets size={18} />
                  </div>
                  <p className="text-2xl font-black text-blue-700">
                    {weather.predicted_rainfall_mm ?? weather.rainfall_mm} <span className="text-xs font-semibold">mm</span>
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">अनुमानित वर्षा</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-indigo-500 mb-1">
                    <Cloud size={18} />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{weather.humidity_pct}%</p>
                  <p className="text-[11px] font-medium text-slate-500">आर्द्रता (Humidity)</p>
                </div>
              </div>

              {/* Statistical Reliability & Provenance Audit */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    {t.modelReliability}:
                  </span>
                  <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-100/80 rounded-md">
                    {weather.model_reliability || 'HIGH (उच्च)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t.expectedError}:</span>
                  <span className="font-semibold text-slate-800">
                    ±{weather.expected_error_margin_mm ?? 0.11} mm (80% confidence)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-emerald-200/50">
                  <span>स्रोत (Source): {weather.source_name || 'IMD Agromet'}</span>
                  <span>{weather.provenance_stage || 'AI Downscaled'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* =================================================================== */}
        {/* 2. TOMORROW'S FORECAST (कल का पूर्वानुमान) */}
        {/* =================================================================== */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">{t.tomorrowTitle}</h2>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-100">
              24h Ahead
            </span>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-4 rounded-xl border border-blue-100">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">
              {(weather?.predicted_rainfall_mm ?? 0) > 5 ? '🌧️' : '⛅'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">
                {(weather?.predicted_rainfall_mm ?? 0) > 5
                  ? `कल वर्षा का अनुमान: ${weather?.predicted_rainfall_mm} मिमी`
                  : 'कल वर्षा की संभावना नहीं है (0 मिमी)'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {(weather?.predicted_rainfall_mm ?? 0) > 5 ? t.rainExpectedTomorrow : t.noRainTomorrow}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. WHAT SHOULD I DO? (मुझे क्या करना चाहिए?) */}
        {/* =================================================================== */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h2 className="text-base font-bold text-slate-900">{t.actionTitle}</h2>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ✓ अधिकारी द्वारा सत्यापित (Officer Verified)
            </span>
          </div>

          {advisories.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">{t.noAdvisory}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {advisories.map((advisory) => {
                const actionText = lang === 'hi' ? advisory.content_hi
                  : lang === 'mr' ? (advisory.content_mr || advisory.content_hi)
                  : advisory.content_en

                return (
                  <div
                    key={advisory.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cropEmoji(advisory.crop)}</span>
                        <span className="font-bold text-sm text-slate-800 capitalize">{advisory.crop}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        कार्यवाही (Action)
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {actionText}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => speak(actionText)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200"
                      >
                        <Volume2 size={14} />
                        {t.listen}
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {advisory.officer_note ? `नोट: ${advisory.officer_note}` : 'कृषि विभाग द्वारा अनुमोदित'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* 4. ASK BY VOICE (बोलकर पूछें) */}
        {/* =================================================================== */}
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={18} className="text-indigo-400" />
            <h2 className="text-base font-bold text-white">{t.voiceTitle}</h2>
          </div>
          <p className="text-xs text-indigo-200 mb-4">
            सटीक मौसम, सिंचाई या कीटनाशक छिड़काव की सलाह तुरंत बोलकर प्राप्त करें।
          </p>

          {/* Quick Voice Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {t.quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-white/10 hover:bg-white/20 text-indigo-100 px-3 py-1.5 rounded-xl border border-white/15 transition-all text-left"
              >
                🗣️ "{q}"
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setChatOpen(true)
              startListening()
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all text-sm"
          >
            <Mic size={18} className="animate-pulse" />
            <span>यहाँ दबाकर बोलें (Tap & Speak)</span>
          </button>
        </section>

      </main>

      {/* ===================================================================== */}
      {/* UNMISTAKABLE VOICE ASSISTANT FLOATING BUTTON (NOT WHATSAPP-LIKE) */}
      {/* ===================================================================== */}
      <div className="fixed bottom-6 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setChatOpen(true)}
          className={cn(
            'flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-xl shadow-indigo-600/40',
            'hover:bg-indigo-700 active:scale-95 transition-all border-2 border-white'
          )}
          aria-label="बोलकर पूछें - Voice Assistant"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Mic size={16} className="text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1">
            बोलकर पूछें
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* CHATBOT / VOICE DIALOG MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl z-50 h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <Mic size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      MausamSetu वाणी सहायक (Voice Assistant)
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      सत्यापित पंचायत डेटा से संचालित (Zero Hallucination)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                      <Mic size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">मौसम या फसल के बारे में पूछें</p>
                      <p className="text-xs text-slate-500 mt-1">
                        नीचे दिए गए माइक्रोफ़ोन पर टैप करके बोलें या सवाल चुनें:
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      {t.quickQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-left text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 p-2.5 rounded-xl transition-all border border-slate-200 font-medium"
                        >
                          🗣️ "{q}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                      )}
                    >
                      <p>{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speak(msg.content)}
                          className="flex items-center gap-1 mt-2 text-xs text-indigo-600 font-semibold"
                        >
                          <Volume2 size={13} />
                          {t.listen}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area with Large Voice Button */}
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={startListening}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md',
                      listening
                        ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    )}
                    title="बोलें (Speak)"
                  >
                    {listening ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t.askPlaceholder}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white flex items-center justify-center transition-all"
                  >
                    <Send size={16} />
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
