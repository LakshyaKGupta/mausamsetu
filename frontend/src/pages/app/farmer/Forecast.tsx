import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Cloud, CloudRain, Droplets, Wind, Thermometer,
  ShieldCheck, ArrowDownRight, ArrowUpRight, Calendar, Compass,
  ChevronDown, ChevronUp, Info
} from 'lucide-react'
import { weatherApi } from '@/api/client'
import type { WeatherSummary, Language, WeatherCondition } from '@/types'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { weatherConditionLabel, weatherEmoji, cn } from '@/lib/utils'

export default function FarmerForecastPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  const [weather, setWeather] = useState<WeatherSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [horizon, setHorizon] = useState<'24h' | '3d' | '5d' | '7d'>('7d')
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  useEffect(() => {
    weatherApi.getToday(1).then((w) => {
      setWeather(w)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const allForecastDays: Array<{
    day: string
    date: string
    tempMax: number
    tempMin: number
    rain: number
    baseline: number
    condition: WeatherCondition
    humidity: number
    wind: number
  }> = [
    { day: 'आज (Today)', date: '25 Sep', tempMax: 28, tempMin: 21, rain: 3.8, baseline: 4.5, condition: 'rainy', humidity: 74, wind: 14 },
    { day: 'कल (Tomorrow)', date: '26 Sep', tempMax: 29, tempMin: 22, rain: 1.2, baseline: 2.0, condition: 'partly_cloudy', humidity: 68, wind: 12 },
    { day: 'शुक्रवार (Fri)', date: '27 Sep', tempMax: 31, tempMin: 23, rain: 0.0, baseline: 0.0, condition: 'sunny', humidity: 55, wind: 10 },
    { day: 'शनिवार (Sat)', date: '28 Sep', tempMax: 30, tempMin: 22, rain: 0.5, baseline: 1.0, condition: 'partly_cloudy', humidity: 60, wind: 11 },
    { day: 'रविवार (Sun)', date: '29 Sep', tempMax: 28, tempMin: 21, rain: 6.4, baseline: 8.2, condition: 'rainy', humidity: 82, wind: 16 },
    { day: 'सोमवार (Mon)', date: '30 Sep', tempMax: 27, tempMin: 20, rain: 4.0, baseline: 5.0, condition: 'rainy', humidity: 78, wind: 13 },
    { day: 'मंगलवार (Tue)', date: '01 Oct', tempMax: 29, tempMin: 22, rain: 0.2, baseline: 0.0, condition: 'cloudy', humidity: 65, wind: 10 },
  ]

  const displayDays =
    horizon === '24h'
      ? allForecastDays.slice(0, 1)
      : horizon === '3d'
      ? allForecastDays.slice(0, 3)
      : horizon === '5d'
      ? allForecastDays.slice(0, 5)
      : allForecastDays

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 md:pb-8">
      <FarmerNav lang={lang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Location & Freshness Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                धापेवाड़ा ग्राम पंचायत — मौसम पूर्वानुमान
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              नागपुर ज़िला • कलमेश्वर ब्लॉक • 312m ऊँचाई
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Horizon Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: '24h', label: '24 घंटे' },
                { id: '3d', label: '3 दिन' },
                { id: '5d', label: '5 दिन' },
                { id: '7d', label: '7 दिन' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setHorizon(id as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all',
                    horizon === id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
              ● डेटा अद्यतन: 10:30 AM
            </span>
          </div>
        </div>

        {/* Explainability / Rationale Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-brand-700" />
              <h3 className="text-sm font-bold text-slate-900">
                पंचायत स्तरीय मौसम सूचना (Panchayat-Level Weather)
              </h3>
            </div>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
            >
              <span>{showTechnicalDetails ? 'तकनीकी विवरण छिपाएं' : 'मौसम विवरण / Rationale'}</span>
              {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            यह मौसम अनुमान आधिकारिक मौसम डेटा, धापेवाड़ा की स्थानीय ऊँचाई तथा निकटतम स्वचालित मौसम केंद्र (AWS) के अवलोकनों पर आधारित है।
          </p>

          {showTechnicalDetails && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700 animate-fade-in">
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <Info size={14} className="text-sky-600" />
                पूर्वानुमान का आधार (Observation Sources):
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>निकटतम स्वचालित मौसम केंद्र: AWS #104 (कलमेश्वर पूर्व, 8.4 किमी दूर)</li>
                <li>स्थानीय घाटी ऊँचाई सुधार: 312 मीटर (तापमान एवं वर्षा ढलान समायोजन)</li>
                <li>विश्वसनीयता श्रेणी: उच्च (High Reliability, हालिया 24 घंटे वर्षा 1.2 मिमी)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Day-by-Day Forecast Cards */}
        <div className={cn(
          'grid gap-3',
          displayDays.length === 1 && 'grid-cols-1 max-w-sm',
          displayDays.length === 3 && 'grid-cols-1 md:grid-cols-3',
          displayDays.length === 5 && 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
          displayDays.length === 7 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-7'
        )}>
          {displayDays.map((d, idx) => (
            <div
              key={idx}
              className={cn(
                'bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md',
                idx === 0 ? 'border-brand-500 ring-2 ring-brand-100 bg-brand-50/20' : 'border-slate-200'
              )}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-slate-900">{d.day}</span>
                  <span className="text-[11px] text-slate-400">{d.date}</span>
                </div>
                <div className="text-center my-3">
                  <div className="text-3xl mb-1">{weatherEmoji(d.condition)}</div>
                  <p className="text-xs font-semibold text-slate-700 capitalize">
                    {weatherConditionLabel(d.condition, lang)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">तापमान:</span>
                  <span className="font-bold text-slate-900">{d.tempMax}° / {d.tempMin}°C</span>
                </div>

                <div className="bg-emerald-50/80 p-2 rounded-xl space-y-1 border border-emerald-100">
                  <div className="flex justify-between text-emerald-950 font-bold">
                    <span>अनुमानित वर्षा:</span>
                    <span>{d.rain} mm</span>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>नमी: {d.humidity}%</span>
                  <span>हवा: {d.wind} km/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
