import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  CheckCircle,
  Volume2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Droplets,
  Thermometer,
  Bug,
  Wind,
  Info,
  MapPin,
  Leaf
} from 'lucide-react'
import type { Language } from '@/types'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { farmerApi } from '@/api/client'
import { cn } from '@/lib/utils'

interface AdviceItem {
  crop: string
  crop_emoji: string
  type: string
  headline: string
  detail: string
  why_explanation: string
  risk_level: string
  timestamp: string
}

const T: Record<Language, {
  title: string; subtitle: string; loading: string; noAdvice: string;
  whyTitle: string; weatherBasis: string; listenBtn: string;
  riskLabels: Record<string, string>; typeLabels: Record<string, string>;
}> = {
  hi: {
    title: '🌱 आज की कृषि सलाह',
    subtitle: 'वास्तविक मौसम पर आधारित बुद्धिमान सलाह',
    loading: 'मौसम विश्लेषण से सलाह बनाई जा रही है...',
    noAdvice: 'कोई सलाह उपलब्ध नहीं',
    whyTitle: '📋 यह सलाह क्यों दी गई?',
    weatherBasis: 'मौसम आधार',
    listenBtn: 'सुनें',
    riskLabels: { safe: '✅ सुरक्षित', warning: '⚠️ सतर्कता', critical: '🔴 गंभीर' },
    typeLabels: { irrigation: '💧 सिंचाई', spray: '🧪 छिड़काव', pest_alert: '🐛 कीट सतर्कता' },
  },
  mr: {
    title: '🌱 आजचा शेती सल्ला',
    subtitle: 'वास्तविक हवामानावर आधारित बुद्धिमान सल्ला',
    loading: 'हवामान विश्लेषणातून सल्ला तयार होत आहे...',
    noAdvice: 'कोणताही सल्ला उपलब्ध नाही',
    whyTitle: '📋 हा सल्ला का दिला?',
    weatherBasis: 'हवामान आधार',
    listenBtn: 'ऐका',
    riskLabels: { safe: '✅ सुरक्षित', warning: '⚠️ सतर्कता', critical: '🔴 गंभीर' },
    typeLabels: { irrigation: '💧 सिंचन', spray: '🧪 फवारणी', pest_alert: '🐛 कीड सतर्कता' },
  },
  en: {
    title: '🌱 Today\'s Farm Advice',
    subtitle: 'Intelligent advice based on real weather data',
    loading: 'Generating advice from weather analysis...',
    noAdvice: 'No advice available',
    whyTitle: '📋 Why this advice?',
    weatherBasis: 'Weather Basis',
    listenBtn: 'Listen',
    riskLabels: { safe: '✅ Safe', warning: '⚠️ Watch', critical: '🔴 Critical' },
    typeLabels: { irrigation: '💧 Irrigation', spray: '🧪 Spray', pest_alert: '🐛 Pest Alert' },
  },
}

export default function FarmerAdvisoryListPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  const [advices, setAdvices] = useState<AdviceItem[]>([])
  const [weatherSummary, setWeatherSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const t = T[lang] || T.hi

  const activeLat = outlet?.selectedLocation?.lat || 21.282
  const activeLon = outlet?.selectedLocation?.lon || 78.895
  const locationName = outlet?.selectedLocation?.name || 'Nagpur'

  // Load saved crops from localStorage
  const getSavedCrops = (): string => {
    try {
      const crops = JSON.parse(localStorage.getItem('mausamsetu_crops') || '[]')
      if (crops.length > 0) return crops.map((c: any) => c.crop || c).join(',')
    } catch { /* ignore */ }
    return 'soybean'
  }

  useEffect(() => {
    setLoading(true)
    const cropStr = getSavedCrops()
    farmerApi
      .getAdvice({ lat: activeLat, lon: activeLon, crops: cropStr, language: lang })
      .then((res: any) => {
        setAdvices(res.advices || [])
        setWeatherSummary(res.weather_summary || null)
      })
      .catch(() => setAdvices([]))
      .finally(() => setLoading(false))
  }, [activeLat, activeLon, lang])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <FarmerNav lang={lang} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin size={12} />
            <span>{locationName}</span>
            <span>·</span>
            <span>{t.subtitle}</span>
          </div>
        </div>

        {/* Weather Summary Banner */}
        {weatherSummary && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Thermometer size={14} className="text-orange-500" />
              <span className="font-bold">{weatherSummary.temperature_max}°C</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Droplets size={14} className="text-blue-500" />
              <span className="font-bold">{weatherSummary.rainfall_mm} mm</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Wind size={14} className="text-gray-500" />
              <span className="font-bold">{weatherSummary.wind_speed_kmh} km/h</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-bold">{weatherSummary.humidity_pct}%</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        )}

        {/* No Advice */}
        {!loading && advices.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">{t.noAdvice}</p>
          </div>
        )}

        {/* Advice Cards */}
        {!loading && advices.map((advice, idx) => {
          const isExpanded = expandedIdx === idx
          const riskColors: Record<string, string> = {
            safe: 'border-emerald-200 bg-emerald-50/30',
            warning: 'border-amber-200 bg-amber-50/30',
            critical: 'border-red-200 bg-red-50/30',
          }

          return (
            <div
              key={`${advice.crop}-${advice.type}-${idx}`}
              className={cn(
                'rounded-2xl border shadow-sm overflow-hidden transition-all',
                riskColors[advice.risk_level] || 'border-slate-200 bg-white'
              )}
            >
              {/* Card Header */}
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{advice.crop_emoji}</span>
                    <span className="text-xs font-bold text-slate-500">
                      {advice.crop}
                    </span>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      advice.risk_level === 'safe' ? 'bg-emerald-100 text-emerald-800' :
                      advice.risk_level === 'warning' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {t.riskLabels[advice.risk_level] || advice.risk_level}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {advice.headline}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {advice.detail}
                  </p>
                </div>

                {/* Listen button */}
                <button
                  onClick={() => speak(`${advice.headline}. ${advice.detail}`)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition-colors"
                  aria-label={t.listenBtn}
                >
                  <Volume2 size={16} />
                </button>
              </div>

              {/* Why Explanation Toggle */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full px-4 py-2 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 border-t border-slate-100 transition-colors"
              >
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Info size={13} />
                  {t.whyTitle}
                </span>
                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {/* Expanded Why Section */}
              {isExpanded && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p>{advice.why_explanation}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <Leaf size={10} />
                    <span>{t.typeLabels[advice.type] || advice.type}</span>
                    <span>·</span>
                    <span>Open-Meteo Real Data</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Source Footer */}
        {!loading && advices.length > 0 && (
          <div className="text-center py-3">
            <span className="text-[11px] font-medium text-slate-400">
              {lang === 'en' ? 'Powered by real Open-Meteo weather data' :
               lang === 'mr' ? 'वास्तविक Open-Meteo हवामान डेटा वर आधारित' :
               'वास्तविक Open-Meteo मौसम डेटा पर आधारित'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
