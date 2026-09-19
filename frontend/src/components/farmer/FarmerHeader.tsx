import React from 'react'
import { Sprout, MapPin } from 'lucide-react'
import type { Language } from '@/types'
import { cn } from '@/lib/utils'

interface FarmerHeaderProps {
  currentLang: Language
  onLanguageChange: (lang: Language) => void
  panchayatName?: string
  districtName?: string
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'en', label: 'English' },
]

export const FarmerHeader: React.FC<FarmerHeaderProps> = ({
  currentLang,
  onLanguageChange,
  panchayatName = 'धापेवाड़ा',
  districtName = 'नागपुर',
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Gov Service Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Sprout size={22} className="text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-emerald-950 font-display">
                  MausamSetu
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  मौसमसेतु
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                पंचायत स्तरीय कृषि मौसम निर्णय सेवा
              </p>
            </div>
          </div>

          {/* Right Controls: Location & Language */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Location Pill */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
              <MapPin size={14} className="text-emerald-700" />
              <span>{panchayatName}, {districtName}</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => onLanguageChange(code)}
                  className={cn(
                    'px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                    currentLang === code
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                  aria-label={`Switch language to ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
