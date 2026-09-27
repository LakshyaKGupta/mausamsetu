import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  Droplets,
  Wind,
  Volume2,
  Mic,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  Loader2,
  Thermometer,
  LocateFixed,
  ShieldCheck,
} from 'lucide-react'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { FarmerAnimatedWeatherMap } from '@/components/farmer/FarmerAnimatedWeatherMap'
import { weatherApi, farmerApi } from '@/api/client'
import type { Language } from '@/types'
import type { SelectedLocation } from '@/components/farmer/LocationSearchModal'
import { resolvePanchayatDetails } from '@/utils/panchayat'

export interface AppOutletContext {
  lang: Language
  setLang: (lang: Language) => void
  panchayatName?: string
  districtName?: string
  userName?: string
  selectedLocation?: SelectedLocation | null
  openLocationModal?: () => void
}

const T: Record<Language, {
  greeting: string; greetingSub: string; todayWeather: string;
  rain: string; humidity: string; wind: string; feelsLike: string;
  actionTitle: string; whyBtn: string; listenBtn: string;
  askTitle: string; askSub: string; voiceBtn: string;
  quickQ: string[]; viewForecast: string; viewAdvice: string;
  myCrops: string; loading: string; next3days: string;
  whyTitle: string; updatedAt: string; source: string;
}> = {
  hi: {
    greeting: 'नमस्ते',
    greetingSub: 'आज आपकी फसल के लिए मौसम कैसा है?',
    todayWeather: 'आज का मौसम',
    rain: 'बारिश',
    humidity: 'आर्द्रता',
    wind: 'हवा',
    feelsLike: 'महसूस',
    actionTitle: '🌱 आज खेत में क्या करें?',
    whyBtn: 'यह सलाह क्यों?',
    listenBtn: 'सुनें',
    askTitle: '🎙️ कुछ पूछना है?',
    askSub: 'मौसम या फसल के बारे में पूछें',
    voiceBtn: 'बोलकर पूछें',
    quickQ: ['कल बारिश होगी?', 'सिंचाई कब करूं?', 'सोयाबीन में खाद?'],
    viewForecast: 'पूर्वानुमान देखें →',
    viewAdvice: 'सभी सलाह देखें →',
    myCrops: 'मेरी फसलें →',
    loading: 'मौसम डेटा लोड हो रहा है...',
    next3days: 'अगले 3 दिन',
    whyTitle: '📋 यह सलाह क्यों?',
    updatedAt: 'अभी अपडेट हुआ',
    source: 'Open-Meteo वास्तविक डेटा',
  },
  mr: {
    greeting: 'नमस्कार',
    greetingSub: 'आज आपल्या पिकासाठी हवामान कसे आहे?',
    todayWeather: 'आजचे हवामान',
    rain: 'पाऊस',
    humidity: 'आर्द्रता',
    wind: 'वारा',
    feelsLike: 'वाटते',
    actionTitle: '🌱 आज शेतात काय करावे?',
    whyBtn: 'हा सल्ला का?',
    listenBtn: 'ऐका',
    askTitle: '🎙️ काही विचारायचे आहे?',
    askSub: 'हवामान किंवा पिकाबद्दल विचारा',
    voiceBtn: 'बोलून विचारा',
    quickQ: ['उद्या पाऊस पडेल?', 'सिंचन कधी करावे?', 'सोयाबीनला खत?'],
    viewForecast: 'अंदाज पहा →',
    viewAdvice: 'सर्व सल्ला पहा →',
    myCrops: 'माझी पिके →',
    loading: 'हवामान डेटा लोड होत आहे...',
    next3days: 'पुढील 3 दिवस',
    whyTitle: '📋 हा सल्ला का?',
    updatedAt: 'नुकतेच अपडेट',
    source: 'Open-Meteo वास्तविक डेटा',
  },
  en: {
    greeting: 'Hello',
    greetingSub: 'How\'s the weather for your crop today?',
    todayWeather: 'Today\'s Weather',
    rain: 'Rain',
    humidity: 'Humidity',
    wind: 'Wind',
    feelsLike: 'Feels',
    actionTitle: '🌱 What to do today?',
    whyBtn: 'Why this advice?',
    listenBtn: 'Listen',
    askTitle: '🎙️ Have a question?',
    askSub: 'Ask about weather or crops',
    voiceBtn: 'Ask with Voice',
    quickQ: ['Will it rain tomorrow?', 'When to irrigate?', 'Fertilizer for soybean?'],
    viewForecast: 'View Forecast →',
    viewAdvice: 'All Advice →',
    myCrops: 'My Crops →',
    loading: 'Loading weather data...',
    next3days: 'Next 3 Days',
    whyTitle: '📋 Why this advice?',
    updatedAt: 'Just updated',
    source: 'Open-Meteo Real Data',
  },
}

function getConditionIcon(condition: string, size = 32) {
  switch (condition) {
    case 'rainy': return <CloudRain size={size} className="text-blue-500" />
    case 'cloudy': return <Cloud size={size} className="text-gray-500" />
    case 'partly_cloudy': return <CloudSun size={size} className="text-amber-500" />
    case 'sunny':
    default: return <Sun size={size} className="text-yellow-500" />
  }
}

function getConditionLabel(condition: string, lang: Language): string {
  const labels: Record<string, Record<Language, string>> = {
    sunny: { hi: 'साफ मौसम', mr: 'निरभ्र हवामान', en: 'Clear sky' },
    partly_cloudy: { hi: 'आंशिक बादल', mr: 'अंशतः ढगाळ', en: 'Partly cloudy' },
    cloudy: { hi: 'बादल छाए', mr: 'ढगाळ', en: 'Cloudy' },
    rainy: { hi: 'बारिश', mr: 'पाऊस', en: 'Rainy' },
  }
  return labels[condition]?.[lang] || condition
}

export default function FarmerHome() {
  const outlet = useOutletContext<AppOutletContext | undefined>()
  const navigate = useNavigate()
  const [internalLang, setInternalLang] = useState<Language>(() => {
    return (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  })

  useEffect(() => {
    const handleLangEvent = (e: any) => {
      if (e.detail) setInternalLang(e.detail)
    }
    window.addEventListener('mausamsetu_lang_change', handleLangEvent)
    return () => window.removeEventListener('mausamsetu_lang_change', handleLangEvent)
  }, [])

  const lang = outlet?.lang || internalLang
  const t = T[lang] || T.hi

  const [weather, setWeather] = useState<any>(null)
  const [advice, setAdvice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWhy, setShowWhy] = useState(false)

  // Reactive location state – updates when navbar location picker fires
  const [currentLoc, setCurrentLoc] = useState<SelectedLocation | null>(() => {
    if (outlet?.selectedLocation) return outlet.selectedLocation
    try {
      const stored = localStorage.getItem('mausamsetu_selected_location')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Sync from outlet (parent state) when it changes
  useEffect(() => {
    if (outlet?.selectedLocation) {
      setCurrentLoc(outlet.selectedLocation)
    }
  }, [outlet?.selectedLocation])

  // Listen for location change events from any source (navbar, GPS, etc.)
  useEffect(() => {
    const handleLocChange = (e: any) => {
      const newLoc = e.detail as SelectedLocation | null
      if (newLoc) {
        setCurrentLoc(newLoc)
      } else {
        // Re-read from localStorage if detail is empty
        try {
          const stored = localStorage.getItem('mausamsetu_selected_location')
          setCurrentLoc(stored ? JSON.parse(stored) : null)
        } catch {
          setCurrentLoc(null)
        }
      }
    }
    window.addEventListener('mausamsetu_location_change', handleLocChange)
    return () => window.removeEventListener('mausamsetu_location_change', handleLocChange)
  }, [])

  const loc = currentLoc
  const farmerData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mausamsetu_farmer') || '{}')
    } catch { return {} }
  })()
  const gpDetails = resolvePanchayatDetails(loc, farmerData, lang)
  const activeLat = loc?.lat || 21.282
  const activeLon = loc?.lon || 78.895
  const locationName = gpDetails.panchayatName

  // Fetch weather + advice whenever location or language changes
  useEffect(() => {
    setLoading(true)

    // Fetch live weather with Gram Panchayat priority
    weatherApi
      .getLiveWeather({
        lat: activeLat,
        lon: activeLon,
        name: locationName,
        block: gpDetails.blockName,
        district: gpDetails.districtName,
        state: gpDetails.stateName,
        elevation_m: loc?.elevation_m,
      })
      .then((res: any) => {
        setWeather(res)
      })
      .catch(() => {})

    // Fetch advice
    const savedCrops = (() => {
      try {
        const crops = JSON.parse(localStorage.getItem('mausamsetu_crops') || '[]')
        return crops.map((c: any) => c.crop || c).join(',') || 'soybean'
      } catch { return 'soybean' }
    })()

    farmerApi
      .getAdvice({ lat: activeLat, lon: activeLon, crops: savedCrops, language: lang })
      .then((res: any) => {
        setAdvice(res.advices?.[0] || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeLat, activeLon, lang])

  const [detectingGps, setDetectingGps] = useState(false)
  const [gpsMessage, setGpsMessage] = useState('')

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsMessage(lang === 'hi' ? 'जीपीएस उपलब्ध नहीं है' : lang === 'mr' ? 'जीपीएस उपलब्ध नाही' : 'GPS not supported')
      return
    }
    setDetectingGps(true)
    setGpsMessage('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        try {
          const res = await weatherApi.reverseGeocode(latitude, longitude, lang)
          const village = res.village || res.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          const taluka = res.taluka || res.nearest_panchayat?.block || ''
          const district = res.district || res.nearest_panchayat?.district || ''
          const state = res.state || 'Maharashtra'

          const newLoc: SelectedLocation = {
            id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: village,
            block: taluka,
            district: district,
            state: state,
            lat: latitude,
            lon: longitude,
            elevation_m: res.elevation_m,
            display_label: res.display_label || `${village}${taluka ? `, ${taluka}` : ''} · ${district}`,
            is_gps: true,
            accuracy_m: Math.round(accuracy || 0),
            nearest_panchayat: res.nearest_panchayat?.name,
          }
          localStorage.setItem('mausamsetu_selected_location', JSON.stringify(newLoc))
          localStorage.setItem('mausamsetu_location_detected', 'true')
          window.dispatchEvent(new CustomEvent('mausamsetu_location_change', { detail: newLoc }))
          setGpsMessage(`${lang === 'hi' ? 'सटीक स्थान मिला' : lang === 'mr' ? 'अचूक स्थान सापडले' : 'Detected'}: ${village}${district ? `, ${district}` : ''}`)
        } catch (err) {
          console.error('Error reverse geocoding:', err)
          const newLoc: SelectedLocation = {
            id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: `Farm GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
            lat: latitude,
            lon: longitude,
            is_gps: true,
            accuracy_m: Math.round(accuracy || 0),
          }
          localStorage.setItem('mausamsetu_selected_location', JSON.stringify(newLoc))
          localStorage.setItem('mausamsetu_location_detected', 'true')
          window.dispatchEvent(new CustomEvent('mausamsetu_location_change', { detail: newLoc }))
        } finally {
          setDetectingGps(false)
        }
      },
      (err) => {
        setDetectingGps(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGpsMessage(lang === 'hi' ? 'स्थान अनुमति अस्वीकृत है' : lang === 'mr' ? 'स्थान परवानगी नाकारली' : 'Location permission denied')
        } else {
          setGpsMessage(lang === 'hi' ? 'स्थान नहीं मिल सका' : lang === 'mr' ? 'स्थान शोधता आले नाही' : 'Location unavailable')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Ask for live location if first visit to farmer portal
  useEffect(() => {
    const detected = localStorage.getItem('mausamsetu_location_detected')
    const storedLoc = localStorage.getItem('mausamsetu_selected_location')
    if (!detected && !storedLoc && navigator.geolocation) {
      handleDetectLiveLocation()
    }
  }, [])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <FarmerNav lang={lang} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ─── Unified Official Agromet Header Card ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Top metadata strip */}
          <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">
                {lang === 'hi' ? 'राष्ट्रीय कृषि-मौसम सेवा' : lang === 'mr' ? 'राष्ट्रीय कृषी-हवामान सेवा' : 'National Agromet Service'}
              </span>
              <span className="text-slate-300">|</span>
              <span>IMD · ICAR</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
              <span>LGD:</span>
              <span className="font-bold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded">
                {gpDetails.lgdCode}
              </span>
            </div>
          </div>

          {/* Main Panchayat & Farmer greeting */}
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-emerald-800">
                  {t.greeting}, {outlet?.userName || (lang === 'hi' ? 'किसान मित्र' : lang === 'mr' ? 'शेतकरी मित्र' : 'Farmer')}!
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {gpDetails.heroTitle}
                </h1>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                  <span>
                    {lang === 'hi' ? `ब्लॉक: ${gpDetails.blockName}` : lang === 'mr' ? `तालुका: ${gpDetails.blockName}` : `Block: ${gpDetails.blockName}`}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    {lang === 'hi' ? `ज़िला: ${gpDetails.districtName}` : lang === 'mr' ? `जिल्हा: ${gpDetails.districtName}` : `District: ${gpDetails.districtName}`}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-700">{gpDetails.stateName}</span>
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  onClick={handleDetectLiveLocation}
                  disabled={detectingGps}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="जीपीएस द्वारा खेत का स्थान सत्यापित करें"
                >
                  {detectingGps ? (
                    <>
                      <Loader2 className="animate-spin text-emerald-700" size={13} />
                      <span>{lang === 'hi' ? 'खोज रहे हैं...' : lang === 'mr' ? 'शोधत आहे...' : 'Detecting...'}</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed size={13} className="text-emerald-700" />
                      <span>
                        {loc?.is_gps
                          ? (lang === 'hi' ? 'GPS सत्यापित' : lang === 'mr' ? 'GPS सत्यापित' : 'GPS Active')
                          : (lang === 'hi' ? 'GPS स्थान' : lang === 'mr' ? 'GPS स्थान' : 'Live GPS')}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => outlet?.openLocationModal?.()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="स्थान बदलें / Change Panchayat"
                >
                  <MapPin size={13} className="text-slate-500" />
                  <span>
                    {lang === 'hi' ? 'पंचायत बदलें' : lang === 'mr' ? 'पंचायत बदला' : 'Change GP'}
                  </span>
                </button>
              </div>
            </div>

            {/* GPS verification banner if active / detected */}
            {loc?.is_gps && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>
                    {lang === 'hi'
                      ? `सटीक खेत स्थान सक्रिय है (${loc.accuracy_m ? `±${loc.accuracy_m}m सटीकता` : 'लाइव'})`
                      : lang === 'mr'
                      ? `अचूक शेत स्थान सक्रिय आहे (${loc.accuracy_m ? `±${loc.accuracy_m}m अचूकता` : 'थेट'})`
                      : `Farm microclimate GPS active (${loc.accuracy_m ? `±${loc.accuracy_m}m accuracy` : 'live'})`}
                  </span>
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {activeLat.toFixed(3)}°N, {activeLon.toFixed(3)}°E
                </span>
              </div>
            )}

            {gpsMessage && (
              <div className="mt-2 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center gap-1.5">
                <Info size={13} className="text-emerald-600 flex-shrink-0" />
                <span>{gpsMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Loading ─── */}
        {loading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        )}

        {/* ─── SECTION 1: Today's Weather ─── */}
        {!loading && weather && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
                <span>{t.todayWeather}</span>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-800 font-semibold lowercase bg-emerald-50 px-2 py-0.5 rounded text-[11px] normal-case">
                  {gpDetails.panchayatName}
                </span>
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">{t.source}</span>
            </div>

            {/* Main weather display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {getConditionIcon(weather.condition, 44)}
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {weather.temperature_max ?? '--'}°C
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {getConditionLabel(weather.condition, lang)}
                    {weather.temperature_min != null && ` · ${lang === 'en' ? 'Min' : 'न्यूनतम'} ${weather.temperature_min}°C`}
                  </div>
                </div>
              </div>

              {/* Rain forecast indicator */}
              <div className="text-right">
                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {weather.rainfall_mm > 0 ? `🌧️ ${weather.rainfall_mm} mm` : '☀️ शुष्क (Dry)'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">24-Hr Precipitation</div>
              </div>
            </div>

            {/* Weather metrics row */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-center border border-slate-100">
                <Droplets size={14} className="mx-auto text-blue-600 mb-0.5" />
                <div className="text-sm font-bold text-slate-900">{weather.rainfall_mm ?? 0} mm</div>
                <div className="text-[10px] text-slate-500 font-medium">{t.rain}</div>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-center border border-slate-100">
                <div className="text-[11px] mx-auto text-sky-600 font-bold mb-0.5">💧</div>
                <div className="text-sm font-bold text-slate-900">{weather.humidity_pct ?? '--'}%</div>
                <div className="text-[10px] text-slate-500 font-medium">{t.humidity}</div>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-center border border-slate-100">
                <Wind size={14} className="mx-auto text-slate-600 mb-0.5" />
                <div className="text-sm font-bold text-slate-900">{weather.wind_speed_kmh ?? '--'}</div>
                <div className="text-[10px] text-slate-500 font-medium">{t.wind} km/h</div>
              </div>
            </div>

            {/* View Full Forecast Link */}
            <button
              onClick={() => navigate('/app/farmer/forecast')}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{t.viewForecast}</span>
            </button>
          </div>
        )}

        {/* ─── SECTION 2: Action Card — What to do today ─── */}
        {!loading && advice && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${
            advice.risk_level === 'warning' ? 'border-amber-200 bg-amber-50/30' :
            advice.risk_level === 'critical' ? 'border-red-200 bg-red-50/30' :
            'border-emerald-200 bg-emerald-50/20'
          }`}>
            <div className="px-4 py-3">
              <h2 className="text-sm font-bold text-slate-800 mb-2">{t.actionTitle}</h2>

              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{advice.crop_emoji || '🌿'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">{advice.headline}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{advice.detail}</p>
                </div>
                <button
                  onClick={() => speak(`${advice.headline}. ${advice.detail}`)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center"
                  aria-label={t.listenBtn}
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>

            {/* Why button + expand */}
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="w-full px-4 py-2 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 border-t border-slate-100 transition-colors"
            >
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Info size={13} />
                {t.whyTitle}
              </span>
              {showWhy ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>
            {showWhy && advice.why_explanation && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                <p>{advice.why_explanation}</p>
              </div>
            )}

            {/* View All Advice */}
            <button
              onClick={() => navigate('/app/farmer/advisory')}
              className="w-full px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 border-t border-slate-100 flex items-center justify-center gap-1 transition-colors"
            >
              {t.viewAdvice}
            </button>
          </div>
        )}

        {/* ─── SECTION 3: Ask / Voice ─── */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-1">{t.askTitle}</h2>
            <p className="text-xs text-slate-500 mb-3">{t.askSub}</p>

            {/* Voice button */}
            <button
              onClick={() => navigate('/app/farmer/ask')}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors mb-3"
            >
              <Mic size={18} />
              {t.voiceBtn}
            </button>

            {/* Quick questions */}
            <div className="flex flex-wrap gap-2">
              {t.quickQ.map((q, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/app/farmer/ask', { state: { question: q } })}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── SECTION 4: Quick Links ─── */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/app/farmer/forecast')}
              className="bg-white rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50 transition-colors shadow-sm"
            >
              <CloudSun size={20} className="text-amber-500 mb-1" />
              <div className="text-xs font-bold text-slate-900">{t.next3days}</div>
              <div className="text-[10px] text-slate-500">{t.viewForecast}</div>
            </button>
            <button
              onClick={() => navigate('/app/farmer/crops')}
              className="bg-white rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="text-xl">🌾</span>
              <div className="text-xs font-bold text-slate-900 mt-0.5">{t.myCrops}</div>
              <div className="text-[10px] text-slate-500">
                {lang === 'en' ? 'Add & analyze' : lang === 'mr' ? 'जोडा आणि विश्लेषण' : 'जोड़ें व विश्लेषण'}
              </div>
            </button>
          </div>
        )}

        {/* ─── SECTION 5: Regional Weather & Animated Radar Map ─── */}
        {!loading && (
          <FarmerAnimatedWeatherMap
            lat={activeLat}
            lon={activeLon}
            panchayatName={gpDetails.panchayatName}
            districtName={gpDetails.districtName}
            lang={lang}
            selectedLocation={loc}
          />
        )}

        {/* Source Footer */}
        {!loading && (
          <div className="text-center pb-2">
            <span className="text-[10px] font-medium text-slate-400">
              {t.source} · {t.updatedAt}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
