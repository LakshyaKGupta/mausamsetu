import React, { useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import {
  Sprout, Plus, AlertTriangle, CheckCircle, ShieldCheck,
  ChevronRight, Calendar, Leaf, ArrowRight, Droplets
} from 'lucide-react'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { cropEmoji, cn } from '@/lib/utils'
import type { Language } from '@/types'

interface CropProfile {
  id: string
  crop: string
  variety: string
  stage: string
  daysAfterSowing: number
  areaAcres: number
  risks: {
    rainfall: 'safe' | 'warning' | 'critical'
    pest: 'safe' | 'warning' | 'critical'
    temperature: 'safe' | 'warning' | 'critical'
  }
  advisoryText: string
  officerApproved: boolean
}

export default function FarmerMyCropsPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'

  const [crops, setCrops] = useState<CropProfile[]>([
    {
      id: 'soybean-1',
      crop: 'सोयाबीन (Soybean)',
      variety: 'JS-335',
      stage: 'वानस्पतिक वृद्धि (Vegetative Stage)',
      daysAfterSowing: 32,
      areaAcres: 3.5,
      risks: {
        rainfall: 'safe',
        pest: 'warning',
        temperature: 'safe',
      },
      advisoryText: 'अगले 24 घंटों में 3.8 mm वर्षा संभावित है। सिंचाई टालें और तना मक्खी (Stem fly) के प्रकोप हेतु खेत की निगरानी रखें।',
      officerApproved: true,
    },
    {
      id: 'cotton-1',
      crop: 'कपास (Cotton)',
      variety: 'Bt Cotton RCH-2',
      stage: 'कलियां बनना (Square Formation)',
      daysAfterSowing: 45,
      areaAcres: 2.0,
      risks: {
        rainfall: 'safe',
        pest: 'safe',
        temperature: 'safe',
      },
      advisoryText: 'मिट्टी में पर्याप्त नमी है। फूल-कलियां बनते समय जलभराव न होने दें। जल निकासी नालियां खुली रखें।',
      officerApproved: true,
    },
    {
      id: 'wheat-1',
      crop: 'गेहूं (Wheat)',
      variety: 'GW-322',
      stage: 'बुवाई पूर्व तैयारी (Pre-Sowing)',
      daysAfterSowing: 0,
      areaAcres: 2.0,
      risks: {
        rainfall: 'safe',
        pest: 'safe',
        temperature: 'safe',
      },
      advisoryText: 'आगामी रबी हेतु खेत जुताई करें और गोबर की खाद या कम्पोस्ट मिलाएँ। बीजोपचार आवश्यक है।',
      officerApproved: true,
    },
  ])

  const [selectedCrop, setSelectedCrop] = useState<CropProfile>(crops[0])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCropName, setNewCropName] = useState('चना (Gram)')
  const [newVariety, setNewVariety] = useState('JG-11')
  const [newArea, setNewArea] = useState('2.5')

  const handleAddCrop = (e: React.FormEvent) => {
    e.preventDefault()
    const newEntry: CropProfile = {
      id: `crop-${Date.now()}`,
      crop: newCropName,
      variety: newVariety,
      stage: 'बुवाई तैयारी (Sowing Prep)',
      daysAfterSowing: 5,
      areaAcres: parseFloat(newArea) || 1.5,
      risks: { rainfall: 'safe', pest: 'safe', temperature: 'safe' },
      advisoryText: 'नवीन फसल जोड़ी गई। कृषि अधिकारी द्वारा अगले चक्र में सलाह जारी की जाएगी।',
      officerApproved: true,
    }
    setCrops([...crops, newEntry])
    setSelectedCrop(newEntry)
    setShowAddModal(false)
  }

  const getRiskBadge = (status: 'safe' | 'warning' | 'critical', label: string) => {
    if (status === 'critical') {
      return <span className="badge-red text-[11px] font-bold">⚠ {label}: उच्च जोखिम</span>
    }
    if (status === 'warning') {
      return <span className="badge-yellow text-[11px] font-bold">⚠ {label}: सतर्कता अपेक्षित</span>
    }
    return <span className="badge-green text-[11px] font-bold">✓ {label}: सामान्य</span>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 md:pb-8">
      <FarmerNav lang={lang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sprout className="text-emerald-700" size={24} />
              मेरी फसलें एवं अवस्था प्रबंधन (My Crops)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              फसल चक्र एवं अवस्था के आधार पर व्यक्तिगत मौसम जोखिम और वैज्ञानिक सलाह
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={15} />
            नई फसल जोड़ें
          </button>
        </div>

        {/* Crops Selector & Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Crop Cards List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              पंजीकृत फसलें ({crops.length})
            </h3>
            {crops.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCrop(c)}
                className={cn(
                  'p-4 rounded-2xl border cursor-pointer transition-all bg-white',
                  selectedCrop.id === c.id
                    ? 'border-brand-600 ring-2 ring-brand-100 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cropEmoji(c.crop)}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{c.crop}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">किस्म: {c.variety} • {c.areaAcres} एकड़</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={selectedCrop.id === c.id ? 'text-brand-600' : 'text-slate-300'} />
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {c.stage}
                  </span>
                  <span>{c.daysAfterSowing} दिन</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Selected Crop Intelligence Card */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">
                  {cropEmoji(selectedCrop.crop)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedCrop.crop}</h2>
                  <p className="text-xs text-slate-500">
                    किस्म: <strong className="text-slate-700">{selectedCrop.variety}</strong> • क्षेत्रफल: <strong className="text-slate-700">{selectedCrop.areaAcres} एकड़</strong> • बुवाई पश्चात: <strong className="text-slate-700">{selectedCrop.daysAfterSowing} दिन</strong>
                  </p>
                </div>
              </div>
              <span className="badge-green text-xs font-bold">
                सक्रिय फसल
              </span>
            </div>

            {/* Current Stage Timeline */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                फसल विकास अवस्था: {selectedCrop.stage}
              </span>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, (selectedCrop.daysAfterSowing / 90) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>बुवाई (0d)</span>
                <span>वानस्पतिक (30-45d)</span>
                <span>फूल/कलियां (60d)</span>
                <span>परिपक्वता (90-120d)</span>
              </div>
            </div>

            {/* Weather Risk Matrix */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                मौसम संवेदनशीलता एवं जोखिम मूल्यांकन (Weather Risk Matrix)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-xs font-medium text-slate-600 block">वर्षा जोखिम</span>
                  {getRiskBadge(selectedCrop.risks.rainfall, 'वर्षा')}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-xs font-medium text-slate-600 block">कीट/रोग जोखिम</span>
                  {getRiskBadge(selectedCrop.risks.pest, 'कीट')}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-xs font-medium text-slate-600 block">तापमान तनाव</span>
                  {getRiskBadge(selectedCrop.risks.temperature, 'तापमान')}
                </div>
              </div>
            </div>

            {/* Verified Agronomic Advisory for this Crop */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Leaf size={14} className="text-emerald-700" />
                  इस फसल हेतु आज की सत्यापित कृषि सलाह:
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle size={12} /> अधिकारी सत्यापित
                </span>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                {selectedCrop.advisoryText}
              </p>
            </div>
          </div>
        </div>

        {/* Add Crop Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-in">
              <h3 className="font-bold text-slate-900 text-base">खेत में नई फसल जोड़ें</h3>
              <form onSubmit={handleAddCrop} className="space-y-3 text-xs">
                <div>
                  <label className="label">फसल का नाम</label>
                  <select
                    className="input"
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                  >
                    <option value="चना (Gram)">चना (Gram)</option>
                    <option value="तूर / अरहर (Pigeon Pea)">तूर / अरहर (Pigeon Pea)</option>
                    <option value="संतरा (Nagpur Orange)">संतरा (Nagpur Orange)</option>
                    <option value="मक्का (Maize)">मक्का (Maize)</option>
                  </select>
                </div>
                <div>
                  <label className="label">किस्म (Variety)</label>
                  <input
                    className="input"
                    value={newVariety}
                    onChange={(e) => setNewVariety(e.target.value)}
                    placeholder="उदा. JG-11 / देसी"
                  />
                </div>
                <div>
                  <label className="label">रकबा / क्षेत्रफल (एकड़)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1 py-2"
                  >
                    रद्द करें
                  </button>
                  <button type="submit" className="btn-primary flex-1 py-2">
                    सुरक्षित करें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function getRiskBadge(level: 'safe' | 'warning' | 'critical', type: string) {
  if (level === 'safe') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
        <CheckCircle size={12} className="text-emerald-700" />
        अनुकूल (Normal)
      </span>
    )
  }
  if (level === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
        <AlertTriangle size={12} className="text-amber-700" />
        {type === 'कीट' ? 'मौसम आधारित जोखिम' : 'सावधानी (Watch)'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
      <AlertTriangle size={12} className="text-rose-700" />
      गंभीर (Critical Alert)
    </span>
  )
}
