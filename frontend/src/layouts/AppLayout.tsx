import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, MapPin } from 'lucide-react'
import { PWAInstallBanner } from '../components/shared/PWAInstallBanner'
import type { Language } from '../types'

export interface AppOutletContext {
  lang: Language
  setLang: (lang: Language) => void
  panchayatName: string
  districtName: string
  userName: string
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

  // Dynamic location
  let panchayatName = farmerData.panchayat || 'धापेवाड़ा'
  let districtName = farmerData.district || officerData.district || adminData.district || 'नागपुर'

  if (role === 'officer') {
    panchayatName = officerData.block || 'कलमेश्वर'
  } else if (role === 'admin') {
    panchayatName =
      lang === 'en' ? 'District HQ' : lang === 'mr' ? 'जिल्हा मुख्यालय' : 'ज़िला मुख्यालय'
  }

  // Translated location names for display
  const getLocationDisplay = () => {
    if (role === 'admin') {
      return lang === 'en'
        ? `Nagpur · District HQ`
        : lang === 'mr'
        ? `नागपूर · जिल्हा मुख्यालय`
        : `नागपुर · ज़िला मुख्यालय`
    }
    if (lang === 'en') {
      const p =
        farmerData.panchayat ||
        (role === 'officer' ? officerData.block || 'Kalmeshwar' : 'Dhapewada')
      const d = districtName === 'नागपुर' || !districtName ? 'Nagpur' : districtName
      return `${p}, ${d}`
    } else if (lang === 'mr') {
      const p =
        panchayatName === 'Dhapewada'
          ? 'धापेवाडा'
          : panchayatName === 'Kalmeshwar'
          ? 'कलमेश्वर'
          : panchayatName
      const d = districtName === 'Nagpur' ? 'नागपूर' : districtName
      return `${p}, ${d}`
    } else {
      // Hindi default
      const p =
        panchayatName === 'Dhapewada'
          ? 'धापेवाड़ा'
          : panchayatName === 'Kalmeshwar'
          ? 'कलमेश्वर'
          : panchayatName
      const d = districtName === 'Nagpur' ? 'नागपुर' : districtName
      return `${p}, ${d}`
    }
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

      {/* ── Single Unified Navigation Bar ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E2E8E4] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group focus:outline-none" aria-label="MausamSetu">
              <div className="w-9 h-9 rounded-xl bg-[#126B3A] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#0B4F2A] transition-colors">
                <svg viewBox="0 0 32 32" width="20" height="20" fill="none" aria-hidden="true">
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
                <span className="font-bold text-lg text-[#111814] tracking-tight leading-tight">
                  Mausam<span className="text-[#126B3A]">Setu</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] text-[#647067] font-medium leading-none">
                  {lang === 'hi' ? 'मौसमसेतु सेवा' : lang === 'mr' ? 'मौसमसेतू सेवा' : 'Weather Intelligence'}
                </span>
              </div>
            </Link>
          </div>

          {/* Location Badge */}
          <div className="flex items-center">
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#166534] bg-[#F0FDF4] border border-[#DCFCE7] px-3 py-1.5 rounded-xl shadow-2xs">
              <MapPin size={15} className="text-[#126B3A] flex-shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[240px]">{getLocationDisplay()}</span>
            </div>
          </div>

          {/* Right Controls: Install App Button, Language Choice Switcher & User Profile / Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Install PWA App Button */}
            <PWAInstallBanner lang={lang} variant="button" />

            {/* Language Choice Switcher */}
            <div className="flex items-center bg-[#F2F5F2] border border-[#E2E8E4] p-1 rounded-xl shadow-2xs">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    lang === code
                      ? 'bg-[#126B3A] text-white shadow-xs font-bold'
                      : 'text-[#647067] hover:text-[#111814] hover:bg-white/60'
                  }`}
                  aria-label={`Switch language to ${label}`}
                >
                  {label}
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
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-transparent hover:border-red-200 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* App Body */}
      <main className="flex-1">
        <Outlet context={{ lang, setLang: handleLanguageChange, panchayatName, districtName, userName }} />
      </main>
    </div>
  )
}
