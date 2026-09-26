import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, X, Check, Loader2, Sparkles, Navigation, LocateFixed, Clock, ShieldCheck, Compass } from 'lucide-react'
import { weatherApi } from '@/api/client'
import type { Language } from '@/types'

export interface SelectedLocation {
  id?: string
  name: string
  block?: string
  district?: string
  state?: string
  lat: number
  lon: number
  elevation_m?: number
  display_label?: string
  is_gps?: boolean
  accuracy_m?: number
  nearest_panchayat?: string
}

interface LocationSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (loc: SelectedLocation) => void
  currentLocation?: SelectedLocation | null
  lang: Language
  autoAskGPS?: boolean
}

const RECENT_LOCATIONS_KEY = 'mausamsetu_recent_locations'

function saveRecentLocation(loc: SelectedLocation) {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) || '[]')
    const filtered = stored.filter((s: SelectedLocation) =>
      !(Math.abs(s.lat - loc.lat) < 0.01 && Math.abs(s.lon - loc.lon) < 0.01)
    )
    filtered.unshift(loc)
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(filtered.slice(0, 5)))
  } catch { /* ignore */ }
}

function getRecentLocations(): SelectedLocation[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) || '[]')
  } catch {
    return []
  }
}

const PRESET_LOCATIONS: SelectedLocation[] = [
  { id: 'p_1', name: 'Nagpur', block: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, elevation_m: 310, display_label: 'Nagpur · Vidarbha Region' },
  { id: 'd_nashik', name: 'Nashik', block: 'Nashik', district: 'Nashik', state: 'Maharashtra', lat: 19.9973, lon: 73.791, elevation_m: 584, display_label: 'Nashik · Grape & Onion Belt' },
  { id: 'd_pune', name: 'Baramati', block: 'Baramati', district: 'Pune', state: 'Maharashtra', lat: 18.1517, lon: 74.5771, elevation_m: 538, display_label: 'Baramati · Sugarcane Belt' },
  { id: 'd_amravati', name: 'Amravati', block: 'Amravati', district: 'Amravati', state: 'Maharashtra', lat: 20.9374, lon: 77.7796, elevation_m: 343, display_label: 'Amravati · Cotton Belt' },
  { id: 'd_kolhapur', name: 'Kolhapur', block: 'Karveer', district: 'Kolhapur', state: 'Maharashtra', lat: 16.705, lon: 74.2433, elevation_m: 569, display_label: 'Kolhapur · Sugarcane Hub' },
  { id: 'd_ludhiana', name: 'Ludhiana', block: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', lat: 30.901, lon: 75.8573, elevation_m: 256, display_label: 'Ludhiana · Wheat & Paddy' },
  { id: 'd_indore', name: 'Indore', block: 'Indore', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, elevation_m: 553, display_label: 'Indore · Soybean Region' },
  { id: 'd_karnal', name: 'Karnal', block: 'Karnal', district: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905, elevation_m: 252, display_label: 'Karnal · Basmati Rice Belt' },
]

const T: Record<Language, {
  title: string
  subtitle: string
  liveGpsTitle: string
  liveGpsSub: string
  gpsButton: string
  gpsSearching: string
  gpsSuccess: string
  gpsDenied: string
  gpsUnavailable: string
  searchPlaceholder: string
  searching: string
  noResults: string
  noResultsHint: string
  recentTitle: string
  presetsTitle: string
  close: string
  searchResults: string
  orDivider: string
  accuracyLabel: string
}> = {
  hi: {
    title: 'खेत का स्थान चुनें',
    subtitle: 'आपके गाँव और ग्राम पंचायत का सटीक मौसम पूर्वानुमान',
    liveGpsTitle: '🎯 लाइव जीपीएस स्थान पहचान (सुझाया गया)',
    liveGpsSub: 'अपने खेत का सटीक स्थान स्वतः पहचानें और तुरंत 1-घंटे का मौसम देखें',
    gpsButton: '📍 मेरा लाइव स्थान खोजें (Live GPS)',
    gpsSearching: 'खेत का सटीक जीपीएस स्थान खोज रहे हैं...',
    gpsSuccess: 'सटीक स्थान मिल गया!',
    gpsDenied: 'स्थान अनुमति अस्वीकृत है। कृपया ब्राउज़र में जीपीएस चालू करें या नीचे गाँव खोजें।',
    gpsUnavailable: 'जीपीएस सिग्नल नहीं मिला। कृपया दोबारा प्रयास करें या गाँव खोजें।',
    searchPlaceholder: 'गाँव, तालुका, ब्लॉक या ज़िला का नाम लिखें...',
    searching: 'स्थान खोजा जा रहा है...',
    noResults: 'कोई स्थान नहीं मिला',
    noResultsHint: 'कृपया नाम की स्पेलिंग जांचें या नजदीकी तालुका/ज़िला खोजें।',
    recentTitle: 'हाल ही में चुने गए स्थान',
    presetsTitle: 'प्रमुख कृषि क्षेत्र',
    close: 'बंद करें',
    searchResults: 'खोज परिणाम',
    orDivider: 'या नाम से खोजें',
    accuracyLabel: 'सटीकता',
  },
  mr: {
    title: 'शेताचे स्थान निवडा',
    subtitle: 'आपल्या गावाचे आणि ग्रामपंचायतीचे अचूक हवामान अंदाज',
    liveGpsTitle: '🎯 थेट जीपीएस स्थान ओळख (शिफारस केलेले)',
    liveGpsSub: 'आपल्या शेताचे अचूक स्थान स्वयंचलितपणे ओळखा आणि लगेच 1-तासाचे हवामान पहा',
    gpsButton: '📍 माझे थेट स्थान शोधा (Live GPS)',
    gpsSearching: 'शेताचे अचूक जीपीएस स्थान शोधत आहे...',
    gpsSuccess: 'अचूक स्थान सापडले!',
    gpsDenied: 'स्थान परवानगी नाकारली. कृपया ब्राउझरमध्ये जीपीएस सुरू करा किंवा खाली गाव शोधा.',
    gpsUnavailable: 'जीपीएस सिग्नल मिळाला नाही. कृपया पुन्हा प्रयत्न करा किंवा गाव शोधा.',
    searchPlaceholder: 'गाव, तालुका किंवा जिल्ह्याचे नाव लिहा...',
    searching: 'स्थान शोधत आहे...',
    noResults: 'कोणतेही स्थान सापडले नाही',
    noResultsHint: 'कृपया स्पेलिंग तपासा किंवा जवळचा तालुका/जिल्हा शोधा.',
    recentTitle: 'अलीकडे निवडलेली ठिकाणे',
    presetsTitle: 'प्रमुख कृषी क्षेत्रे',
    close: 'बंद करा',
    searchResults: 'शोध निकाल',
    orDivider: 'किंवा नावाने शोधा',
    accuracyLabel: 'अचूकता',
  },
  en: {
    title: 'Select Farm Location',
    subtitle: 'Hyper-local weather for your village and Gram Panchayat',
    liveGpsTitle: '🎯 Live GPS Location Detection (Recommended)',
    liveGpsSub: 'Automatically detect your farm location for instant hyper-local 1-hour forecasts',
    gpsButton: '📍 Detect My Live Location (Live GPS)',
    gpsSearching: 'Detecting farm GPS coordinates & village...',
    gpsSuccess: 'Location accurately detected!',
    gpsDenied: 'Location permission denied. Please allow GPS in your browser or search your village below.',
    gpsUnavailable: 'GPS signal unavailable. Please try again or search manually.',
    searchPlaceholder: 'Search village, taluka, block or district...',
    searching: 'Searching locations...',
    noResults: 'No locations found',
    noResultsHint: 'Check spelling or try searching for the nearby taluka or district.',
    recentTitle: 'Recently Selected',
    presetsTitle: 'Major Agricultural Hubs',
    close: 'Close',
    searchResults: 'Search Results',
    orDivider: 'or search by typing',
    accuracyLabel: 'Accuracy',
  },
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation,
  lang,
  autoAskGPS = false,
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SelectedLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [gpsSuccess, setGpsSuccess] = useState('')
  const [recentLocations, setRecentLocations] = useState<SelectedLocation[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const t = T[lang] || T.hi

  const handleSelect = useCallback((loc: SelectedLocation) => {
    saveRecentLocation(loc)
    onSelectLocation(loc)
    onClose()
  }, [onSelectLocation, onClose])

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError(t.gpsUnavailable)
      return
    }
    setGpsLoading(true)
    setGpsError('')
    setGpsSuccess('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        try {
          const res = await weatherApi.reverseGeocode(latitude, longitude, lang)
          
          const villageName = res.village || res.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          const talukaName = res.taluka || res.nearest_panchayat?.block || ''
          const districtName = res.district || res.nearest_panchayat?.district || ''
          const stateName = res.state || 'Maharashtra'

          const loc: SelectedLocation = {
            id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: villageName,
            block: talukaName,
            district: districtName,
            state: stateName,
            lat: latitude,
            lon: longitude,
            elevation_m: res.elevation_m,
            display_label: res.display_label || `${villageName}${talukaName ? `, ${talukaName}` : ''} · ${districtName}`,
            is_gps: true,
            accuracy_m: Math.round(accuracy || 0),
            nearest_panchayat: res.nearest_panchayat?.name,
          }

          localStorage.setItem('mausamsetu_location_detected', 'true')
          setGpsSuccess(`${t.gpsSuccess}: ${loc.name}${loc.district ? `, ${loc.district}` : ''}`)
          
          setTimeout(() => {
            handleSelect(loc)
            setGpsLoading(false)
          }, 600)
        } catch (err) {
          console.error('Reverse geocode error:', err)
          const loc: SelectedLocation = {
            id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: `Farm GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
            lat: latitude,
            lon: longitude,
            display_label: `Live Farm: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            is_gps: true,
            accuracy_m: Math.round(accuracy || 0),
          }
          localStorage.setItem('mausamsetu_location_detected', 'true')
          handleSelect(loc)
          setGpsLoading(false)
        }
      },
      (error) => {
        console.warn('Geolocation error:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError(t.gpsDenied)
        } else {
          setGpsError(t.gpsUnavailable)
        }
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [lang, t, handleSelect])

  useEffect(() => {
    if (isOpen) {
      setRecentLocations(getRecentLocations())
      setGpsError('')
      setGpsSuccess('')
      const alreadyDetected = localStorage.getItem('mausamsetu_location_detected')
      if (autoAskGPS || !alreadyDetected) {
        handleGPS()
      } else {
        setTimeout(() => inputRef.current?.focus(), 150)
      }
    } else {
      setQuery('')
      setResults([])
      setGpsError('')
      setGpsSuccess('')
      setGpsLoading(false)
    }
  }, [isOpen, autoAskGPS, handleGPS])

  // Debounced live search via Open-Meteo Geocoding
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await weatherApi.geocodeSearch(query.trim())
        const indiaResults = (res || [])
          .filter((r: any) => !r.country || r.country === 'India')
          .map((r: any) => ({
            id: `geo_${r.lat}_${r.lon}`,
            name: r.name,
            block: r.admin3 || '',
            district: r.admin2 || '',
            state: r.admin1 || '',
            lat: r.lat,
            lon: r.lon,
            elevation_m: r.elevation_m,
            display_label: `${r.name}${r.admin2 ? ` · ${r.admin2}` : ''}${r.admin1 ? `, ${r.admin1}` : ''}`,
          }))
        setResults(indiaResults)
      } catch (err) {
        console.error('Location search failed:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const isSelected = (loc: SelectedLocation) => {
    if (!currentLocation) return false
    return (
      Math.abs(loc.lat - currentLocation.lat) < 0.01 &&
      Math.abs(loc.lon - currentLocation.lon) < 0.01
    )
  }

  const LocationCard = ({ loc, compact }: { loc: SelectedLocation; compact?: boolean }) => {
    const selected = isSelected(loc)
    return (
      <button
        onClick={() => handleSelect(loc)}
        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
          selected
            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {loc.is_gps ? <LocateFixed size={16} /> : <Navigation size={15} />}
          </div>
          <div className="min-w-0">
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-slate-900 truncate flex items-center gap-1.5`}>
              <span>{loc.name}</span>
              {loc.is_gps && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                  GPS
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {loc.block ? `${loc.block}, ` : ''}
              {loc.district ? `${loc.district}, ` : ''}
              {loc.state || 'India'}
              {loc.accuracy_m && loc.accuracy_m > 0 && (
                <span className="text-[10px] text-emerald-600 font-medium ml-1.5">
                  (±{loc.accuracy_m}m)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {loc.elevation_m && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              🏔️ {Math.round(loc.elevation_m)}m
            </span>
          )}
          {selected && (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check size={14} />
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/90 to-teal-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Compass size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t.title}
              </h2>
              <p className="text-xs text-slate-600 font-medium">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            aria-label={t.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── PROMINENT HERO: Live GPS Location Detection (FIRST CHOICE) ─── */}
        <div className="p-4 bg-emerald-50/40 border-b border-emerald-100/70">
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold">
                  <LocateFixed size={18} className={gpsLoading ? "animate-spin text-emerald-600" : "text-emerald-700"} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {t.liveGpsTitle}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {t.liveGpsSub}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 cursor-pointer"
            >
              {gpsLoading ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  <span>{t.gpsSearching}</span>
                </>
              ) : (
                <>
                  <LocateFixed size={17} />
                  <span>{t.gpsButton}</span>
                </>
              )}
            </button>

            {/* GPS Feedback & Messages */}
            {gpsSuccess && (
              <div className="mt-2 p-2 bg-emerald-100 text-emerald-900 font-semibold text-xs rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <Check size={14} className="text-emerald-700 flex-shrink-0" />
                <span className="truncate">{gpsSuccess}</span>
              </div>
            )}
            {gpsError && (
              <div className="mt-2 p-2 bg-red-50 text-red-700 font-medium text-xs rounded-lg border border-red-200 animate-in fade-in">
                {gpsError}
              </div>
            )}
          </div>
        </div>

        {/* Divider with text */}
        <div className="relative px-6 py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center px-4">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t.orDivider}
          </span>
        </div>

        {/* Search Input for Manual Entry */}
        <div className="px-4 pb-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400 pointer-events-none" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/10 transition-all shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Loading search results */}
          {loading && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="animate-spin text-emerald-600" size={24} />
              <span className="text-xs font-semibold">{t.searching}</span>
            </div>
          )}

          {/* Search Results */}
          {!loading && query.trim().length >= 2 && results.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                {t.searchResults} ({results.length})
              </div>
              <div className="space-y-1.5">
                {results.map((loc) => (
                  <LocationCard key={loc.id || `${loc.lat}_${loc.lon}`} loc={loc} />
                ))}
              </div>
            </div>
          )}

          {/* No search results */}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <MapPin size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{t.noResults}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{t.noResultsHint}</p>
            </div>
          )}

          {/* Default view when not actively searching */}
          {query.trim().length < 2 && (
            <>
              {/* Recently Viewed Locations */}
              {recentLocations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                    <Clock size={12} />
                    <span>{t.recentTitle}</span>
                  </div>
                  <div className="space-y-1.5">
                    {recentLocations.map((loc) => (
                      <LocationCard key={loc.id || `rec_${loc.lat}_${loc.lon}`} loc={loc} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Major Agricultural Hub Presets */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>{t.presetsTitle}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_LOCATIONS.map((loc) => (
                    <LocationCard key={loc.id} loc={loc} compact />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
