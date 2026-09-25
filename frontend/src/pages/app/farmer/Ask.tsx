import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Mic, MicOff, Send, Volume2, Bot, User, Sparkles } from 'lucide-react'
import { chatbotApi } from '@/api/client'
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
        ? 'नमस्ते! मैं मौसमसेतु किसान सहायक हूँ। आप धापेवाड़ा पंचायत के मौसम, वर्षा, या फसल सलाह के बारे में बोलकर या लिखकर पूछ सकते हैं।'
        : 'Hello! I am MausamSetu Farmer Assistant. You can ask about weather, rainfall, or crop advisory for Dhapewada Gram Panchayat.',
      timestamp: new Date().toISOString(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<number | undefined>()

  const promptSuggestions = [
    'आज बारिश होगी?',
    'क्या सोयाबीन में पानी देना चाहिए?',
    'कल तापमान कितना रहेगा?',
    'कपास में कीट नियंत्रण कब करें?',
  ]

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText
    if (!text.trim() || loading) return

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                बोलकर पूछें (Voice Agricultural Assistant)
              </h1>
              <p className="text-xs text-slate-500">
                सत्यापित मौसम एवं कृषि आंकड़ों पर आधारित उत्तर
              </p>
            </div>
          </div>
          <span className="badge-green text-xs font-bold">
            डेटा-सत्यापित AI
          </span>
        </div>

        {/* Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {promptSuggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Sparkles size={11} className="text-amber-500" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm overflow-y-auto space-y-4 min-h-[350px] max-h-[500px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3 max-w-[85%]',
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
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
                <p>{m.content}</p>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speak(m.content)}
                    className="mt-2 text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
                  >
                    <Volume2 size={12} />
                    सुनें
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-xl w-36">
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce delay-200" />
              <span>खोज रहा है...</span>
            </div>
          )}
        </div>

        {/* Input Bar with Voice Trigger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-md flex items-center gap-2">
          <button
            onClick={listening ? () => setListening(false) : startListening}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
              listening
                ? 'bg-red-600 text-white animate-pulse shadow-md'
                : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
            )}
            title="बोलकर पूछें"
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            className="flex-1 bg-transparent border-none text-sm text-slate-900 focus:outline-none px-2"
            placeholder={listening ? 'सुन रहा हूँ... बोलिए' : 'यहाँ प्रश्न लिखें या माइक दबाकर पूछें...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </main>
    </div>
  )
}
