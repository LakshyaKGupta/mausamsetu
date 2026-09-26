import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Sprout,
  Plus,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Leaf,
  Droplets,
  Bug,
  Thermometer,
  X,
  Loader2,
  Trash2,
  MapPin
} from 'lucide-react'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import { farmerApi } from '@/api/client'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'
import { resolvePanchayatDetails } from '@/utils/panchayat'

const CROPS_KEY = 'mausamsetu_crops'

interface SavedCrop {
  id: string
  crop: string
  variety: string
  stage: string
  daysAfterSowing: number
  areaAcres: number
}

interface CropAnalysis {
  risks: { rainfall: string; temperature: string; pest: string }
  overall_risk: string
  advices: any[]
  weather_factors: any
}

const CROP_OPTIONS: Record<Language, { label: string; value: string }[]> = {
  hi: [
    { label: 'सोयाबीन (Soybean)', value: 'soybean' },
    { label: 'कपास (Cotton)', value: 'cotton' },
    { label: 'गेहूं (Wheat)', value: 'wheat' },
    { label: 'धान (Rice)', value: 'rice' },
    { label: 'चना (Gram)', value: 'gram' },
    { label: 'गन्ना (Sugarcane)', value: 'sugarcane' },
  ],
  mr: [
    { label: 'सोयाबीन (Soybean)', value: 'soybean' },
    { label: 'कापूस (Cotton)', value: 'cotton' },
    { label: 'गहू (Wheat)', value: 'wheat' },
    { label: 'भात (Rice)', value: 'rice' },
    { label: 'हरभरा (Gram)', value: 'gram' },
    { label: 'ऊस (Sugarcane)', value: 'sugarcane' },
  ],
  en: [
    { label: 'Soybean', value: 'soybean' },
    { label: 'Cotton', value: 'cotton' },
    { label: 'Wheat', value: 'wheat' },
    { label: 'Rice', value: 'rice' },
    { label: 'Gram (Chickpea)', value: 'gram' },
    { label: 'Sugarcane', value: 'sugarcane' },
  ],
}

const STAGE_OPTIONS: Record<Language, { label: string; value: string }[]> = {
  hi: [
    { label: 'अंकुरण (Germination)', value: 'germination' },
    { label: 'वानस्पतिक (Vegetative)', value: 'vegetative' },
    { label: 'फूल अवस्था (Flowering)', value: 'flowering' },
    { label: 'फल/दाना भरना (Fruiting)', value: 'fruiting' },
    { label: 'पकने की अवस्था (Maturity)', value: 'maturity' },
  ],
  mr: [
    { label: 'उगवणी (Germination)', value: 'germination' },
    { label: 'वनस्पतीजन्य (Vegetative)', value: 'vegetative' },
    { label: 'फुलोरा (Flowering)', value: 'flowering' },
    { label: 'फळधारणा (Fruiting)', value: 'fruiting' },
    { label: 'पक्वता (Maturity)', value: 'maturity' },
  ],
  en: [
    { label: 'Germination', value: 'germination' },
    { label: 'Vegetative', value: 'vegetative' },
    { label: 'Flowering', value: 'flowering' },
    { label: 'Fruiting/Grain Filling', value: 'fruiting' },
    { label: 'Maturity', value: 'maturity' },
  ],
}

const T: Record<Language, {
  title: string; subtitle: string; addCrop: string; noCrops: string;
  addCropTitle: string; cropLabel: string; varietyLabel: string;
  stageLabel: string; daysLabel: string; areaLabel: string;
  cancel: string; save: string; remove: string; loading: string;
  riskLabels: Record<string, string>; rainRisk: string; tempRisk: string;
  pestRisk: string; overallRisk: string; weatherBasis: string;
}> = {
  hi: {
    title: '🌾 मेरी फसलें',
    subtitle: 'फसल + मौसम विश्लेषण',
    addCrop: '+ फसल जोड़ें',
    noCrops: 'अभी कोई फसल नहीं जोड़ी गई। "फसल जोड़ें" बटन दबाएं।',
    addCropTitle: 'नई फसल जोड़ें',
    cropLabel: 'फसल',
    varietyLabel: 'किस्म (Variety)',
    stageLabel: 'अवस्था',
    daysLabel: 'बुआई के दिन',
    areaLabel: 'क्षेत्रफल (एकड़)',
    cancel: 'रद्द करें',
    save: 'जोड़ें',
    remove: 'हटाएं',
    loading: 'मौसम विश्लेषण...',
    riskLabels: { safe: '✅ सुरक्षित', warning: '⚠️ सतर्कता', critical: '🔴 गंभीर' },
    rainRisk: 'बारिश',
    tempRisk: 'तापमान',
    pestRisk: 'कीट',
    overallRisk: 'कुल जोखिम',
    weatherBasis: 'मौसम',
  },
  mr: {
    title: '🌾 माझी पिके',
    subtitle: 'पीक + हवामान विश्लेषण',
    addCrop: '+ पीक जोडा',
    noCrops: 'अजून कोणतेही पीक जोडले नाही. "पीक जोडा" बटन दाबा.',
    addCropTitle: 'नवीन पीक जोडा',
    cropLabel: 'पीक',
    varietyLabel: 'जात (Variety)',
    stageLabel: 'अवस्था',
    daysLabel: 'पेरणीचे दिवस',
    areaLabel: 'क्षेत्रफळ (एकर)',
    cancel: 'रद्द करा',
    save: 'जोडा',
    remove: 'काढा',
    loading: 'हवामान विश्लेषण...',
    riskLabels: { safe: '✅ सुरक्षित', warning: '⚠️ सतर्कता', critical: '🔴 गंभीर' },
    rainRisk: 'पाऊस',
    tempRisk: 'तापमान',
    pestRisk: 'कीड',
    overallRisk: 'एकूण धोका',
    weatherBasis: 'हवामान',
  },
  en: {
    title: '🌾 My Crops',
    subtitle: 'Crop + Weather Analysis',
    addCrop: '+ Add Crop',
    noCrops: 'No crops added yet. Tap "Add Crop" to get started.',
    addCropTitle: 'Add New Crop',
    cropLabel: 'Crop',
    varietyLabel: 'Variety',
    stageLabel: 'Growth Stage',
    daysLabel: 'Days After Sowing',
    areaLabel: 'Area (Acres)',
    cancel: 'Cancel',
    save: 'Add',
    remove: 'Remove',
    loading: 'Analyzing weather...',
    riskLabels: { safe: '✅ Safe', warning: '⚠️ Watch', critical: '🔴 Critical' },
    rainRisk: 'Rain',
    tempRisk: 'Temp',
    pestRisk: 'Pest',
    overallRisk: 'Overall',
    weatherBasis: 'Weather',
  },
}

function loadCrops(): SavedCrop[] {
  try {
    return JSON.parse(localStorage.getItem(CROPS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveCrops(crops: SavedCrop[]) {
  localStorage.setItem(CROPS_KEY, JSON.stringify(crops))
}

function riskBadgeClass(risk: string): string {
  if (risk === 'safe') return 'bg-emerald-100 text-emerald-800'
  if (risk === 'warning') return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

const CROP_EMOJIS: Record<string, string> = {
  soybean: '🫘', cotton: '🧶', wheat: '🌾', rice: '🍚', gram: '🫘', sugarcane: '🎋',
}

export default function FarmerMyCropsPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'
  const t = T[lang] || T.hi

  const [crops, setCrops] = useState<SavedCrop[]>(loadCrops())
  const [showAddModal, setShowAddModal] = useState(false)
  const [analyses, setAnalyses] = useState<Record<string, CropAnalysis>>({})
  const [loadingAnalysis, setLoadingAnalysis] = useState<Record<string, boolean>>({})
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null)

  // Add crop form state
  const [newCrop, setNewCrop] = useState('soybean')
  const [newVariety, setNewVariety] = useState('')
  const [newStage, setNewStage] = useState('vegetative')
  const [newDays, setNewDays] = useState('30')
  const [newArea, setNewArea] = useState('2')

  const farmerData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mausamsetu_farmer') || '{}')
    } catch { return {} }
  })()
  const gpDetails = resolvePanchayatDetails(outlet?.selectedLocation, farmerData, lang)

  const activeLat = outlet?.selectedLocation?.lat || 21.282
  const activeLon = outlet?.selectedLocation?.lon || 78.895
  const locationName = gpDetails.panchayatName

  // Fetch analysis for each crop
  const fetchAnalysis = async (crop: SavedCrop) => {
    setLoadingAnalysis((prev) => ({ ...prev, [crop.id]: true }))
    try {
      const res = await farmerApi.getCropAnalysis({
        lat: activeLat,
        lon: activeLon,
        crop: crop.crop,
        stage: crop.stage,
        days_after_sowing: crop.daysAfterSowing,
      })
      setAnalyses((prev) => ({ ...prev, [crop.id]: res }))
    } catch {
      /* ignore */
    } finally {
      setLoadingAnalysis((prev) => ({ ...prev, [crop.id]: false }))
    }
  }

  useEffect(() => {
    crops.forEach((c) => fetchAnalysis(c))
  }, [activeLat, activeLon])

  const handleAddCrop = () => {
    const crop: SavedCrop = {
      id: `crop_${Date.now()}`,
      crop: newCrop,
      variety: newVariety,
      stage: newStage,
      daysAfterSowing: parseInt(newDays) || 30,
      areaAcres: parseFloat(newArea) || 2,
    }
    const updated = [...crops, crop]
    setCrops(updated)
    saveCrops(updated)
    setShowAddModal(false)
    fetchAnalysis(crop)
    // Reset form
    setNewVariety('')
    setNewDays('30')
    setNewArea('2')
  }

  const handleRemoveCrop = (id: string) => {
    const updated = crops.filter((c) => c.id !== id)
    setCrops(updated)
    saveCrops(updated)
    setAnalyses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const cropOptions = CROP_OPTIONS[lang] || CROP_OPTIONS.en
  const stageOptions = STAGE_OPTIONS[lang] || STAGE_OPTIONS.en

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <FarmerNav lang={lang} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Header with Gram Panchayat Highlight */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
            <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1">
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                🏛️ {gpDetails.heroTitle}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">{gpDetails.districtName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">{t.subtitle}</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            {t.addCrop}
          </button>
        </div>

        {/* No Crops */}
        {crops.length === 0 && (
          <div className="py-12 text-center">
            <Sprout size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">{t.noCrops}</p>
          </div>
        )}

        {/* Crop Cards */}
        {crops.map((crop) => {
          const analysis = analyses[crop.id]
          const isLoading = loadingAnalysis[crop.id]
          const isExpanded = expandedCrop === crop.id
          const emoji = CROP_EMOJIS[crop.crop] || '🌿'
          const cropLabel = cropOptions.find((o) => o.value === crop.crop)?.label || crop.crop
          const stageLabel = stageOptions.find((o) => o.value === crop.stage)?.label || crop.stage

          return (
            <div key={crop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Crop Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">{cropLabel}</div>
                    <div className="text-xs text-slate-500">
                      {crop.variety && `${crop.variety} · `}
                      {stageLabel} · {crop.daysAfterSowing} {lang === 'en' ? 'days' : 'दिन'} · {crop.areaAcres} {lang === 'en' ? 'acres' : 'एकड़'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Overall Risk Badge */}
                  {analysis && (
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', riskBadgeClass(analysis.overall_risk))}>
                      {t.riskLabels[analysis.overall_risk]}
                    </span>
                  )}
                  {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                </div>
              </div>

              {/* Risk Indicators Row */}
              {analysis && (
                <div className="px-4 py-2 border-t border-slate-100 flex gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Droplets size={12} className="text-blue-500" />
                    <span className="font-medium text-slate-600">{t.rainRisk}:</span>
                    <span className={cn('font-bold', riskBadgeClass(analysis.risks.rainfall).replace('bg-', 'text-').replace('-100', '-800'))}>
                      {t.riskLabels[analysis.risks.rainfall]?.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Thermometer size={12} className="text-orange-500" />
                    <span className="font-medium text-slate-600">{t.tempRisk}:</span>
                    <span className={cn('font-bold', riskBadgeClass(analysis.risks.temperature).replace('bg-', 'text-').replace('-100', '-800'))}>
                      {t.riskLabels[analysis.risks.temperature]?.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Bug size={12} className="text-green-600" />
                    <span className="font-medium text-slate-600">{t.pestRisk}:</span>
                    <span className={cn('font-bold', riskBadgeClass(analysis.risks.pest).replace('bg-', 'text-').replace('-100', '-800'))}>
                      {t.riskLabels[analysis.risks.pest]?.split(' ')[0]}
                    </span>
                  </div>
                </div>
              )}

              {/* Expand/Collapse for Details */}
              <button
                onClick={() => setExpandedCrop(isExpanded ? null : crop.id)}
                className="w-full px-4 py-2 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 border-t border-slate-100 transition-colors"
              >
                <span className="text-xs font-bold text-slate-500">
                  {lang === 'en' ? 'Detailed Advice' : lang === 'mr' ? 'तपशीलवार सल्ला' : 'विस्तृत सलाह'}
                </span>
                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {/* Expanded Details */}
              {isExpanded && analysis && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                  {/* Weather factors */}
                  {analysis.weather_factors && (
                    <div className="text-xs text-slate-500 flex gap-3 flex-wrap mb-2">
                      <span>{t.weatherBasis}: {analysis.weather_factors.temperature_max}°C, {analysis.weather_factors.rainfall_mm} mm, {analysis.weather_factors.humidity_pct}%, {analysis.weather_factors.wind_speed_kmh} km/h</span>
                    </div>
                  )}

                  {/* Advice items */}
                  {analysis.advices?.map((adv: any, i: number) => {
                    const langKey = lang as string
                    const headline = adv.headline?.[langKey] || adv.headline?.en || ''
                    const detail = adv.detail?.[langKey] || adv.detail?.en || ''
                    return (
                      <div key={i} className="bg-white rounded-xl p-3 border border-slate-200">
                        <p className="text-xs font-bold text-slate-900">{headline}</p>
                        <p className="text-xs text-slate-600 mt-1">{detail}</p>
                      </div>
                    )
                  })}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveCrop(crop.id)}
                    className="w-full mt-2 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                    {t.remove}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{t.addCropTitle}</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Crop Select */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{t.cropLabel}</label>
                <select
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                >
                  {cropOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* Variety */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{t.varietyLabel}</label>
                <input
                  type="text"
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  placeholder="e.g. JS-335"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              {/* Stage */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{t.stageLabel}</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                >
                  {stageOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* Days + Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.daysLabel}</label>
                  <input
                    type="number"
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t.areaLabel}</label>
                  <input
                    type="number"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddCrop}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
