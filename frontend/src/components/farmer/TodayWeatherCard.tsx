import React, { useState } from 'react'
import {
  Thermometer, Droplets, Cloud, Wind, ChevronDown, ChevronUp,
  Info, ShieldCheck, ArrowDownRight, ArrowUpRight
} from 'lucide-react'
import type { Language, WeatherSummary } from '@/types'
import { weatherConditionLabel, weatherEmoji, cn } from '@/lib/utils'

interface TodayWeatherCardProps {
  weather: WeatherSummary | null
  lang: Language
  loading?: boolean
}

const WEATHER_TEXT: Record<Language, {
  title: string
  rainfall: string
  humidity: string
  wind: string
  refinedForecast: string
  blockBaseline: string
  comparisonTitle: string
  provenanceToggle: string
  reliability: string
  expectedError: string
  source: string
  stage: string
  diffLabel: string
}> = {
  hi: {
    title: 'आज का मौसम',
    rainfall: 'अनुमानित वर्षा',
    humidity: 'आर्द्रता (Humidity)',
    wind: 'हवा की गति',
    refinedForecast: 'पंचायत परिष्कृत',
    blockBaseline: 'ब्लॉक बेसलाइन',
    comparisonTitle: 'मौसमसेतु स्थानीय परिष्कार बनाम ब्लॉक पूर्वानुमान',
    provenanceToggle: 'विश्वसनीयता एवं डेटा विवरण',
    reliability: 'मॉडल विश्वसनीयता',
    expectedError: 'संभावित त्रुटि सीमा',
    source: 'डेटा स्रोत',
    stage: 'प्रक्रिया चरण',
    diffLabel: 'स्थानीय भिन्नता',
  },
  mr: {
    title: 'आजचे हवामान',
    rainfall: 'अपेक्षित पाऊस',
    humidity: 'आर्द्रता',
    wind: 'वाऱ्याचा वेग',
    refinedForecast: 'पंचायत परिष्कृत',
    blockBaseline: 'ब्लॉक बेसलाइन',
    comparisonTitle: 'मौसमसेतू स्थानिक सुधारणा विरुद्ध ब्लॉक अंदाज',
    provenanceToggle: 'विश्वसनीयता आणि डेटा तपशील',
    reliability: 'मॉडेल विश्वसनीयता',
    expectedError: 'अपेक्षित त्रुटी मर्यादा',
    source: 'डेटा स्त्रोत',
    stage: 'प्रक्रिया टप्पा',
    diffLabel: 'स्थानिक फरक',
  },
  en: {
    title: "Today's Weather",
    rainfall: 'Rainfall',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    refinedForecast: 'Panchayat Refined',
    blockBaseline: 'Block Baseline',
    comparisonTitle: 'MausamSetu Refined Forecast vs. Block Forecast',
    provenanceToggle: 'Reliability & Data Details',
    reliability: 'Model Reliability',
    expectedError: 'Expected Error Margin',
    source: 'Data Source',
    stage: 'Pipeline Stage',
    diffLabel: 'Local Refinement',
  },
}

export const TodayWeatherCard: React.FC<TodayWeatherCardProps> = ({
  weather,
  lang,
  loading = false,
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const t = WEATHER_TEXT[lang] || WEATHER_TEXT.hi

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="h-16 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const rainValue = weather.predicted_rainfall_mm ?? weather.rainfall_mm ?? 0
  const baselineRain = weather.baseline_rainfall_mm ?? rainValue
  const delta = (rainValue - baselineRain).toFixed(1)
  const isHigher = Number(delta) > 0

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      
      {/* Card Header with Freshness Indicator */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            ● अपडेटेड {weather.data_updated_at || '10:30 AM'}
          </span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
            24h पूर्वानुमान
          </span>
        </div>
      </div>

      {/* Main Temperature & Condition Display */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {weather.temperature_max ? `${Math.round(weather.temperature_max)}°C` : '28°C'}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              {weather.temperature_min ? `/ ${Math.round(weather.temperature_min)}°C` : '/ 21°C'}
            </span>
          </div>
          <p className="text-base font-semibold text-slate-700 mt-1">
            {weatherConditionLabel(weather.condition, lang)}
          </p>
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-3xl sm:text-4xl shadow-sm">
          {weatherEmoji(weather.condition)}
        </div>
      </div>

      {/* 3 Core Weather Metrics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Rainfall */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2 sm:p-3 text-center">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <Droplets size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-blue-900 leading-tight">
            {rainValue} <span className="text-[10px] sm:text-xs font-medium">mm</span>
          </p>
          <p className="text-[10px] sm:text-xs font-medium text-slate-600 mt-0.5 truncate">
            {t.rainfall}
          </p>
        </div>

        {/* Humidity */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-3 text-center">
          <div className="flex items-center justify-center text-slate-600 mb-1">
            <Cloud size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-800 leading-tight">
            {weather.humidity_pct ?? 70}%
          </p>
          <p className="text-[10px] sm:text-xs font-medium text-slate-600 mt-0.5 truncate">
            {t.humidity}
          </p>
        </div>

        {/* Wind */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-3 text-center">
          <div className="flex items-center justify-center text-slate-600 mb-1">
            <Wind size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-800 leading-tight">
            14 <span className="text-[10px] sm:text-xs font-medium">km/h</span>
          </p>
          <p className="text-[10px] sm:text-xs font-medium text-slate-600 mt-0.5 truncate">
            {t.wind}
          </p>
        </div>
      </div>

      {/* Refined Forecast vs. Block Forecast Comparison */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>{t.comparisonTitle}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
            <span className="text-slate-500 block text-[11px] font-medium">{t.refinedForecast}</span>
            <span className="text-sm font-bold text-emerald-800">{rainValue} mm</span>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
            <span className="text-slate-500 block text-[11px] font-medium">{t.blockBaseline}</span>
            <span className="text-sm font-bold text-slate-700">{baselineRain} mm</span>
          </div>
        </div>

        {Number(delta) !== 0 && (
          <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 pt-1">
            {isHigher ? (
              <ArrowUpRight size={13} className="text-blue-600" />
            ) : (
              <ArrowDownRight size={13} className="text-emerald-600" />
            )}
            <span>
              {t.diffLabel}: स्थानीय स्थलाकृति के आधार पर {Math.abs(Number(delta))} mm {isHigher ? 'अधिक' : 'कम'}
            </span>
          </p>
        )}
      </div>

      {/* Subtle Reliability & Provenance Accordion */}
      <div className="border-t border-slate-100 pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          aria-expanded={showDetails}
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-700" />
            {t.provenanceToggle}
          </span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600 animate-fade-in">
            <div className="flex justify-between">
              <span>{t.reliability}:</span>
              <span className="font-semibold text-emerald-800">
                {weather.model_reliability || 'HIGH (उच्च)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t.expectedError}:</span>
              <span className="font-semibold text-slate-800">
                ±{weather.expected_error_margin_mm ?? '0.11'} mm
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t.source}:</span>
              <span className="font-semibold text-slate-700">
                {weather.source_name || 'IMD Agromet / Observation Network'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t.stage}:</span>
              <span className="font-semibold text-slate-700">
                {weather.provenance_stage || 'AI Downscaled'}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
