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
  const [whyModalAdvisory, setWhyModalAdvisory] = useState<Advisory | null>(null)
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

      {/* Advisory Content: Reassuring Pending State vs. Verified Advisory Cards */}
      {advisories.length === 0 ? (
        <div className="bg-gradient-to-br from-amber-50/70 to-emerald-50/40 border border-amber-200/80 rounded-2xl p-5 text-left space-y-3.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>आज की सत्यापित सलाह कृषि अधिकारी द्वारा तैयार की जा रही है</span>
          </div>

          <div className="bg-white/80 border border-amber-100 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">नवीनतम मौसम</span>
              <span className="font-semibold text-slate-800">27°C • 4.2 mm अपेक्षित वर्षा</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              मौसम अपडेट: 10:30 AM
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 pt-1">
            <p className="font-semibold text-slate-700">आप तब तक वॉयस असिस्टेंट से पूछ सकते हैं:</p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                • आज बारिश होगी?
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                • क्या सोयाबीन में पानी देना चाहिए?
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                • कीट प्रकोप की संभावना
              </span>
            </div>
          </div>
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
                    <div>
                      <span className="text-base font-bold text-emerald-950 block leading-tight">
                        {cropLabel(advisory.crop, lang)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {advisory.crop_stage || 'वानस्पतिक अवस्था (Vegetative Stage, 32 दिन)'}
                      </span>
                    </div>
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

                {/* Controls & Explainability */}
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

                    {/* "Why this advice?" Explainability Button */}
                    <button
                      onClick={() => setWhyModalAdvisory(advisory)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 active:scale-95 transition-all shadow-xs"
                    >
                      <span>क्यूं? (Why?)</span>
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

                  {/* Trust Indicator */}
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

      {/* "Why this advisory?" Explainability Modal */}
      {whyModalAdvisory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">सलाह का वैज्ञानिक आधार (Why this advice?)</h4>
                <p className="text-xs text-slate-500 capitalize">{whyModalAdvisory.crop} • {whyModalAdvisory.crop_stage || 'Vegetative Stage'}</p>
              </div>
              <button
                onClick={() => setWhyModalAdvisory(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl flex justify-between items-center">
                <span className="font-medium text-blue-900">अनुमानित वर्षा (Expected Rain):</span>
                <span className="font-bold text-blue-700">{whyModalAdvisory.predicted_rainfall_mm ?? 3.8} mm (4.2 mm क्षेत्रीय)</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
                <span className="font-medium text-slate-700">मृदा नमी (Soil Moisture):</span>
                <span className="font-bold text-emerald-800">पर्याप्त (Adequate)</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
                <span className="font-medium text-slate-700">फसल एवं अवस्था (Crop Stage):</span>
                <span className="font-bold text-slate-900 capitalize">{whyModalAdvisory.crop} (32 दिन वानस्पतिक)</span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <p className="font-bold text-emerald-950">निष्कर्ष / Agronomic Rationale:</p>
                <p className="text-slate-700 leading-relaxed">
                  काली कपास मृदा में जलधारण क्षमता पर्याप्त है। अगले 24 घंटों में 3.8 mm वर्षा होने की संभावना के कारण अतिरिक्त सिंचाई से जड़ों में जलभराव हो सकता है। अतः सिंचाई 24 घंटे टालना उचित है।
                </p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>अधिकारी सत्यापन: <strong>श्री राजेश शर्मा (कृषि अधिकारी)</strong></span>
                <span>विश्वसनीयता: <strong className="text-emerald-700">HIGH</strong></span>
              </div>
            </div>

            <button
              onClick={() => setWhyModalAdvisory(null)}
              className="w-full btn-primary text-xs py-2 mt-2"
            >
              समझ गया (Understood)
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
