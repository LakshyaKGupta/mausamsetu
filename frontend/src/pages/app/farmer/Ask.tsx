import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Mic, MicOff, Send, Volume2, Bot, User, Sparkles, TrendingUp,
  Store, AlertCircle, ArrowUpRight, ArrowDownRight, ShieldCheck,
  ChevronDown, ChevronUp, Radio
} from 'lucide-react'
import { chatbotApi, farmerApi } from '@/api/client'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import type { Language, ChatbotMessage } from '@/types'
import { cn } from '@/lib/utils'

export default function FarmerAskPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'

  const [messages, setMessages] = useState<ChatbotMessage[]>([
    {
      role: 'assistant',
      content: lang === 'hi'
        ? 'नमस्ते! मैं मौसमसेतु किसान सहायक हूँ। आप धापेवाड़ा पंचायत के सूक्ष्म-मौसम, वर्षा पूर्वानुमान, मंडी भाव या फसल सुरक्षा के बारे में बोलकर या लिखकर पूछ सकते हैं।'
        : 'Hello! I am MausamSetu Farmer Assistant. You can ask about hyper-local weather, rainfall forecast, live mandi prices, or crop advisories for Dhapewada Gram Panchayat.',
      timestamp: new Date().toISOString(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [listening, setListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<number | undefined>()
  const [mandiPrices, setMandiPrices] = useState<any[]>([])
  const [showMandi, setShowMandi] = useState(false)

  useEffect(() => {
    farmerApi.getMandiPrices()
      .then((res) => {
        if (res?.prices) setMandiPrices(res.prices)
      })
      .catch(() => {})
  }, [])

  const promptSuggestions = [
    { text: 'आज बारिश होगी?', tag: 'वर्षा' },
    { text: 'कीटनाशक छिड़काव का सुरक्षित समय?', tag: 'स्प्रे' },
    { text: 'सोयाबीन में जलभराव बचाव उपाय', tag: 'फसल' },
    { text: 'कपास के वर्तमान मंडी भाव और मौसम प्रभाव', tag: 'मंडी' },
    { text: 'कल तापमान और हवा की गति क्या रहेगी?', tag: 'हवा' },
  ]

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.94
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText
    if (!text.trim() || loading) return

    stopSpeaking()
    const userMsg: ChatbotMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setLoading(true)

    try {
      const res = await chatbotApi.message({
        message: text,
        language: lang,
        panchayat_id: 1,
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
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    stopSpeaking()
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
        handleSend(transcript)
      }
    }
    recognition.start()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 md:pb-8">
      <FarmerNav lang={lang} />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-3 flex-1 flex flex-col w-full">
        {/* Assistant Header with Live GP Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-2xs">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  किसान आवाज एवं सलाह सहायक (Kisan AI)
                </h1>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  सक्रिय
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                धापेवाड़ा पंचायत (3km मॉडल + आईएमडी स्टेशन सत्यापित)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMandi(!showMandi)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
            >
              <Store size={14} className="text-amber-700" />
              <span>आज के मंडी भाव</span>
              {showMandi ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <span className="hidden sm:inline-flex badge-green text-xs font-bold py-1">
              <ShieldCheck size={12} className="inline mr-1" />
              सत्यापित कृषि डेटा
            </span>
          </div>
        </div>

        {/* Collapsible Live Mandi APMC Prices Drawer */}
        {showMandi && (
          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-amber-700" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  नागपुर एवं विदर्भ कृषि उपज मंडी दरें (Live APMC Mandi Rates)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                अपडेटेड: आज 10:45 AM
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {mandiPrices.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSend(`${item.commodity} का मंडी भाव और मौसम का असर क्या है?`)}
                  className="bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200/80 rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-brand-900">{item.commodity}</span>
                    <span className="text-[10px] text-slate-500">{item.variety}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-amber-950 font-mono">₹{item.modal_price}</span>
                    <span className="text-[10px] text-slate-500">/क्विंटल</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 truncate max-w-[70px]">{item.mandi}</span>
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <ArrowUpRight size={10} /> {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg text-center font-medium">
              💡 किसी भी फसल पर क्लिक करें और जानें कि आगामी मौसम का उसके मंडी भाव पर क्या असर पड़ सकता है।
            </p>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {promptSuggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSend(item.text)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Sparkles size={11} className="text-amber-500" />
              <span>{item.text}</span>
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 sm:p-6 shadow-xs overflow-y-auto space-y-4 min-h-[200px] sm:min-h-[360px] max-h-[400px] sm:max-h-[500px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3 max-w-[88%]',
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-2xs',
                  m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                )}
              >
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div
                className={cn(
                  'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs',
                  m.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                )}
              >
                <p className="whitespace-pre-line">{m.content}</p>
                {m.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-3">
                    <button
                      onClick={() => speak(m.content)}
                      className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                    >
                      <Volume2 size={12} />
                      सुनें (Listen)
                    </button>
                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800"
                      >
                        रोकें (Stop)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl w-44 border border-slate-200 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce delay-200" />
              <span>मौसम विश्लेषण जारी...</span>
            </div>
          )}
        </div>

        {/* Dynamic Voice Status & Soundwave Indicator */}
        {(listening || isSpeaking) && (
          <div className="bg-brand-900 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Radio size={16} className={cn(listening ? 'text-red-400 animate-pulse' : 'text-emerald-400')} />
              <span>{listening ? 'माइक सक्रिय है, अपनी बात बोलिए...' : 'सहायक उत्तर बोल रहा है...'}</span>
            </div>

            {/* Simulated 5-bar Soundwave */}
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-brand-300 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-brand-300 rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.1s] h-5" />
              <span className="w-1 bg-brand-300 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.2s] h-2" />
              <span className="w-1 bg-brand-300 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.3s] h-4" />
              <span className="w-1 bg-brand-300 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.15s] h-3" />
            </div>
          </div>
        )}

        {/* Input Bar with Voice Trigger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-md flex items-center gap-2">
          <button
            onClick={listening ? () => setListening(false) : startListening}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              listening
                ? 'bg-red-600 text-white animate-pulse shadow-md ring-4 ring-red-100'
                : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
            )}
            title="बोलकर पूछें"
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            className="flex-1 bg-transparent border-none text-base sm:text-sm text-slate-900 focus:outline-none px-2 placeholder:text-slate-400"
            placeholder={listening ? 'सुन रहा हूँ... बोलिए' : 'यहाँ प्रश्न लिखें या माइक दबाकर पूछें...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-50 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </main>
    </div>
  )
}

