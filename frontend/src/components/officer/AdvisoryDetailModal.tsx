import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle, XCircle, Edit3, AlertTriangle,
  Thermometer, Droplets, Wind, Cloud, TrendingUp,
  Leaf, MapPin, Calendar, Info
} from 'lucide-react'
import { advisoryApi } from '@/api/client'
import type { Advisory } from '@/types'
import { cn, confidenceLevel, formatDate, cropEmoji, weatherEmoji } from '@/lib/utils'

interface Props {
  advisoryId: number
  officerId: number
  onClose: () => void
  onReviewed: () => void
}

export function AdvisoryDetailModal({ advisoryId, officerId, onClose, onReviewed }: Props) {
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedHi, setEditedHi] = useState('')
  const [editedEn, setEditedEn] = useState('')
  const [editedMr, setEditedMr] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'hindi' | 'english' | 'marathi'>('hindi')

  useEffect(() => {
    advisoryApi.get(advisoryId).then((data: Advisory) => {
      setAdvisory(data)
      setEditedHi(data.content_hi)
      setEditedEn(data.content_en)
      setEditedMr(data.content_mr || '')
      setLoading(false)
    })
  }, [advisoryId])

  const handleReview = async (action: 'approved' | 'modified' | 'rejected') => {
    setSubmitting(true)
    try {
      await advisoryApi.review(advisoryId, officerId, {
        action,
        note,
        ...(editing && {
          modified_content_hi: editedHi,
          modified_content_en: editedEn,
          modified_content_mr: editedMr,
        }),
      })
      onReviewed()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const level = advisory ? confidenceLevel(advisory.confidence_score) : 'medium'
  const pct = advisory ? Math.round(advisory.confidence_score * 100) : 0
  const weather = advisory?.weather_snapshot as Record<string, number> | undefined

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl border border-slate-100">
              {advisory ? cropEmoji(advisory.crop) : '🌱'}
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900">
                {advisory?.panchayat_name || '—'}
              </h3>
              <p className="text-sm text-slate-400 capitalize">{advisory?.crop}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : advisory ? (
          <div className="flex-1 overflow-y-auto">

            {/* Meta info strip */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {formatDate(advisory.advisory_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                Nagpur District
              </span>
              {advisory.is_imd_fallback && (
                <span className="flex items-center gap-1.5 text-earth-600 font-semibold">
                  <AlertTriangle size={12} />
                  IMD Fallback
                </span>
              )}
            </div>

            <div className="p-6 space-y-6">

              {/* Confidence score */}
              <div className={cn(
                'rounded-2xl p-4 border',
                level === 'high' && 'bg-brand-50 border-brand-100',
                level === 'medium' && 'bg-earth-50 border-earth-100',
                level === 'low' && 'bg-red-50 border-red-100',
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className={cn(
                      level === 'high' && 'text-brand-600',
                      level === 'medium' && 'text-earth-600',
                      level === 'low' && 'text-red-600',
                    )} />
                    <span className="text-sm font-semibold text-slate-700">ML Confidence Score</span>
                  </div>
                  <span className={cn(
                    'text-2xl font-display font-bold',
                    level === 'high' && 'text-brand-600',
                    level === 'medium' && 'text-earth-600',
                    level === 'low' && 'text-red-600',
                  )}>
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      level === 'high' && 'bg-brand-500',
                      level === 'medium' && 'bg-earth-500',
                      level === 'low' && 'bg-red-500',
                    )}
                  />
                </div>

                {level === 'high' && (
                  <p className="text-xs text-brand-600 font-medium mt-2">✓ Safe to approve with a single click</p>
                )}
                {level === 'medium' && (
                  <p className="text-xs text-earth-600 font-medium mt-2">⚠ Review content before approving</p>
                )}
                {level === 'low' && (
                  <p className="text-xs text-red-600 font-medium mt-2">⚡ IMD fallback served — verify with local data</p>
                )}
              </div>

              {/* Weather snapshot */}
              {weather && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Cloud size={15} />
                    Weather Data Used
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Thermometer, label: 'Max Temp', value: weather.temperature_max != null ? `${weather.temperature_max}°C` : '—' },
                      { icon: Thermometer, label: 'Min Temp', value: weather.temperature_min != null ? `${weather.temperature_min}°C` : '—' },
                      { icon: Droplets, label: 'Rainfall', value: weather.rainfall_mm != null ? `${weather.rainfall_mm} mm` : '—' },
                      { icon: Droplets, label: 'Humidity', value: weather.humidity_pct != null ? `${weather.humidity_pct}%` : '—' },
                      { icon: Wind, label: 'Wind', value: weather.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/h` : '—' },
                      { icon: Cloud, label: 'Cloud Cover', value: weather.cloud_cover_pct != null ? `${weather.cloud_cover_pct}%` : '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Icon size={12} />
                          <span className="text-xs">{label}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ML Explanation */}
              {advisory.ml_explanation && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Info size={12} /> ML Explanation
                  </h4>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Condition detected:</span>{' '}
                    <span className="capitalize">{String(advisory.ml_explanation.condition_detected).replace('_', ' ')}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{String(advisory.ml_explanation.confidence_basis)}</p>
                </div>
              )}

              {/* Advisory Content — Language Tabs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Leaf size={15} />
                    Advisory Content
                  </h4>
                  <button
                    onClick={() => setEditing(!editing)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                      editing
                        ? 'bg-earth-100 text-earth-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <Edit3 size={12} />
                    {editing ? 'Editing...' : 'Edit'}
                  </button>
                </div>

                {/* Language tabs */}
                <div className="flex gap-2 mb-3">
                  {(['hindi', 'english', 'marathi'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveTab(lang)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        activeTab === lang
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {lang === 'hindi' ? 'हिंदी' : lang === 'marathi' ? 'मराठी' : 'English'}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {editing ? (
                    <textarea
                      className="w-full p-4 text-sm text-slate-700 resize-none focus:outline-none devanagari"
                      rows={5}
                      value={
                        activeTab === 'hindi' ? editedHi
                          : activeTab === 'english' ? editedEn
                          : editedMr
                      }
                      onChange={(e) => {
                        if (activeTab === 'hindi') setEditedHi(e.target.value)
                        else if (activeTab === 'english') setEditedEn(e.target.value)
                        else setEditedMr(e.target.value)
                      }}
                    />
                  ) : (
                    <p className={cn(
                      'p-4 text-sm text-slate-700 leading-relaxed',
                      activeTab !== 'english' && 'devanagari'
                    )}>
                      {activeTab === 'hindi' ? advisory.content_hi
                        : activeTab === 'english' ? advisory.content_en
                        : (advisory.content_mr || 'Marathi translation not available.')}
                    </p>
                  )}
                </div>
              </div>

              {/* Officer note */}
              <div>
                <label className="label">Add a note (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Your note to be attached with this advisory..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Action footer */}
        {advisory && advisory.status === 'pending' && (
          <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleReview('rejected')}
                disabled={submitting}
                className="btn-danger flex-1"
              >
                <XCircle size={16} />
                Reject
              </button>
              {editing ? (
                <button
                  onClick={() => handleReview('modified')}
                  disabled={submitting}
                  className="btn-secondary flex-1"
                >
                  <Edit3 size={16} />
                  Save & Approve
                </button>
              ) : (
                <button
                  onClick={() => handleReview('approved')}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve Advisory
                </button>
              )}
            </div>
          </div>
        )}

        {/* Already reviewed */}
        {advisory && advisory.status !== 'pending' && advisory.status !== 'draft' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-500 text-center">
              This advisory is{' '}
              <span className="font-semibold text-slate-700 capitalize">{advisory.status}</span>
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
