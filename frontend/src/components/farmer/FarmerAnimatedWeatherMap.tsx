import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CloudRain,
  Sun,
  Cloud,
  Droplets,
  Wind,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  Info
} from 'lucide-react'
import { weatherApi } from '@/api/client'
import type { Language } from '@/types'
import { resolvePanchayatDetails } from '@/utils/panchayat'

interface FarmerAnimatedWeatherMapProps {
  lat: number
  lon: number
  panchayatName?: string
  districtName?: string
  lang: Language
  selectedLocation?: any
}

interface HourlyForecastItem {
  time: string
  temperature_c: number | null
  humidity_pct: number | null
  precipitation_mm: number
  precipitation_probability_pct: number
  wind_speed_kmh: number | null
  wind_direction_deg: number | null
  weather_code: number
  condition: string
  condition_hi?: string
  condition_mr?: string
  condition_en?: string
  spray_advisory?: string
  irrigation_advisory?: string
}

const T: Record<Language, {
  title: string
  subtitle: string
  play: string
  pause: string
  reset: string
  timeline: string
  rainProb: string
  wind: string
  temp: string
  agroAdvice: string
  safeSpray: string
  avoidSpray: string
  radarPulse: string
  now: string
  todayEve: string
  tonight: string
  tmrwMorn: string
  tmrwNoon: string
  tmrwEve: string
  mapNote: string
}> = {
  hi: {
    title: '🏛️ ग्राम पंचायत मौसम व वर्षा मानचित्र',
    subtitle: 'समय के अनुसार बदलते मौसम का सजीव दृश्य (धूप, बादल, वर्षा)',
    play: 'शुरू करें (Play)',
    pause: 'रोकें (Pause)',
    reset: 'अभी (Now)',
    timeline: '36-घंटे का पूर्वानुमान टाइमलाइन',
    rainProb: 'बारिश की संभावना',
    wind: 'हवा की गति',
    temp: 'तापमान',
    agroAdvice: 'कृषि सुझाव',
    safeSpray: '✅ छिड़काव व खेत कार्य हेतु उपयुक्त',
    avoidSpray: '⚠️ बारिश का खतरा — छिड़काव रोकें',
    radarPulse: 'राडार रेंज: 15 किमी ग्रा.पं. परिधि',
    now: 'अभी',
    todayEve: 'आज शाम 5:00',
    tonight: 'आज रात 9:00',
    tmrwMorn: 'कल सुबह 7:00',
    tmrwNoon: 'कल दोपहर 1:00',
    tmrwEve: 'कल शाम 6:00',
    mapNote: 'स्लाइडर खिसकाएं या Play दबाएं — समय के अनुसार मौसम में बदलाव देखें',
  },
  mr: {
    title: '🏛️ ग्रामपंचायत हवामान व पाऊस नकाशा',
    subtitle: 'वेळेनुसार बदलणाऱ्या हवामानाचे थेट सजीव दृश्य (ऊन, ढग, पाऊस)',
    play: 'सुरू करा (Play)',
    pause: 'थांबवा (Pause)',
    reset: 'आत्ता (Now)',
    timeline: '36-तास अंदाज टाइमलाइन',
    rainProb: 'पावसाची शक्यता',
    wind: 'वाऱ्याचा वेग',
    temp: 'तापमान',
    agroAdvice: 'कृषी सल्ला',
    safeSpray: '✅ फवारणी व शेतीकामासाठी अनुकूल वेळ',
    avoidSpray: '⚠️ पावसाचा धोका — फवारणी टाळा',
    radarPulse: 'रडार कक्षा: 15 किमी ग्रा.पं. परिसर',
    now: 'आत्ता',
    todayEve: 'आज संध्याकाळी 5:00',
    tonight: 'आज रात्री 9:00',
    tmrwMorn: 'उद्या सकाळी 7:00',
    tmrwNoon: 'उद्या दुपारी 1:00',
    tmrwEve: 'उद्या संध्याकाळी 6:00',
    mapNote: 'स्लाइडर सरकवा किंवा Play दाबा — वेळेनुसार हवामानाचा बदल पहा',
  },
  en: {
    title: '🏛️ Gram Panchayat Weather & Radar Map',
    subtitle: 'Live visual forecast animation (Sun, Clouds, Rain timeline)',
    play: 'Play Forecast',
    pause: 'Pause',
    reset: 'Current Hour',
    timeline: '36-Hour Forecast Timeline',
    rainProb: 'Rain Probability',
    wind: 'Wind Speed',
    temp: 'Temperature',
    agroAdvice: 'Farm Action',
    safeSpray: '✅ Safe for spraying & fieldwork',
    avoidSpray: '⚠️ Rain risk — avoid spraying & fertilizing',
    radarPulse: 'Radar Radius: 15 km Gram Panchayat zone',
    now: 'Now',
    todayEve: 'Today 5 PM',
    tonight: 'Tonight 9 PM',
    tmrwMorn: 'Tmrw 7 AM',
    tmrwNoon: 'Tmrw 1 PM',
    tmrwEve: 'Tmrw 6 PM',
    mapNote: 'Drag slider or press Play to watch animated weather progression',
  },
}

function formatHourLabel(isoString: string, lang: Language): { main: string; relative: string; isNight: boolean } {
  try {
    const d = new Date(isoString)
    const h = d.getHours()
    const isNight = h < 6 || h >= 19
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12

    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    
    let dayWord = ''
    if (isToday) {
      dayWord = lang === 'en' ? 'Today' : 'आज'
    } else {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      if (d.toDateString() === tomorrow.toDateString()) {
        dayWord = lang === 'en' ? 'Tomorrow' : lang === 'mr' ? 'उद्या' : 'कल'
      } else {
        const days = lang === 'mr'
          ? ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरू', 'शुक्र', 'शनि']
          : lang === 'en'
          ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          : ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
        dayWord = days[d.getDay()]
      }
    }

    let timePeriod = ''
    if (h >= 4 && h < 12) {
      timePeriod = lang === 'en' ? 'Morning' : lang === 'mr' ? 'सकाळी' : 'सुबह'
    } else if (h >= 12 && h < 16) {
      timePeriod = lang === 'en' ? 'Afternoon' : lang === 'mr' ? 'दुपारी' : 'दोपहर'
    } else if (h >= 16 && h < 20) {
      timePeriod = lang === 'en' ? 'Evening' : lang === 'mr' ? 'संध्याकाळी' : 'शाम'
    } else {
      timePeriod = lang === 'en' ? 'Night' : lang === 'mr' ? 'रात्री' : 'रात'
    }

    const main = lang === 'en'
      ? `${dayWord} ${h12}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`
      : `${dayWord} ${timePeriod} ${h12}:${String(d.getMinutes()).padStart(2, '0')}`

    const relative = `${dayWord}, ${h12} ${ampm}`
    return { main, relative, isNight }
  } catch {
    return { main: isoString, relative: isoString, isNight: false }
  }
}

export const FarmerAnimatedWeatherMap: React.FC<FarmerAnimatedWeatherMapProps> = ({
  lat,
  lon,
  panchayatName,
  districtName,
  lang,
  selectedLocation,
}) => {
  const t = T[lang] || T.hi

  // Resolve GP naming
  const gpDetails = useMemo(() => {
    return resolvePanchayatDetails(selectedLocation, { panchayat: panchayatName, district: districtName }, lang)
  }, [selectedLocation, panchayatName, districtName, lang])

  // Hourly forecasts state
  const [forecasts, setForecasts] = useState<HourlyForecastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Map and Canvas references
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const playTimerRef = useRef<any>(null)

  // Rain particles system
  const particlesRef = useRef<Array<{ x: number; y: number; speed: number; length: number; opacity: number }>>([])

  // Fetch 36-hour real weather
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    weatherApi
      .getLiveHourly({
        lat,
        lon,
        mode: '1hr_1.5day',
        name: gpDetails.panchayatName,
      })
      .then((res: any) => {
        if (!isMounted) return
        const list: HourlyForecastItem[] = res.forecasts || []
        setForecasts(list)
        setCurrentIndex(0)
      })
      .catch((err) => {
        console.error('Failed to load live hourly forecasts for map:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [lat, lon, gpDetails.panchayatName])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    let map = mapInstanceRef.current
    let L: any = null

    const initMap = async () => {
      // @ts-ignore
      L = await import('leaflet')
      // @ts-ignore
      await import('leaflet/dist/leaflet.css')

      if (!mapContainerRef.current) return

      if (!map) {
        map = L.map(mapContainerRef.current, {
          center: [lat, lon],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: true,
          doubleClickZoom: false,
        })

        // Standard crisp OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
        }).addTo(map)

        // Custom Radar 5km & 10km & 15km GP Agro-Zone Circles
        L.circle([lat, lon], {
          radius: 4000,
          color: '#059669',
          fillColor: '#10B981',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(map)

        L.circle([lat, lon], {
          radius: 10000,
          color: '#3B82F6',
          fillColor: '#60A5FA',
          fillOpacity: 0.04,
          weight: 1,
          dashArray: '6, 6',
        }).addTo(map)

        // Gram Panchayat Center Pin Icon
        const gpIcon = L.divIcon({
          html: `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#047857;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;display:flex;align-items:center;gap:4px;">
              <span>🏛️</span>
              <span>${gpDetails.panchayatName}</span>
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #047857;"></div>
            <div style="width:10px;height:10px;background:#10B981;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #10B981;margin-top:-2px;" class="animate-ping"></div>
          </div>`,
          className: '',
          iconSize: [120, 40],
          iconAnchor: [60, 20],
        })

        L.marker([lat, lon], { icon: gpIcon }).addTo(map)
        mapInstanceRef.current = map
      } else {
        map.setView([lat, lon], 12)
      }

      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize()
      }, 150)
    }

    initMap().catch(console.error)

    return () => {
      // Keep map reference across re-renders
    }
  }, [lat, lon, gpDetails.panchayatName])

  // Playback loop
  useEffect(() => {
    if (isPlaying && forecasts.length > 0) {
      playTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= forecasts.length - 1) {
            return 0 // Loop back
          }
          return prev + 1
        })
      }, 1400)
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying, forecasts.length])

  const currentForecast = forecasts[currentIndex] || null
  const hourInfo = currentForecast
    ? formatHourLabel(currentForecast.time, lang)
    : { main: 'Loading...', relative: '', isNight: false }

  // Canvas weather animation: Rain, Sun rays, Clouds
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const width = (canvas.width = canvas.parentElement?.clientWidth || 400)
    const height = (canvas.height = canvas.parentElement?.clientHeight || 260)

    // Re-init particles for rain
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 70; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          speed: 4 + Math.random() * 6,
          length: 10 + Math.random() * 12,
          opacity: 0.3 + Math.random() * 0.5,
        })
      }
    }

    let sunAngle = 0
    let cloudOffset = 0

    const condition = currentForecast?.condition || 'sunny'
    const isRain = condition === 'rainy' || (currentForecast?.precipitation_mm || 0) > 0.1
    const isCloudy = condition === 'cloudy' || condition === 'partly_cloudy'
    const isSunny = !isRain && !isCloudy && !hourInfo.isNight

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 1. RAIN ANIMATION
      if (isRain) {
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 1.5
        for (const p of particlesRef.current) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - 3, p.y + p.length)
          ctx.globalAlpha = p.opacity
          ctx.stroke()

          p.y += p.speed
          p.x -= 1.2
          if (p.y > height) {
            p.y = -10
            p.x = Math.random() * (width + 50)
          }
        }
        ctx.globalAlpha = 1.0

        // Soft radar rainfall wash overlay
        const radGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2)
        radGrad.addColorStop(0, 'rgba(14, 165, 233, 0.18)')
        radGrad.addColorStop(0.7, 'rgba(2, 132, 199, 0.10)')
        radGrad.addColorStop(1, 'rgba(2, 132, 199, 0.0)')
        ctx.fillStyle = radGrad
        ctx.fillRect(0, 0, width, height)
      }

      // 2. SUNSHINE FLARE ANIMATION
      else if (isSunny) {
        sunAngle += 0.008
        const cx = width * 0.85
        const cy = 40

        // Warm radial glow
        const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180)
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.35)')
        glow.addColorStop(0.4, 'rgba(245, 158, 11, 0.15)')
        glow.addColorStop(1, 'rgba(245, 158, 11, 0.0)')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, width, height)

        // Shimmering light beams
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(sunAngle)
        ctx.strokeStyle = 'rgba(252, 211, 77, 0.25)'
        ctx.lineWidth = 2
        for (let i = 0; i < 8; i++) {
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(120, 0)
          ctx.stroke()
          ctx.rotate(Math.PI / 4)
        }
        ctx.restore()
      }

      // 3. CLOUDY / OVERCAST SHADOW DRIFT
      else if (isCloudy) {
        cloudOffset = (cloudOffset + 0.3) % width
        ctx.fillStyle = 'rgba(148, 163, 184, 0.12)'

        // Cloud puff 1
        ctx.beginPath()
        ctx.arc((cloudOffset + 50) % (width + 100) - 50, 60, 45, 0, Math.PI * 2)
        ctx.arc((cloudOffset + 80) % (width + 100) - 50, 50, 55, 0, Math.PI * 2)
        ctx.arc((cloudOffset + 120) % (width + 100) - 50, 65, 40, 0, Math.PI * 2)
        ctx.fill()

        // Cloud puff 2
        ctx.beginPath()
        ctx.arc((cloudOffset * 1.3 + 220) % (width + 140) - 70, 110, 50, 0, Math.PI * 2)
        ctx.arc((cloudOffset * 1.3 + 260) % (width + 140) - 70, 95, 60, 0, Math.PI * 2)
        ctx.fill()
      }

      // 4. NIGHT MOONLIGHT
      else if (hourInfo.isNight) {
        const nightGrad = ctx.createLinearGradient(0, 0, 0, height)
        nightGrad.addColorStop(0, 'rgba(15, 23, 42, 0.32)')
        nightGrad.addColorStop(1, 'rgba(30, 41, 59, 0.18)')
        ctx.fillStyle = nightGrad
        ctx.fillRect(0, 0, width, height)
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [currentForecast, hourInfo.isNight])

  // Quick jump presets
  const handleQuickJump = (targetHourDelta: number) => {
    setIsPlaying(false)
    const targetIdx = Math.min(Math.max(targetHourDelta, 0), forecasts.length - 1)
    setCurrentIndex(targetIdx)
  }

  // Condition icons & labels
  const conditionDisplay = useMemo(() => {
    if (!currentForecast) return { icon: '☀️', label: 'साफ मौसम', color: 'text-amber-600' }
    const c = currentForecast.condition
    const isRain = c === 'rainy' || (currentForecast.precipitation_mm || 0) > 0.1
    if (isRain) {
      const lbl = lang === 'en'
        ? `Rain (${currentForecast.precipitation_mm}mm)`
        : lang === 'mr'
        ? `पाऊस (${currentForecast.precipitation_mm} मिमी)`
        : `बारिश (${currentForecast.precipitation_mm} मिमी)`
      return { icon: '🌧️', label: lbl, color: 'text-blue-600', isRain: true }
    }
    if (c === 'cloudy') {
      const lbl = lang === 'en' ? 'Overcast Clouds' : lang === 'mr' ? 'दाट ढगाळ' : 'घने बादल'
      return { icon: '☁️', label: lbl, color: 'text-slate-600', isRain: false }
    }
    if (c === 'partly_cloudy') {
      const lbl = lang === 'en' ? 'Partly Cloudy' : lang === 'mr' ? 'अंशतः ढगाळ' : 'हल्के बादल व धूप'
      return { icon: '⛅', label: lbl, color: 'text-amber-700', isRain: false }
    }
    if (hourInfo.isNight) {
      const lbl = lang === 'en' ? 'Clear Night' : lang === 'mr' ? 'स्वच्छ रात्र' : 'साफ रात'
      return { icon: '🌙', label: lbl, color: 'text-indigo-600', isRain: false }
    }
    const lbl = lang === 'en' ? 'Sunny & Clear' : lang === 'mr' ? 'खिली धूप / स्वच्छ' : 'खिली धूप व साफ'
    return { icon: '☀️', label: lbl, color: 'text-amber-500', isRain: false }
  }, [currentForecast, lang, hourInfo.isNight])

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* ─── Card Header ─── */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base shadow-xs">
            🏛️
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{t.title}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                {gpDetails.panchayatName}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors"
          title={expanded ? 'Minimize' : 'Expand'}
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* ─── Map Canvas Container with Dynamic Animation ─── */}
      <div className="relative w-full overflow-hidden bg-slate-100" style={{ height: expanded ? '380px' : '260px' }}>
        {/* Leaflet map base */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Animation overlay canvas (Rain streaks, Sunrays, Clouds) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />

        {/* ─── Floating Forecast HUD (Top Overlay) ─── */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2 pointer-events-none">
          {/* Main Weather Pill */}
          <div className="bg-slate-900/85 backdrop-blur-md text-white rounded-2xl px-3 py-2 shadow-lg border border-white/15 pointer-events-auto flex items-center gap-2.5 max-w-[85%]">
            <span className="text-2xl animate-bounce" style={{ animationDuration: '3s' }}>
              {conditionDisplay.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white truncate">
                  {hourInfo.main}
                </span>
                {isPlaying && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded-md animate-pulse border border-emerald-500/40">
                    LIVE ▶
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-200 mt-0.5">
                <span className="font-bold text-amber-300">
                  {currentForecast?.temperature_c != null ? `${Math.round(currentForecast.temperature_c)}°C` : '--'}
                </span>
                <span>·</span>
                <span className="font-medium truncate">{conditionDisplay.label}</span>
                {currentForecast && currentForecast.precipitation_probability_pct > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-sky-300 font-bold flex items-center gap-0.5">
                      <Droplets size={10} />
                      {currentForecast.precipitation_probability_pct}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Gram Panchayat Badge */}
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-right pointer-events-auto hidden sm:block">
            <div className="text-[9px] font-bold uppercase text-emerald-700">ग्राम पंचायत</div>
            <div className="text-xs font-black text-slate-900">{gpDetails.panchayatName}</div>
          </div>
        </div>

        {/* ─── Agricultural Action Advice Overlay (Bottom of Map) ─── */}
        {currentForecast && (
          <div className="absolute bottom-2 left-3 right-3 z-20 pointer-events-none">
            <div className={`backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border text-xs font-semibold flex items-center gap-2 pointer-events-auto ${
              conditionDisplay.isRain
                ? 'bg-amber-900/90 text-amber-100 border-amber-500/40'
                : 'bg-emerald-950/85 text-emerald-100 border-emerald-500/30'
            }`}>
              {conditionDisplay.isRain ? (
                <>
                  <ShieldAlert size={14} className="text-amber-400 flex-shrink-0" />
                  <span className="truncate">{t.avoidSpray}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{t.safeSpray}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Interactive Time Scrubber & Controls ─── */}
      <div className="p-4 space-y-3 bg-white">
        {/* Play / Pause & Scrubber Bar */}
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all shadow-sm cursor-pointer flex-shrink-0 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
            }`}
            title={isPlaying ? t.pause : t.play}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Scrubber slider */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock size={11} className="text-emerald-600" />
                {t.timeline}
              </span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {hourInfo.relative}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(forecasts.length - 1, 0)}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false)
                setCurrentIndex(Number(e.target.value))
              }}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
          </div>

          {/* Reset to current hour */}
          <button
            onClick={() => {
              setIsPlaying(false)
              setCurrentIndex(0)
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title={t.reset}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Quick agricultural time jump pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => handleQuickJump(0)}
            className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentIndex === 0
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.now}
          </button>
          <button
            onClick={() => handleQuickJump(4)}
            className="px-2.5 py-1 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {t.todayEve}
          </button>
          <button
            onClick={() => handleQuickJump(8)}
            className="px-2.5 py-1 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {t.tonight}
          </button>
          <button
            onClick={() => handleQuickJump(14)}
            className="px-2.5 py-1 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {t.tmrwMorn}
          </button>
          <button
            onClick={() => handleQuickJump(19)}
            className="px-2.5 py-1 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {t.tmrwNoon}
          </button>
          <button
            onClick={() => handleQuickJump(24)}
            className="px-2.5 py-1 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {t.tmrwEve}
          </button>
        </div>

        {/* Explanatory footnote for farmer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Info size={11} className="text-emerald-600" />
            {t.mapNote}
          </span>
          <span className="font-semibold text-emerald-800">
            {t.radarPulse}
          </span>
        </div>
      </div>
    </div>
  )
}

// Keep FarmerLocationMap as an alias so any existing import does not break
export const FarmerLocationMap = FarmerAnimatedWeatherMap
