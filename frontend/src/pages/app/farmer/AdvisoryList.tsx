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
  Wind,
  Info,
  Leaf,
  Download,
  FileText
} from 'lucide-react'
import type { Language } from '@/types'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { farmerApi } from '@/api/client'
import { cn } from '@/lib/utils'
import { resolvePanchayatDetails } from '@/utils/panchayat'

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
  downloadPdf: string; pdfReady: string;
}> = {
  hi: {
    title: '🌱 आज की कृषि सलाह',
    subtitle: 'आईएमडी व केवीके (KVK) वैज्ञानिक परामर्श',
    loading: 'मौसम विश्लेषण से सलाह बनाई जा रही है...',
    noAdvice: 'कोई सलाह उपलब्ध नहीं',
    whyTitle: '📋 यह सलाह क्यों दी गई?',
    weatherBasis: 'मौसम आधार',
    listenBtn: 'सुनें',
    downloadPdf: 'PDF डाउनलोड करें',
    pdfReady: 'रिपोर्ट तैयार हो रही है...',
    riskLabels: { safe: '✅ सुरक्षित', warning: '⚠️ सतर्कता', critical: '🔴 गंभीर' },
    typeLabels: { irrigation: '💧 सिंचाई', spray: '🧪 छिड़काव', pest_alert: '🐛 कीट सतर्कता' },
  },
  mr: {
    title: '🌱 आजचा शेती सल्ला',
    subtitle: 'आयएमडी व केव्हीके (KVK) वैज्ञानिक सल्ला',
    loading: 'हवामान विश्लेषणातून सल्ला तयार होत आहे...',
    noAdvice: 'कोणताही सल्ला उपलब्ध नाही',
    whyTitle: '📋 हा सल्ला का दिला?',
    weatherBasis: 'हवामान आधार',
    listenBtn: 'ऐका',
    downloadPdf: 'PDF डाउनलोड करा',
    pdfReady: 'अहवाल तयार होत आहे...',
    riskLabels: { safe: '✅ सुरक्षित', warning: '⚠️ सतर्कता', critical: '🔴 गंभीर' },
    typeLabels: { irrigation: '💧 सिंचन', spray: '🧪 फवारणी', pest_alert: '🐛 कीड सतर्कता' },
  },
  en: {
    title: "🌱 Today's Farm Advice",
    subtitle: 'IMD & KVK Verified Agronomic Advisory',
    loading: 'Generating advice from weather analysis...',
    noAdvice: 'No advice available',
    whyTitle: '📋 Why this advice?',
    weatherBasis: 'Weather Basis',
    listenBtn: 'Listen',
    downloadPdf: 'Download PDF Report',
    pdfReady: 'Preparing report...',
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
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const t = T[lang] || T.hi

  const farmerData = (() => {
    try { return JSON.parse(localStorage.getItem('mausamsetu_farmer') || '{}') }
    catch { return {} }
  })()
  const gpDetails = resolvePanchayatDetails(outlet?.selectedLocation, farmerData, lang)
  const activeLat = outlet?.selectedLocation?.lat || 21.282
  const activeLon = outlet?.selectedLocation?.lon || 78.895

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

  // Branded PDF download via print window
  const downloadPdf = () => {
    setPdfDownloading(true)
    const today = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const riskBadge = (r: string) => ({ safe: '🟢 सुरक्षित', warning: '🟡 सतर्कता', critical: '🔴 गंभीर' }[r] || r)

    const rows = advices.map((a, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8faf8' : '#fff'}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:20px">${a.crop_emoji}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">
          <strong style="color:#1a4731;font-size:13px">${a.crop}</strong><br/>
          <span style="font-size:11px;color:#6b7280">${riskBadge(a.risk_level)}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#1f2937">${a.headline}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;max-width:280px">${a.detail}</td>
      </tr>`).join('')

    const weatherHtml = weatherSummary ? `
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;gap:24px;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:600;color:#065f46">🌡️ ${weatherSummary.temperature_max}°C / ${weatherSummary.temperature_min}°C</span>
        <span style="font-size:13px;font-weight:600;color:#065f46">💧 ${weatherSummary.rainfall_mm} mm</span>
        <span style="font-size:13px;font-weight:600;color:#065f46">💨 ${weatherSummary.wind_speed_kmh} km/h</span>
        <span style="font-size:13px;font-weight:600;color:#065f46">🌊 ${weatherSummary.humidity_pct}%</span>
      </div>` : ''

    const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"/>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;background:#fff;padding:28px;font-size:13px}
  .hdr{background:linear-gradient(135deg,#065f46,#059669);color:#fff;padding:20px 24px;border-radius:14px;margin-bottom:20px}
  .hdr h1{font-size:20px;font-weight:700;margin-bottom:6px}
  .hdr .sub{font-size:11px;opacity:.85;display:flex;gap:12px;flex-wrap:wrap}
  .badge{background:rgba(255,255,255,.2);padding:2px 8px;border-radius:20px;font-size:11px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  thead tr{background:#065f46;color:#fff}
  thead th{padding:9px 12px;font-size:11px;text-align:left;font-weight:600;letter-spacing:.04em}
  .footer{text-align:center;font-size:10px;color:#9ca3af;margin-top:12px;border-top:1px solid #e5e7eb;padding-top:10px}
  @media print{.hdr,.hdr *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  thead tr{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
</style></head><body>
<div class="hdr">
  <h1>🌾 MausamSetu — कृषि सलाह रिपोर्ट</h1>
  <div class="sub">
    <span>📅 ${today}</span>
    <span class="badge">🏛️ ${gpDetails.heroTitle}</span>
    <span class="badge">📍 ${gpDetails.districtName}</span>
    <span class="badge">🟢 IMD व KVK वैज्ञानिक सत्यापन</span>
  </div>
</div>
${weatherHtml}
<table>
  <thead><tr>
    <th style="width:36px"></th>
    <th>फसल और स्थिति</th>
    <th>मुख्य सलाह</th>
    <th>विवरण और कार्यवाही</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">मौसमसेतु ग्राम पंचायत कृषि-मौसम सेवा | वास्तविक IMD व उपग्रह मौसम डेटा पर आधारित आधिकारिक परामर्श।</div>
</body></html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => { win.print() }, 600)
    }
    setTimeout(() => setPdfDownloading(false), 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <FarmerNav lang={lang} />
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
            <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1">
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                🏛️ {gpDetails.heroTitle}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">{gpDetails.districtName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">{t.subtitle}</span>
            </div>
          </div>

          {/* PDF Download */}
          {!loading && advices.length > 0 && (
            <button
              onClick={downloadPdf}
              disabled={pdfDownloading}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border',
                pdfDownloading
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800 active:scale-95'
              )}
            >
              {pdfDownloading
                ? <Loader2 size={14} className="animate-spin" />
                : <Download size={14} />
              }
              <span className="hidden sm:inline">{pdfDownloading ? t.pdfReady : t.downloadPdf}</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}
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

        {loading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        )}

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
            <div key={`${advice.crop}-${advice.type}-${idx}`}
              className={cn('rounded-2xl border shadow-sm overflow-hidden transition-all', riskColors[advice.risk_level] || 'border-slate-200 bg-white')}>
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{advice.crop_emoji}</span>
                    <span className="text-xs font-bold text-slate-500">{advice.crop}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      advice.risk_level === 'safe' ? 'bg-emerald-100 text-emerald-800' :
                      advice.risk_level === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}>
                      {t.riskLabels[advice.risk_level] || advice.risk_level}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{advice.headline}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{advice.detail}</p>
                </div>
                <button onClick={() => speak(`${advice.headline}. ${advice.detail}`)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition-colors"
                  aria-label={t.listenBtn}>
                  <Volume2 size={16} />
                </button>
              </div>
              <button onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full px-4 py-2 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 border-t border-slate-100 transition-colors">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Info size={13} />{t.whyTitle}
                </span>
                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>
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

        {/* Footer with second PDF link */}
        {!loading && advices.length > 0 && (
          <div className="text-center py-3 flex flex-col items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">
              {lang === 'en' ? 'Powered by real Open-Meteo weather data' :
               lang === 'mr' ? 'वास्तविक Open-Meteo हवामान डेटा वर आधारित' :
               'वास्तविक Open-Meteo मौसम डेटा पर आधारित'}
            </span>
            <button onClick={downloadPdf} disabled={pdfDownloading}
              className="flex items-center gap-1.5 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold transition-colors">
              <FileText size={12} />
              {t.downloadPdf}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
