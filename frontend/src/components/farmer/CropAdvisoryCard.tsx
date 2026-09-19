import React, { useState } from 'react'
import { Volume2, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import type { Advisory, Language } from '@/types'
import { cropEmoji, cropLabel } from '@/lib/utils'

interface CropAdvisoryCardProps {
  advisories: Advisory[]
  lang: Language
  onSpeak: (text: string) => void
}

const ADVISORY_TEXT: Record<Language, {
  title: string
  todayAdvice: string
  moreDetails: string
  lessDetails: string
  officerVerified: string
  listen: string
  noAdvisory: string
  noAdvisorySub: string
  actionBadge: string
}> = {
  hi: {
    title: 'आज मुझे क्या करना चाहिए?',
    todayAdvice: 'आज की सलाह',
    moreDetails: 'अधिक जानकारी',
    lessDetails: 'कम जानकारी',
    officerVerified: 'अधिकारी द्वारा सत्यापित',
    listen: 'सुनें',
    noAdvisory: 'आज के लिए अधिकारी द्वारा सत्यापित सलाह उपलब्ध नहीं है।',
    noAdvisorySub: 'फसल प्रबंधन के संबंध में किसी भी प्रश्न के लिए नीचे बोलकर पूछें।',
    actionBadge: 'अनुशंसित कार्यवाही',
  },
  mr: {
    title: 'आज मी काय करावे?',
    todayAdvice: 'आजचा सल्ला',
    moreDetails: 'अधिक माहिती',
    lessDetails: 'कमी माहिती',
    officerVerified: 'अधिकाऱ्याकडून पडताळणीकृत',
    listen: 'ऐका',
    noAdvisory: 'आजसाठी अधिकाऱ्याकडून मंजूर सल्ला उपलब्ध नाही.',
    noAdvisorySub: 'पीक नियोजनासाठी खालील माईक बटण दाबून विचारा.',
    actionBadge: 'शिफारस केलेली कृती',
  },
  en: {
    title: 'What Should I Do Today?',
    todayAdvice: "Today's Action",
    moreDetails: 'More Details',
    lessDetails: 'Less Details',
    officerVerified: 'Officer Verified',
    listen: 'Listen',
    noAdvisory: 'No officer-verified advisory available for today.',
    noAdvisorySub: 'Use the voice assistant below to ask any crop-related questions.',
    actionBadge: 'Recommended Action',
  },
}

export const CropAdvisoryCard: React.FC<CropAdvisoryCardProps> = ({
  advisories,
  lang,
  onSpeak,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const t = ADVISORY_TEXT[lang] || ADVISORY_TEXT.hi

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t.title}
          </h3>
        </div>
      </div>

      {/* Advisory Content */}
      {advisories.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-1.5">
          <p className="text-sm font-semibold text-slate-700">
            {t.noAdvisory}
          </p>
          <p className="text-xs text-slate-500">
            {t.noAdvisorySub}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {advisories.map((advisory) => {
            const content =
              lang === 'hi' ? advisory.content_hi
              : lang === 'mr' ? (advisory.content_mr || advisory.content_hi)
              : advisory.content_en

            const isExpanded = expandedId === advisory.id

            return (
              <div
                key={advisory.id}
                className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 sm:p-5 space-y-3"
              >
                {/* Crop & Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label={advisory.crop}>
                      {cropEmoji(advisory.crop)}
                    </span>
                    <span className="text-base font-bold text-emerald-950">
                      {cropLabel(advisory.crop, lang)}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {t.actionBadge}
                  </span>
                </div>

                {/* Primary Action Advice */}
                <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                  {content}
                </p>

                {/* Expanded Details */}
                {isExpanded && advisory.officer_note && (
                  <div className="bg-white border border-emerald-200 p-3 rounded-lg text-xs text-slate-700 space-y-1 animate-fade-in">
                    <span className="font-bold text-slate-900 block">कृषि अधिकारी की अतिरिक्त टिप्पणी:</span>
                    <p>{advisory.officer_note}</p>
                  </div>
                )}

                {/* Controls & Trust Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSpeak(content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-100/50 active:scale-95 transition-all shadow-xs"
                      aria-label={`Read advisory aloud in ${lang}`}
                    >
                      <Volume2 size={15} />
                      <span>{t.listen}</span>
                    </button>

                    {advisory.officer_note && (
                      <button
                        onClick={() => toggleExpand(advisory.id)}
                        className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 px-2 py-1"
                      >
                        <span>{isExpanded ? t.lessDetails : t.moreDetails}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Subtle Trust Indicator */}
                  <div className="flex items-center gap-1 text-[11px] text-emerald-900 font-medium bg-emerald-100/80 px-2 py-0.5 rounded">
                    <CheckCircle size={13} className="text-emerald-700" />
                    <span>{t.officerVerified}</span>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
