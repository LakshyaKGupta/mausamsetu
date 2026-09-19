import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, Volume2, X, RotateCcw } from 'lucide-react'
import type { Language, ChatbotMessage } from '@/types'
import { cn } from '@/lib/utils'

interface VoiceAssistantCardProps {
  lang: Language
  onSendMessage: (text: string) => Promise<void>
  messages: ChatbotMessage[]
  onSpeak: (text: string) => void
  listening: boolean
  startListening: () => void
  stopListening: () => void
}

const VOICE_TEXT: Record<Language, {
  title: string
  subtitle: string
  listeningState: string
  tapToSpeak: string
  cancel: string
  suggestedTitle: string
  inputPlaceholder: string
  suggestedQuestions: string[]
  listen: string
}> = {
  hi: {
    title: 'बोलकर पूछें',
    subtitle: 'मौसम, सिंचाई या फसल की सलाह तुरंत पूछें',
    listeningState: 'सुन रहा हूँ... कृपया बोलें',
    tapToSpeak: 'माइक दबाकर सवाल पूछें',
    cancel: 'रद्द करें',
    suggestedTitle: 'सुझाए गए प्रश्न:',
    inputPlaceholder: 'लिखकर या बोलकर पूछें...',
    suggestedQuestions: [
      'कल बारिश होगी?',
      'आज सिंचाई करूँ?',
      'फसल पर बारिश का क्या असर होगा?',
    ],
    listen: 'सुनें',
  },
  mr: {
    title: 'बोलून विचारा',
    subtitle: 'हवामान, सिंचन किंवा पिकाचा सल्ला त्वरित विचारा',
    listeningState: 'ऐकत आहे... कृपया बोला',
    tapToSpeak: 'माईक दाबून प्रश्न विचारा',
    cancel: 'रद्द करा',
    suggestedTitle: 'सुचवलेले प्रश्न:',
    inputPlaceholder: 'टाइप करा किंवा बोलून विचारा...',
    suggestedQuestions: [
      'उद्या पाऊस पडेल का?',
      'आज सिंचन करावे का?',
      'पिकावर पावसाचा काय परिणाम होईल?',
    ],
    listen: 'ऐका',
  },
  en: {
    title: 'Ask by Voice',
    subtitle: 'Ask about weather, irrigation, or crop advisories',
    listeningState: 'Listening... Please speak',
    tapToSpeak: 'Tap microphone to speak',
    cancel: 'Cancel',
    suggestedTitle: 'Suggested Questions:',
    inputPlaceholder: 'Type or speak your question...',
    suggestedQuestions: [
      'Will it rain tomorrow?',
      'Should I irrigate today?',
      'What should I do because of tomorrow’s rain?',
    ],
    listen: 'Listen',
  },
}

export const VoiceAssistantCard: React.FC<VoiceAssistantCardProps> = ({
  lang,
  onSendMessage,
  messages,
  onSpeak,
  listening,
  startListening,
  stopListening,
}) => {
  const [inputText, setInputText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const t = VOICE_TEXT[lang] || VOICE_TEXT.hi

  useEffect(() => {
    if (messages.length > 0 && messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query || submitting) return
    setSubmitting(true)
    setInputText('')
    try {
      await onSendMessage(query)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              🎙️ {t.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Voice CTA Section */}
      <div className="flex flex-col items-center justify-center py-4 bg-emerald-50/40 border border-emerald-100 rounded-xl px-4 text-center">
        {listening ? (
          <div className="space-y-3">
            <button
              onClick={stopListening}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg ring-8 ring-red-100 animate-pulse transition-all mx-auto"
              aria-label="Stop recording"
            >
              <MicOff size={28} />
            </button>
            <div>
              <p className="text-sm font-bold text-red-700 animate-pulse">
                {t.listeningState}
              </p>
              <button
                onClick={stopListening}
                className="mt-1 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={startListening}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white flex items-center justify-center shadow-md transition-all mx-auto focus:outline-none focus:ring-4 focus:ring-emerald-200"
              aria-label={t.tapToSpeak}
            >
              <Mic size={28} className="text-emerald-100" />
            </button>
            <p className="text-xs sm:text-sm font-bold text-emerald-950">
              {t.tapToSpeak}
            </p>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-600">
          {t.suggestedTitle}
        </span>
        <div className="flex flex-wrap gap-2">
          {t.suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-xs font-medium bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-all text-left"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Conversation / Transcript Area */}
      {messages.length > 0 && (
        <div
          ref={messageContainerRef}
          className="space-y-3 pt-3 border-t border-slate-100 max-h-60 sm:max-h-72 overflow-y-auto pr-1"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col text-sm',
                msg.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[90%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-br-xs'
                    : 'bg-emerald-50 text-slate-800 border border-emerald-200 rounded-bl-xs'
                )}
              >
                <p className="font-medium">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => onSpeak(msg.content)}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white/70 px-2 py-0.5 rounded border border-emerald-300/60"
                  >
                    <Volume2 size={13} />
                    <span>{t.listen}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Field with Send Button */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.inputPlaceholder}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || submitting}
          className="w-9 h-9 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white flex items-center justify-center transition-all flex-shrink-0"
          aria-label="Send question"
        >
          <Send size={15} />
        </button>
      </div>

    </div>
  )
}
