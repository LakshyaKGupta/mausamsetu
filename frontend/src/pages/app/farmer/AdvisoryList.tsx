import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  CheckCircle, Volume2, Search, Filter, Calendar,
  ShieldCheck, Leaf, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { advisoryApi } from '@/api/client'
import type { Advisory, Language } from '@/types'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { cropEmoji, cropLabel, formatDate, cn } from '@/lib/utils'

export default function FarmerAdvisoryListPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'

  const [advisories, setAdvisories] = useState<Advisory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCrop, setFilterCrop] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [whyModalAdvisory, setWhyModalAdvisory] = useState<Advisory | null>(null)

  useEffect(() => {
    advisoryApi.getApprovedForPanchayat(1).then((data) => {
      setAdvisories(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  }

  const filtered = advisories.filter((a) => {
    const matchesCrop = filterCrop === 'all' || a.crop.toLowerCase() === filterCrop.toLowerCase()
    const content = lang === 'hi' ? a.content_hi : lang === 'mr' ? (a.content_mr || a.content_hi) : a.content_en
    const matchesSearch = !search || a.crop.toLowerCase().includes(search.toLowerCase()) || content.toLowerCase().includes(search.toLowerCase())
    return matchesCrop && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 md:pb-8">
      <FarmerNav lang={lang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="text-emerald-700" size={24} />
              सत्यापित कृषि सलाह अभिलेखागार (Advisories Archive)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              कृषि अधिकारियों द्वारा हस्ताक्षरित एवं जारी किए गए परामर्श
            </p>
          </div>
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
            धापेवाड़ा ग्राम पंचायत
          </span>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 text-xs"
              placeholder="फसल या सलाह में खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-white border border-slate-200 rounded-xl">
            {['all', 'soybean', 'cotton', 'wheat'].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCrop(c)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-all',
                  filterCrop === c ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {c === 'all' ? 'सभी फसलें' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Advisory List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
            <span className="text-4xl">🌾</span>
            <p className="font-bold text-slate-700 text-sm">इस चयन के लिए कोई पुरानी सलाह उपलब्ध नहीं है</p>
            <p className="text-xs text-slate-400">दैनिक सलाह कृषि अधिकारी द्वारा प्रत्येक प्रातः 09:30 AM पर प्रकाशित की जाती है।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((advisory) => {
              const content =
                lang === 'hi' ? advisory.content_hi
                : lang === 'mr' ? (advisory.content_mr || advisory.content_hi)
                : advisory.content_en

              const isExpanded = expandedId === advisory.id

              return (
                <div
                  key={advisory.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cropEmoji(advisory.crop)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base capitalize">
                            {cropLabel(advisory.crop, lang)}
                          </h3>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            #MS-{1000 + advisory.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDate(advisory.advisory_date)} • {advisory.crop_stage || 'Vegetative Stage'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="badge-green text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> अधिकारी सत्यापित
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {content}
                  </p>

                  {/* Expanded Officer Note */}
                  {isExpanded && advisory.officer_note && (
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs text-slate-700">
                      <strong className="text-emerald-950 block mb-0.5">कृषि अधिकारी की अतिरिक्त टिप्पणी:</strong>
                      <p>{advisory.officer_note}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speak(content)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Volume2 size={14} />
                        सुनें
                      </button>

                      <button
                        onClick={() => setWhyModalAdvisory(advisory)}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        क्यूं? (Why?)
                      </button>

                      {advisory.officer_note && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : advisory.id)}
                          className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 px-2 py-1"
                        >
                          {isExpanded ? 'कम विवरण' : 'अधिक विवरण'}
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400">
                      मॉडल विश्वसनीयता: <strong className="text-emerald-700">{advisory.reliability_tier || 'High'}</strong>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Explainability Modal */}
        {whyModalAdvisory && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">सलाह का वैज्ञानिक आधार</h4>
                  <p className="text-xs text-slate-500 capitalize">{whyModalAdvisory.crop} • {whyModalAdvisory.crop_stage || 'Vegetative Stage'}</p>
                </div>
                <button
                  onClick={() => setWhyModalAdvisory(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="bg-blue-50 p-2.5 rounded-xl flex justify-between">
                  <span>अनुमानित वर्षा:</span>
                  <span className="font-bold text-blue-700">{whyModalAdvisory.predicted_rainfall_mm ?? 3.8} mm (4.2 mm क्षेत्रीय)</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl flex justify-between">
                  <span>मृदा नमी:</span>
                  <span className="font-bold text-emerald-800">पर्याप्त (Adequate)</span>
                </div>
                <p className="bg-emerald-50/70 p-3 rounded-xl text-slate-800 border border-emerald-200">
                  काली कपास मिट्टी में जलधारण क्षमता अधिक है। 3.8 mm वर्षा होने पर अतिरिक्त सिंचाई से जड़ों में ऑक्सीजन की कमी हो सकती है। अतः सिंचाई टालने की सलाह दी गई है।
                </p>
              </div>

              <button
                onClick={() => setWhyModalAdvisory(null)}
                className="w-full btn-primary text-xs py-2"
              >
                समझ गया
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
