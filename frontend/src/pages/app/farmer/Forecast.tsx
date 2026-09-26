import React, { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Zap,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { weatherApi } from '@/api/client'
import type { Language } from '@/types'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { cn } from '@/lib/utils'
import { resolvePanchayatDetails } from '@/utils/panchayat'

interface HourlyForecast {
  time: string
  temperature_c: number | null
  humidity_pct: number | null
  precipitation_mm: number
  precipitation_probability_pct: number
  wind_speed_kmh: number | null
  wind_direction_deg: number | null
  weather_code: number
  condition: string
}

interface DailySummary {
  date: string
  temp_max: number | null
  temp_min: number | null
  total_rain_mm: number
  avg_humidity: number | null
  max_wind: number
}

type ForecastMode = '1hr_1.5day' | '3hr_5day' | '6hr_10day'

const MODES: { id: ForecastMode; icon: React.ReactNode }[] = [
  { id: '1hr_1.5day', icon: <Zap size={14} /> },
  { id: '3hr_5day', icon: <Calendar size={14} /> },
  { id: '6hr_10day', icon: <Calendar size={14} /> },
]

const T: Record<Language, {
  title: string; subtitle: string; loading: string; noData: string;
  temp: string; rain: string; humidity: string; wind: string;
  rainProb: string; today: string; tomorrow: string; dayAfter: string;
  modeLabels: Record<ForecastMode, string>; dailySummary: string;
  maxTemp: string; minTemp: string; totalRain: string; source: string;
}> = {
  hi: {
    title: 'मौसम पूर्वानुमान',
    subtitle: 'वास्तविक मौसम डेटा — Open-Meteo API',
    loading: 'मौसम डेटा लोड हो रहा है...',
    noData: 'मौसम डेटा उपलब्ध नहीं',
    temp: 'तापमान',
    rain: 'बारिश',
    humidity: 'आर्द्रता',
    wind: 'हवा',
    rainProb: 'बारिश की संभावना',
    today: 'आज',
    tomorrow: 'कल',
    dayAfter: 'परसों',
    modeLabels: {
      '1hr_1.5day': '⚡ 1 घंटा / 1.5 दिन',
      '3hr_5day': '📊 3 घंटे / 5 दिन',
      '6hr_10day': '📅 6 घंटे / 10 दिन',
    },
    dailySummary: 'दैनिक सारांश',
    maxTemp: 'अधिकतम',
    minTemp: 'न्यूनतम',
    totalRain: 'कुल बारिश',
    source: 'स्रोत: Open-Meteo (वास्तविक डेटा)',
  },
  mr: {
    title: 'हवामान अंदाज',
    subtitle: 'वास्तविक हवामान डेटा — Open-Meteo API',
    loading: 'हवामान डेटा लोड होत आहे...',
    noData: 'हवामान डेटा उपलब्ध नाही',
    temp: 'तापमान',
    rain: 'पाऊस',
    humidity: 'आर्द्रता',
    wind: 'वारा',
    rainProb: 'पावसाची शक्यता',
    today: 'आज',
    tomorrow: 'उद्या',
    dayAfter: 'परवा',
    modeLabels: {
      '1hr_1.5day': '⚡ 1 तास / 1.5 दिवस',
      '3hr_5day': '📊 3 तास / 5 दिवस',
      '6hr_10day': '📅 6 तास / 10 दिवस',
    },
    dailySummary: 'दैनिक सारांश',
    maxTemp: 'कमाल',
    minTemp: 'किमान',
    totalRain: 'एकूण पाऊस',
    source: 'स्रोत: Open-Meteo (वास्तविक डेटा)',
  },
  en: {
    title: 'Weather Forecast',
    subtitle: 'Real weather data — Open-Meteo API',
    loading: 'Loading weather data...',
    noData: 'Weather data unavailable',
    temp: 'Temperature',
    rain: 'Rain',
    humidity: 'Humidity',
    wind: 'Wind',
    rainProb: 'Rain Probability',
    today: 'Today',
    tomorrow: 'Tomorrow',
    dayAfter: 'Day After',
    modeLabels: {
      '1hr_1.5day': '⚡ 1hr / 1.5 days',
      '3hr_5day': '📊 3hr / 5 days',
      '6hr_10day': '📅 6hr / 10 days',
    },
    dailySummary: 'Daily Summary',
    maxTemp: 'Max',
    minTemp: 'Min',
    totalRain: 'Total Rain',
    source: 'Source: Open-Meteo (Real Data)',
  },
}

function getConditionIcon(condition: string, size = 18) {
  switch (condition) {
    case 'rainy': return <CloudRain size={size} className="text-blue-500" />
    case 'cloudy': return <Cloud size={size} className="text-gray-500" />
    case 'partly_cloudy': return <Cloud size={size} className="text-amber-500" />
    case 'sunny':
    default: return <Sun size={size} className="text-yellow-500" />
  }
}

function formatTime(timeStr: string, lang: Language): string {
  try {
    const d = new Date(timeStr)
    const h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`
  } catch {
    return timeStr
  }
}

function formatDate(dateStr: string, lang: Language): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const t = T[lang]
    if (d.toDateString() === today.toDateString()) return t.today
    if (d.toDateString() === tomorrow.toDateString()) return t.tomorrow

    const dayNames: Record<Language, string[]> = {
      hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
      mr: ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    }
    const monthNames: Record<Language, string[]> = {
      hi: ['जन', 'फर', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
      mr: ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    }
    const names = dayNames[lang] || dayNames.en
    const months = monthNames[lang] || monthNames.en
    return `${names[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
  } catch {
    return dateStr
  }
}

function getRainBar(mm: number): { width: string; color: string } {
  if (mm <= 0) return { width: '0%', color: 'bg-transparent' }
  if (mm < 1) return { width: '15%', color: 'bg-blue-200' }
  if (mm < 3) return { width: '30%', color: 'bg-blue-300' }
  if (mm < 8) return { width: '50%', color: 'bg-blue-400' }
  if (mm < 15) return { width: '70%', color: 'bg-blue-500' }
  return { width: '100%', color: 'bg-blue-600' }
}

export default function FarmerForecastPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  const [mode, setMode] = useState<ForecastMode>('3hr_5day')
  const [forecasts, setForecasts] = useState<HourlyForecast[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const t = T[lang] || T.hi

  const farmerData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mausamsetu_farmer') || '{}')
    } catch { return {} }
  })()
  const gpDetails = resolvePanchayatDetails(outlet?.selectedLocation, farmerData, lang)

  const activeLat = outlet?.selectedLocation?.lat || 21.282
  const activeLon = outlet?.selectedLocation?.lon || 78.895
  const locationName = gpDetails.panchayatName

  const loadForecast = async (m: ForecastMode) => {
    setLoading(true)
    try {
      const res = await weatherApi.getLiveHourly({
        lat: activeLat,
        lon: activeLon,
        mode: m,
        name: locationName,
      })
      setForecasts(res.forecasts || [])
      setDailySummaries(res.daily_summaries || [])
      // Auto-expand first day
      if (res.daily_summaries?.length > 0) {
        setExpandedDay(res.daily_summaries[0].date)
      }
    } catch (err) {
      console.error('Forecast load failed:', err)
      setForecasts([])
      setDailySummaries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast(mode)
  }, [mode, activeLat, activeLon])

  // Group forecasts by day
  const groupedByDay: Record<string, HourlyForecast[]> = {}
  for (const fc of forecasts) {
    if (!fc.time) continue
    const day = fc.time.slice(0, 10)
    if (!groupedByDay[day]) groupedByDay[day] = []
    groupedByDay[day].push(fc)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <FarmerNav lang={lang} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Header with Prominent Gram Panchayat Identity */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 mt-1 inline-flex">
              <span>🏛️ {gpDetails.heroTitle}</span>
              <span>·</span>
              <span className="text-slate-600 font-medium">{gpDetails.districtName}</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
            🟢 LIVE
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                mode === m.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {m.icon}
              <span className="hidden xs:inline">{t.modeLabels[m.id]}</span>
              <span className="xs:hidden">{t.modeLabels[m.id].split('/')[0]}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        )}

        {/* No Data */}
        {!loading && forecasts.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm font-semibold">{t.noData}</p>
          </div>
        )}

        {/* Daily Groups */}
        {!loading && dailySummaries.map((ds) => {
          const dayForecasts = groupedByDay[ds.date] || []
          const isExpanded = expandedDay === ds.date

          return (
            <div key={ds.date} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Day Header — Tap to expand */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : ds.date)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-slate-900">
                    {formatDate(ds.date, lang)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-orange-600">{ds.temp_max}°</span>
                    <span>/</span>
                    <span className="text-blue-600">{ds.temp_min}°</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ds.total_rain_mm > 0 && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                      💧 {ds.total_rain_mm} mm
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {dayForecasts.length} {lang === 'en' ? 'entries' : 'प्रविष्टियाँ'}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </button>

              {/* Hourly Entries */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {/* Column Headers */}
                  <div className="grid grid-cols-6 gap-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <span>{lang === 'en' ? 'Time' : 'समय'}</span>
                    <span className="text-center">{t.temp}</span>
                    <span className="text-center">{t.rain}</span>
                    <span className="text-center">{t.rainProb}</span>
                    <span className="text-center">{t.humidity}</span>
                    <span className="text-center">{t.wind}</span>
                  </div>

                  {dayForecasts.map((fc, idx) => {
                    const rainBar = getRainBar(fc.precipitation_mm)
                    return (
                      <div
                        key={fc.time}
                        className={cn(
                          'grid grid-cols-6 gap-1 px-4 py-2.5 items-center text-xs',
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        )}
                      >
                        {/* Time */}
                        <div className="flex items-center gap-1.5">
                          {getConditionIcon(fc.condition, 14)}
                          <span className="font-bold text-slate-800">
                            {formatTime(fc.time, lang)}
                          </span>
                        </div>
                        {/* Temp */}
                        <div className="text-center font-bold text-slate-900">
                          {fc.temperature_c !== null ? `${fc.temperature_c}°` : '—'}
                        </div>
                        {/* Rain mm with bar */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${rainBar.color}`} style={{ width: rainBar.width }} />
                            </div>
                            <span className={cn('font-bold', fc.precipitation_mm > 0 ? 'text-blue-600' : 'text-slate-400')}>
                              {fc.precipitation_mm}
                            </span>
                          </div>
                        </div>
                        {/* Rain Prob */}
                        <div className={cn(
                          'text-center font-bold',
                          fc.precipitation_probability_pct > 60 ? 'text-blue-600' :
                          fc.precipitation_probability_pct > 30 ? 'text-amber-600' : 'text-slate-400'
                        )}>
                          {fc.precipitation_probability_pct}%
                        </div>
                        {/* Humidity */}
                        <div className="text-center text-slate-600 font-medium">
                          {fc.humidity_pct !== null ? `${fc.humidity_pct}%` : '—'}
                        </div>
                        {/* Wind */}
                        <div className="text-center text-slate-600 font-medium">
                          {fc.wind_speed_kmh !== null ? `${fc.wind_speed_kmh}` : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Source Badge */}
        {!loading && forecasts.length > 0 && (
          <div className="text-center py-3">
            <span className="text-[11px] font-medium text-slate-400">
              {t.source}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
