import React from 'react'
import { MapPin, Calendar } from 'lucide-react'
import type { Language } from '@/types'
import { formatDate } from '@/lib/utils'

interface LocationBarProps {
  panchayatName: string
  blockName?: string
  districtName?: string
  dateStr?: string
  lang: Language
}

const LOCATION_TEXT: Record<Language, { gramPanchayat: string; today: string }> = {
  hi: { gramPanchayat: 'ग्राम पंचायत', today: 'आज' },
  mr: { gramPanchayat: 'ग्रामपंचायत', today: 'आज' },
  en: { gramPanchayat: 'Gram Panchayat', today: 'Today' },
}

export const LocationBar: React.FC<LocationBarProps> = ({
  panchayatName,
  blockName = 'कलमेश्वर',
  districtName = 'नागपुर',
  dateStr,
  lang,
}) => {
  const t = LOCATION_TEXT[lang] || LOCATION_TEXT.hi
  const formattedDate = dateStr ? formatDate(dateStr, lang) : '19 सितंबर 2026'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        
        {/* Location Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {panchayatName} {t.gramPanchayat}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {blockName}, {districtName}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Calendar size={14} className="text-slate-500" />
          <span>{t.today} · {formattedDate}</span>
        </div>

      </div>
    </div>
  )
}
