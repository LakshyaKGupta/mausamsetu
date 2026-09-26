import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, X, Check, Loader2, Sparkles, Navigation, LocateFixed, Clock, ShieldCheck, Compass } from 'lucide-react'
import { weatherApi } from '@/api/client'
import type { Language } from '@/types'

export interface SelectedLocation {
  id?: string
  name: string
  panchayat?: string
  panchayat_id?: number
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
  is_panchayat?: boolean
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
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(filtered.slice(0, 6)))
  } catch { /* ignore */ }
}

function getRecentLocations(): SelectedLocation[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_LOCATIONS_KEY) || '[]')
  } catch {
    return []
  }
}

// Official Maharashtra Gram Panchayats from Database
const PRESET_GRAM_PANCHAYATS: SelectedLocation[] = [
  { id: 'gp_1', name: 'Dhapewada', panchayat: 'Dhapewada', panchayat_id: 1, block: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra', lat: 21.282, lon: 78.895, elevation_m: 300, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Dhapewada · Kalmeshwar, Nagpur' },
  { id: 'gp_2', name: 'Mohpa', panchayat: 'Mohpa', panchayat_id: 2, block: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra', lat: 21.325, lon: 78.818, elevation_m: 320, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Mohpa · Kalmeshwar, Nagpur' },
  { id: 'gp_3', name: 'Ubali', panchayat: 'Ubali', panchayat_id: 3, block: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra', lat: 21.25, lon: 78.91, elevation_m: 310, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Ubali · Kalmeshwar, Nagpur' },
  { id: 'gp_4', name: 'Kalmeshwar', panchayat: 'Kalmeshwar', panchayat_id: 4, block: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra', lat: 21.2353, lon: 78.8617, elevation_m: 305, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Kalmeshwar · Kalmeshwar, Nagpur' },
  { id: 'gp_5', name: 'Bokhara', panchayat: 'Bokhara', panchayat_id: 5, block: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra', lat: 21.28, lon: 78.93, elevation_m: 330, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Bokhara · Kalmeshwar, Nagpur' },
  { id: 'gp_6', name: 'Ghoghali', panchayat: 'Ghoghali', panchayat_id: 6, block: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra', lat: 21.24, lon: 78.91, elevation_m: 315, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Ghoghali · Kalmeshwar, Nagpur' },
  { id: 'gp_7', name: 'Kalamna', panchayat: 'Kalamna', panchayat_id: 7, block: 'Nagpur Rural', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, elevation_m: 310, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Kalamna · Nagpur Rural' },
  { id: 'gp_9', name: 'Katol', panchayat: 'Katol', panchayat_id: 9, block: 'Katol', district: 'Nagpur', state: 'Maharashtra', lat: 21.2773, lon: 78.5782, elevation_m: 340, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Katol · Katol, Nagpur' },
  { id: 'gp_10', name: 'Ramtek', panchayat: 'Ramtek', panchayat_id: 10, block: 'Ramtek', district: 'Nagpur', state: 'Maharashtra', lat: 21.3974, lon: 79.324, elevation_m: 345, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Ramtek · Ramtek, Nagpur' },
  { id: 'gp_14', name: 'Hingna', panchayat: 'Hingna', panchayat_id: 14, block: 'Hingna', district: 'Nagpur', state: 'Maharashtra', lat: 21.0714, lon: 78.9418, elevation_m: 320, is_panchayat: true, display_label: '🏛️ ग्राम पंचायत Hingna · Hingna, Nagpur' },
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
  gpBadge: string
  blockLabel: string
  districtLabel: string
}> = {
  hi: {
    title: 'अपनी ग्राम पंचायत चुनें',
    subtitle: 'ग्राम पंचायत स्तर पर सटीक मौसम पूर्वानुमान एवं कृषि सलाह सेवा',
    liveGpsTitle: '🎯 लाइव जीपीएस से ग्राम पंचायत पहचानें',
    liveGpsSub: 'अपने खेत का लाइव स्थान देकर अपनी ग्राम पंचायत और सटीक मौसम तुरंत पाएं',
    gpsButton: '📍 मेरा लाइव स्थान पहचानें (Live GPS)',
    gpsSearching: 'आपकी ग्राम पंचायत पहचानी जा रही है...',
    gpsSuccess: 'ग्राम पंचायत पहचानी गई!',
    gpsDenied: 'स्थान अनुमति अस्वीकृत है। कृपया ब्राउज़र में जीपीएस चालू करें या नीचे ग्राम पंचायत चुनें।',
    gpsUnavailable: 'जीपीएस सिग्नल नहीं मिला। कृपया नीचे अपनी ग्राम पंचायत चुनें।',
    searchPlaceholder: 'ग्राम पंचायत, गाँव, ब्लॉक या ज़िला का नाम लिखें...',
    searching: 'ग्राम पंचायत खोजी जा रही है...',
    noResults: 'कोई ग्राम पंचायत नहीं मिली',
    noResultsHint: 'कृपया नाम की स्पेलिंग जांचें या नीचे दी गई सूची से ग्राम पंचायत चुनें।',
    recentTitle: 'हाल ही में चुनी गई ग्राम पंचायतें',
    presetsTitle: '🏛️ आधिकारिक ग्राम पंचायतें (LGD Panchayats)',
    close: 'बंद करें',
    searchResults: 'खोज परिणाम',
    orDivider: 'या नाम से खोजें',
    gpBadge: 'ग्राम पंचायत',
    blockLabel: 'ब्लॉक',
    districtLabel: 'ज़िला',
  },
  mr: {
    title: 'आपली ग्रामपंचायत निवडा',
    subtitle: 'ग्रामपंचायत पातळीवर अचूक हवामान अंदाज व कृषी सल्ला सेवा',
    liveGpsTitle: '🎯 थेट जीपीएसने ग्रामपंचायत ओळखा',
    liveGpsSub: 'आपल्या शेताचे थेट स्थान देऊन आपली ग्रामपंचायत व अचूक हवामान लगेच मिळवा',
    gpsButton: '📍 माझे थेट स्थान ओळखा (Live GPS)',
    gpsSearching: 'आपली ग्रामपंचायत ओळखत आहे...',
    gpsSuccess: 'ग्रामपंचायत ओळखली!',
    gpsDenied: 'स्थान परवानगी नाकारली. कृपया ब्राउझरमध्ये जीपीएस सुरू करा किंवा खाली ग्रामपंचायत निवडा.',
    gpsUnavailable: 'जीपीएस सिग्नल मिळाला नाही. कृपया खाली आपली ग्रामपंचायत निवडा.',
    searchPlaceholder: 'ग्रामपंचायत, गाव, तालुका किंवा जिल्ह्याचे नाव लिहा...',
    searching: 'ग्रामपंचायत शोधत आहे...',
    noResults: 'कोणतीही ग्रामपंचायत सापडली नाही',
    noResultsHint: 'कृपया स्पेलिंग तपासा किंवा खालील यादीतून ग्रामपंचायत निवडा.',
    recentTitle: 'अलीकडे निवडलेली ग्रामपंचायती',
    presetsTitle: '🏛️ अधिकृत ग्रामपंचायती (LGD Panchayats)',
    close: 'बंद करा',
    searchResults: 'शोध निकाल',
    orDivider: 'किंवा नावाने शोधा',
    gpBadge: 'ग्रामपंचायत',
    blockLabel: 'तालुका',
    districtLabel: 'जिल्हा',
  },
  en: {
    title: 'Select Gram Panchayat',
    subtitle: 'Hyper-local weather forecasting & advisory at Gram Panchayat level',
    liveGpsTitle: '🎯 Detect Gram Panchayat via Live GPS',
    liveGpsSub: 'Automatically link your farm GPS to your official Gram Panchayat',
    gpsButton: '📍 Detect My Live Location (Live GPS)',
    gpsSearching: 'Identifying your Gram Panchayat...',
    gpsSuccess: 'Gram Panchayat identified!',
    gpsDenied: 'Location permission denied. Please allow GPS or select your Gram Panchayat below.',
    gpsUnavailable: 'GPS signal unavailable. Please select your Gram Panchayat below.',
    searchPlaceholder: 'Search Gram Panchayat, village, block or district...',
    searching: 'Searching Gram Panchayats...',
    noResults: 'No Gram Panchayat found',
    noResultsHint: 'Check spelling or select an official Gram Panchayat from the list below.',
    recentTitle: 'Recently Selected Panchayats',
    presetsTitle: '🏛️ Official Gram Panchayats (LGD Database)',
    close: 'Close',
    searchResults: 'Search Results',
    orDivider: 'or search by typing',
    gpBadge: 'Gram Panchayat',
    blockLabel: 'Block',
    districtLabel: 'District',
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
          
          const gpName = res.panchayat || res.nearest_panchayat?.name || res.village || res.name || 'Dhapewada'
          const blockName = res.panchayat_block || res.taluka || 'Kalmeshwar'
          const districtName = res.panchayat_district || res.district || 'Nagpur'
          const stateName = res.state || 'Maharashtra'

          const loc: SelectedLocation = {
            id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: gpName,
            panchayat: gpName,
            panchayat_id: res.panchayat_id || res.nearest_panchayat?.id,
            block: blockName,
            district: districtName,
            state: stateName,
            lat: latitude,
            lon: longitude,
            elevation_m: res.elevation_m || 300,
            display_label: `🏛️ ग्रा.पं. ${gpName} · ${districtName}`,
            is_gps: true,
            is_panchayat: true,
            accuracy_m: Math.round(accuracy || 0),
            nearest_panchayat: gpName,
          }

          localStorage.setItem('mausamsetu_location_detected', 'true')
          setGpsSuccess(`${t.gpsSuccess}: ${gpName} (${districtName})`)
          
          setTimeout(() => {
            handleSelect(loc)
            setGpsLoading(false)
          }, 600)
        } catch (err) {
          console.error('Reverse geocode error:', err)
          const loc: SelectedLocation = {
            id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
            name: 'Dhapewada',
            panchayat: 'Dhapewada',
            panchayat_id: 1,
            block: 'Kalmeshwar',
            district: 'Nagpur',
            state: 'Maharashtra',
            lat: latitude,
            lon: longitude,
            display_label: '🏛️ ग्राम पंचायत: Dhapewada · Nagpur',
            is_gps: true,
            is_panchayat: true,
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

  // Debounced search for Gram Panchayats & locations
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
        const formatted = (res || []).map((r: any) => {
          const gpName = r.panchayat || r.name.replace(/^ग्रा\.पं\.\s*/, '')
          return {
            id: r.panchayat_id ? `gp_${r.panchayat_id}` : `geo_${r.lat}_${r.lon}`,
            name: gpName,
            panchayat: gpName,
            panchayat_id: r.panchayat_id,
            block: r.admin3 || '',
            district: r.admin2 || '',
            state: r.admin1 || '',
            lat: r.lat,
            lon: r.lon,
            elevation_m: r.elevation_m,
            is_panchayat: r.is_panchayat || !!r.panchayat,
            display_label: r.display_label || `🏛️ ग्राम पंचायत ${gpName} · ${r.admin2 || ''}`,
          }
        })
        setResults(formatted)
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
    if (loc.panchayat && currentLocation.panchayat) {
      return loc.panchayat.toLowerCase() === currentLocation.panchayat.toLowerCase()
    }
    return (
      Math.abs(loc.lat - currentLocation.lat) < 0.01 &&
      Math.abs(loc.lon - currentLocation.lon) < 0.01
    )
  }

  const LocationCard = ({ loc, compact }: { loc: SelectedLocation; compact?: boolean }) => {
    const selected = isSelected(loc)
    const displayName = loc.panchayat || loc.name
    return (
      <button
        onClick={() => handleSelect(loc)}
        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
          selected
            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              selected ? 'bg-emerald-700 text-white' : 'bg-emerald-100/80 text-emerald-800'
            }`}
          >
            {loc.is_gps ? <LocateFixed size={18} /> : <span className="text-base">🏛️</span>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded uppercase tracking-wider">
                {t.gpBadge}
              </span>
              {loc.is_gps && (
                <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-md">
                  GPS
                </span>
              )}
            </div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-black text-slate-900 truncate mt-0.5`}>
              {displayName}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {loc.block ? `${t.blockLabel}: ${loc.block}, ` : ''}
              {loc.district ? `${t.districtLabel}: ${loc.district}` : ''}
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
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs text-lg font-bold">
              🏛️
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

        {/* ─── PROMINENT HERO: Live GPS Location to Gram Panchayat Detection ─── */}
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
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400 text-xl">
                🏛️
              </div>
              <h3 className="text-sm font-bold text-slate-800">{t.noResults}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{t.noResultsHint}</p>
            </div>
          )}

          {/* Default view when not actively searching */}
          {query.trim().length < 2 && (
            <>
              {/* Recently Selected Gram Panchayats */}
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

              {/* Official Gram Panchayats List */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 px-1 mb-2">
                  <Sparkles size={12} className="text-emerald-600" />
                  <span>{t.presetsTitle}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_GRAM_PANCHAYATS.map((loc) => (
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
