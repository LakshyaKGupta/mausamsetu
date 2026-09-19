import React from 'react'
import { Calendar, Droplets, AlertCircle } from 'lucide-react'
import type { Language, WeatherSummary } from '@/types'

interface TomorrowForecastCardProps {
  weather: WeatherSummary | null
  lang: Language
}

const TOMORROW_TEXT: Record<Language, {
  title: string
  rainExpected: string
  noRain: string
  riskLabel: string
  lowRisk: string
  moderateRisk: string
  highRisk: string
  timingNote: string
}> = {
  hi: {
    title: 'कल का पूर्वानुमान',
    rainExpected: 'वर्षा का अनुमान',
    noRain: 'बारिश की संभावना नहीं है (0.0 मिमी)',
    riskLabel: 'वर्षा जोखिम',
    lowRisk: 'कम जोखिम (Low)',
    moderateRisk: 'मध्यम जोखिम (Moderate)',
    highRisk: 'अधिक जोखिम (High)',
    timingNote: 'अगले 24 से 48 घंटे के लिए पूर्वानुमान',
  },
  mr: {
    title: 'उद्याचा अंदाज',
    rainExpected: 'पावसाचा अंदाज',
    noRain: 'पावसाची शक्यता नाही (0.0 मिमी)',
    riskLabel: 'पाऊस जोखीम',
    lowRisk: 'कमी जोखीम (Low)',
    moderateRisk: 'मध्यम जोखीम (Moderate)',
    highRisk: 'जास्त जोखीम (High)',
    timingNote: 'पुढील २४ ते ४८ तासांचा अंदाज',
  },
  en: {
    title: "Tomorrow's Forecast",
    rainExpected: 'Expected Rainfall',
    noRain: 'No rain expected (0.0 mm)',
    riskLabel: 'Rain Risk',
    lowRisk: 'Low Risk',
    moderateRisk: 'Moderate Risk',
    highRisk: 'High Risk',
    timingNote: 'Forecast for next 24 to 48 hours',
  },
}

export const TomorrowForecastCard: React.FC<TomorrowForecastCardProps> = ({
  weather,
  lang,
}) => {
  const t = TOMORROW_TEXT[lang] || TOMORROW_TEXT.hi
  const rainValue = weather?.predicted_rainfall_mm ?? 0

  const isRain = rainValue > 0.5
  const risk =
    rainValue > 15 ? t.highRisk
    : rainValue > 3 ? t.moderateRisk
    : t.lowRisk

  const riskColor =
    rainValue > 15 ? 'text-amber-800 bg-amber-100 border-amber-200'
    : rainValue > 3 ? 'text-blue-800 bg-blue-100 border-blue-200'
    : 'text-emerald-800 bg-emerald-100 border-emerald-200'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t.title}
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          24h – 48h
        </span>
      </div>

      {/* Main Forecast Block */}
      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
          {isRain ? '🌧️' : '⛅'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base font-bold text-slate-900">
              {isRain ? `${t.rainExpected}: ${rainValue} mm` : t.noRain}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${riskColor}`}>
              {risk}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {t.timingNote}
          </p>
        </div>
      </div>

    </div>
  )
}
