import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, MapPin, ChevronDown } from 'lucide-react'
import { PWAInstallBanner } from '../components/shared/PWAInstallBanner'
import { LocationSearchModal, type SelectedLocation } from '../components/farmer/LocationSearchModal'
import type { Language } from '../types'

import { resolvePanchayatDetails, type PanchayatDetails } from '../utils/panchayat'

export interface AppOutletContext {
  lang: Language
  setLang: (lang: Language) => void
  panchayatName: string
  blockName?: string
  districtName: string
  lgdCode?: string
  gpDetails?: PanchayatDetails
  userName: string
  selectedLocation?: SelectedLocation | null
  openLocationModal?: () => void
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'en', label: 'English' },
]

export const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Language state (persisted in localStorage)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  })

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem('mausamsetu_lang', newLang)
    window.dispatchEvent(new CustomEvent('mausamsetu_lang_change', { detail: newLang }))
  }

  // User selected location (can be any village, block, district across India)
  const [selectedLoc, setSelectedLoc] = useState<SelectedLocation | null>(() => {
    try {
      const stored = localStorage.getItem('mausamsetu_selected_location')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [showLocationModal, setShowLocationModal] = useState(false)

  // GPS can be requested from a Farmer page as well as the shared picker.
  // Keep the shell (navbar and every Outlet consumer) synchronized either way.
  useEffect(() => {
    const syncScope = (event: Event) => {
      const locationEvent = event as CustomEvent<SelectedLocation | undefined>
      const scope = locationEvent.detail
      if (!scope) return
      setSelectedLoc(scope)
      localStorage.setItem('mausamsetu_selected_location', JSON.stringify(scope))
    }
    window.addEventListener('mausamsetu_location_change', syncScope)
    return () => window.removeEventListener('mausamsetu_location_change', syncScope)
  }, [])

  const handleSelectLocation = (loc: SelectedLocation) => {
    const scope = { ...loc, source: loc.source || (loc.is_gps ? 'gps' : 'manual'), selected_at: loc.selected_at || new Date().toISOString() }
    setSelectedLoc(scope)
    localStorage.setItem('mausamsetu_selected_location', JSON.stringify(scope))
    window.dispatchEvent(new CustomEvent('mausamsetu_location_change', { detail: scope }))
  }

  // Parse logged in user details from localStorage
  const farmerData = JSON.parse(localStorage.getItem('mausamsetu_farmer') || '{}')
  const officerData = JSON.parse(localStorage.getItem('mausamsetu_officer') || '{}')
  const adminData = JSON.parse(localStorage.getItem('mausamsetu_admin') || '{}')
  const role =
    localStorage.getItem('mausamsetu_role') ||
    (location.pathname.includes('officer')
      ? 'officer'
      : location.pathname.includes('admin')
      ? 'admin'
      : 'farmer')

  // Dynamic user name
  const userName =
    farmerData.name ||
    officerData.name ||
    adminData.name ||
    (role === 'admin' ? 'District Admin' : role === 'officer' ? 'Field Officer' : 'Kisan')

  // Gram Panchayat details calculation
  const gpDetails = resolvePanchayatDetails(selectedLoc, farmerData, lang)
  let panchayatName = gpDetails.panchayatName
  let districtName = gpDetails.districtName
  let blockName = gpDetails.blockName

  if (role === 'officer' && !selectedLoc) {
    panchayatName = officerData.block || 'Location not selected'
  } else if (role === 'admin' && !selectedLoc) {
    panchayatName = adminData.district || (lang === 'en' ? 'All-India' : 'अखिल भारतीय')
  }

  // Translated location names for display with Gram Panchayat priority
  const getLocationDisplay = () => {
    if (role === 'admin') {
      const dist = selectedLoc?.district || adminData.district
      if (dist) {
        return `🇮🇳 ${dist} · ${lang === 'en' ? 'Administration' : 'प्रशासन'}`
      }
      return lang === 'en'
        ? `🇮🇳 All-India · Central Portal`
        : lang === 'mr'
        ? `🇮🇳 अखिल भारतीय · मध्यवर्ती पोर्टल`
        : `🇮🇳 अखिल भारतीय · केंद्रीय पोर्टल`
    }

    if (role === 'officer') {
      const b = selectedLoc?.block || selectedLoc?.name || officerData.block || 'Location not selected'
      const d = selectedLoc?.district || officerData.district || ''
      return lang === 'en' ? `Sub-Div: ${b} · ${d}` : `🏛️ उप-विभाग: ${b} · ${d}`
    }

    // Farmer role: Always prominently show Gram Panchayat
    return gpDetails.navLabel
  }

  const handleLogout = () => {
    localStorage.removeItem('mausamsetu_token')
    localStorage.removeItem('mausamsetu_officer')
    localStorage.removeItem('mausamsetu_farmer')
    localStorage.removeItem('mausamsetu_admin')
    localStorage.removeItem('mausamsetu_role')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col font-sans">
      {/* PWA Install Notification Banner (Dismissable, shown only if not installed) */}
      <PWAInstallBanner lang={lang} variant="banner" />

      {/* Location Search Modal across all India */}
      <LocationSearchModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleSelectLocation}
        currentLocation={selectedLoc}
        lang={lang}
      />

      {/* ── Single Unified Navigation Bar ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E2E8E4] sticky top-0 z-40 shadow-xs pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group focus:outline-none" aria-label="MausamSetu">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#126B3A] text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs group-hover:bg-[#0B4F2A] transition-colors flex-shrink-0">
                <svg viewBox="0 0 32 32" width="18" height="18" fill="none" aria-hidden="true" className="sm:w-5 sm:h-5">
                  <path
                    d="M5 22 Q5 10 16 10 Q27 10 27 22"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path d="M5 22 L5 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M27 22 L27 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="16" cy="17" r="2" fill="#86EFAC" />
                  <path
                    d="M16 19 L16 26"
                    stroke="#86EFAC"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="2 2"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg text-[#111814] tracking-tight leading-tight">
                  Mausam<span className="text-[#126B3A]">Setu</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] text-[#647067] font-medium leading-none">
                  {lang === 'hi' ? 'मौसमसेतु सेवा' : lang === 'mr' ? 'मौसमसेतू सेवा' : 'Weather Intelligence'}
                </span>
              </div>
            </Link>
          </div>

          {/* Location Badge (Clickable button to change location anywhere in India) */}
          <div className="flex items-center min-w-0">
            <button
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-[#166534] bg-[#F0FDF4] hover:bg-[#DCFCE7]/80 border border-[#DCFCE7] hover:border-[#86EFAC] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-2xs transition-all cursor-pointer group active:scale-95 text-left"
              title="स्थान बदलें (गाँव, ब्लॉक, ज़िला) / Change Location"
              aria-label="Change Location"
            >
              <MapPin size={12} className="text-[#126B3A] flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[80px] xs:max-w-[115px] sm:max-w-[200px]">{getLocationDisplay()}</span>
              <ChevronDown size={11} className="text-[#126B3A]/70 group-hover:text-[#126B3A] flex-shrink-0" />
            </button>
          </div>

          {/* Right Controls: Language Choice Switcher, User Profile & Logout */}
          <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">

            {/* Language Choice Switcher (Responsive short codes on mobile) */}
            <div className="flex items-center bg-[#F2F5F2] border border-[#E2E8E4] p-0.5 sm:p-1 rounded-lg sm:rounded-xl shadow-2xs">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`px-1.5 xs:px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all cursor-pointer min-h-[28px] flex items-center justify-center ${
                    lang === code
                      ? 'bg-[#126B3A] text-white shadow-xs font-bold'
                      : 'text-[#647067] hover:text-[#111814] hover:bg-white/60'
                  }`}
                  aria-label={`Switch language to ${label}`}
                >
                  <span className="sm:hidden">{code === 'hi' ? 'हिं' : code === 'mr' ? 'मरा' : 'EN'}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* User Name Pill */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#111814] bg-white border border-[#E2E8E4] px-3 py-1.5 rounded-xl shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-[#126B3A]/10 text-[#126B3A] flex items-center justify-center font-bold text-[10px]">
                {userName.charAt(0)}
              </div>
              <span className="truncate max-w-[120px]">{userName}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-transparent hover:border-red-200 transition-all cursor-pointer min-h-[28px] justify-center flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* App Body */}
      <main className="flex-1">
        <Outlet
          context={{
            lang,
            setLang: handleLanguageChange,
            panchayatName,
            blockName,
            districtName,
            lgdCode: gpDetails.lgdCode,
            gpDetails,
            userName,
            selectedLocation: selectedLoc,
            openLocationModal: () => setShowLocationModal(true),
          }}
        />
      </main>
    </div>
  )
}
