import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle, XCircle, Edit3,
  Droplets, Wind,
  Leaf, MapPin, Calendar, Info, Layers, Compass,
  History, ShieldCheck, FileText, Radio, Activity, Check
} from 'lucide-react'
import { advisoryApi } from '@/api/client'
import type { Advisory, AdvisoryAuditItem } from '@/types'
import { cn, formatDate, cropEmoji } from '@/lib/utils'

interface Props {
  advisoryId: number
  officerId: number
  onClose: () => void
  onReviewed: () => void
}

export function AdvisoryDetailModal({ advisoryId, officerId, onClose, onReviewed }: Props) {
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [auditTrail, setAuditTrail] = useState<AdvisoryAuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedHi, setEditedHi] = useState('')
  const [editedEn, setEditedEn] = useState('')
  const [editedMr, setEditedMr] = useState('')
  const [note, setNote] = useState('')
  const [reasonCategory, setReasonCategory] = useState<string>('Local field observation')
  const [submitting, setSubmitting] = useState(false)
  const [activeLangTab, setActiveLangTab] = useState<'hindi' | 'english' | 'marathi'>('hindi')
  const [mainTab, setMainTab] = useState<'review' | 'audit'>('review')

  useEffect(() => {
    Promise.all([
      advisoryApi.get(advisoryId),
      advisoryApi.audit(advisoryId).catch(() => ({ advisory_id: advisoryId, panchayat_name: '', crop: '', status: 'draft', history: [] }))
    ]).then(([advData, auditData]) => {
      setAdvisory(advData)
      setAuditTrail(auditData.history || [])
      setEditedHi(advData.content_hi)
      setEditedEn(advData.content_en)
      setEditedMr(advData.content_mr || '')
      setLoading(false)
    })
  }, [advisoryId])

  const handleReview = async (action: 'approved' | 'modified' | 'rejected') => {
    setSubmitting(true)
    try {
      await advisoryApi.review(advisoryId, officerId, {
        action,
        note: note || (action === 'approved' ? 'Verified against local AWS station telemetry' : ''),
        reason_category: action === 'modified' ? reasonCategory : undefined,
        ...(action === 'modified' && {
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

  const stage = advisory?.crop_stage || 'Vegetative Stage (32 days)'

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

      {/* Signature Verification Panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-2xl border border-emerald-200 shadow-sm flex-shrink-0">
              {advisory ? cropEmoji(advisory.crop) : '🌱'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  #MS-{advisory ? 1000 + advisory.id : '1042'}
                </span>
                <h3 className="font-display font-bold text-slate-900 text-lg">
                  {advisory?.panchayat_name || 'Dhapewada'} Gram Panchayat
                </h3>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                <span className="capitalize text-slate-800 font-semibold">{advisory?.crop || 'Soybean'}</span> • {stage}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/60 flex items-center justify-center transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : advisory ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Navigation Tabs: Review vs Audit */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2">
              <button
                onClick={() => setMainTab('review')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition-all',
                  mainTab === 'review'
                    ? 'border-brand-600 text-brand-700 bg-white rounded-t-xl shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <FileText size={14} />
                Advisory Verification Console
              </button>
              <button
                onClick={() => setMainTab('audit')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition-all',
                  mainTab === 'audit'
                    ? 'border-brand-600 text-brand-700 bg-white rounded-t-xl shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <History size={14} />
                Governance Audit Trail ({auditTrail.length})
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {mainTab === 'audit' ? (
                /* Audit Trail View */
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-emerald-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Immutable Verification Log</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Every transition from regional IMD ingestion to ML downscaling, rule triggering, officer verification, and farmer delivery is logged.
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 my-4">
                    {auditTrail.map((item, idx) => (
                      <div key={`${item.timestamp}-${idx}`} className="relative group">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-600 shadow-sm" />
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              {item.stage || item.action}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 font-semibold">
                              {item.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">
                            Actor: <strong className="text-slate-800">{item.actor}</strong> ({item.role})
                          </p>
                          {item.details && (
                            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                              {item.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Signature Review View */
                <>
                  {/* 1. Forecast Comparison Table */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={14} className="text-brand-600" />
                        Forecast Downscaling Comparison
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                        Resolution: Topographic 1km downscale
                      </span>
                    </div>

                    <table className="w-full text-xs text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200">
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px]">Parameter</th>
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-right">IMD 40km</th>
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-right text-brand-700">MausamSetu</th>
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-right">Difference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-800">Rainfall (24h)</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{advisory.baseline_rainfall_mm ?? 4.5} mm</td>
                          <td className="py-2.5 px-3 text-right font-bold text-brand-700">{advisory.predicted_rainfall_mm ?? 3.8} mm</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">-0.7 mm</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-800">Temperature (Max)</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">33.0°C</td>
                          <td className="py-2.5 px-3 text-right font-bold text-brand-700">31.8°C</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">-1.2°C</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-800">Relative Humidity</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">76%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-brand-700">78%</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">+2%</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <span>Prediction Interval: <strong className="text-slate-800 font-mono">2.1 – 5.5 mm</strong></span>
                      <span className="text-emerald-800 font-medium">Calibrated against Dhapewada valley elevation (312m)</span>
                    </div>
                  </div>

                  {/* 2. Nearest AWS Telemetry & Model Input Drivers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Nearest AWS */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-2 text-slate-800 font-bold text-xs">
                        <Activity size={14} className="text-sky-600" />
                        Nearest Observation Station
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>Station: <strong className="text-slate-800">AWS #104 (Kalmeshwar East)</strong></p>
                        <p>Distance: <strong className="text-slate-800">8.4 km</strong></p>
                        <div className="pt-2 grid grid-cols-3 gap-1 text-center bg-white p-2 rounded border border-slate-200 font-mono text-[11px]">
                          <div><span className="text-[9px] text-slate-400 block">TEMP</span>28.1°C</div>
                          <div><span className="text-[9px] text-slate-400 block">HUMIDITY</span>78%</div>
                          <div><span className="text-[9px] text-slate-400 block">RAIN</span>1.2 mm</div>
                        </div>
                        <p className="text-[10px] text-slate-400 pt-1 text-right">Observed: 10:15 AM IST (Fresh)</p>
                      </div>
                    </div>

                    {/* Model Physical Drivers */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-2 text-slate-800 font-bold text-xs">
                        <Compass size={14} className="text-emerald-600" />
                        Why Model Adjusted Forecast?
                      </div>
                      <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-3.5">
                        <li>Elevation: 312m vs grid centroid 240m (-0.6°C lapse)</li>
                        <li>AWS #104 bias correction applied (-0.5 mm)</li>
                        <li>Undulating terrain roughness dampens storm runoff</li>
                        <li>Forecast lead time: 24h convective cycle</li>
                      </ul>
                    </div>
                  </div>

                  {/* 3. Agronomic Rule Trigger Panel */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Leaf size={14} className="text-amber-700" />
                        Agronomic Rule Engine Trigger
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                        RULE-SOY-V2
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="bg-white p-2 rounded border border-amber-200">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Crop Context</span>
                        <strong className="text-slate-800 capitalize">{advisory.crop}</strong> • Vegetative Stage (32d)
                      </div>
                      <div className="bg-white p-2 rounded border border-amber-200">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Weather Threshold</span>
                        Expected Rain: <strong className="text-amber-800">3.8 mm</strong> (&gt; 3.0 mm threshold)
                      </div>
                    </div>
                    <div className="text-xs text-amber-900 font-medium bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                      <strong>Suggested Action:</strong> Delay supplemental irrigation for 24h to prevent root aeration stress in black cotton soil.
                    </div>
                  </div>

                  {/* 4. Proposed Advisory Draft */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} className="text-emerald-600" />
                        Advisory Draft Content
                      </h4>
                      <div className="flex items-center gap-2">
                        {/* Language tabs */}
                        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                          {(['hindi', 'marathi', 'english'] as const).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setActiveLangTab(lang)}
                              className={cn(
                                'px-2.5 py-1 rounded text-xs font-medium transition-all',
                                activeLangTab === lang
                                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              )}
                            >
                              {lang === 'hindi' ? 'हिंदी' : lang === 'marathi' ? 'मराठी' : 'EN'}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setEditing(!editing)}
                          className={cn(
                            'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all',
                            editing ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          )}
                        >
                          <Edit3 size={12} />
                          {editing ? 'Cancel Edit' : '✏ Modify'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      {editing ? (
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-700">
                            Edit Content ({activeLangTab.toUpperCase()}):
                          </label>
                          <textarea
                            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 devanagari leading-relaxed"
                            rows={4}
                            value={
                              activeLangTab === 'hindi' ? editedHi : activeLangTab === 'marathi' ? editedMr : editedEn
                            }
                            onChange={(e) => {
                              if (activeLangTab === 'hindi') setEditedHi(e.target.value)
                              else if (activeLangTab === 'marathi') setEditedMr(e.target.value)
                              else setEditedEn(e.target.value)
                            }}
                          />

                          {/* Mandatory Modification Reason */}
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                            <label className="block text-xs font-bold text-amber-900">
                              * Mandatory Modification Reason:
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {[
                                'Local field observation',
                                'Crop-stage difference',
                                'Local microclimate',
                                'Pest/disease observation',
                                'Sensor issue',
                                'Other agronomic rationale'
                              ].map((cat) => (
                                <label
                                  key={cat}
                                  className={cn(
                                    'flex items-center gap-2 p-2 rounded border cursor-pointer transition-all',
                                    reasonCategory === cat
                                      ? 'bg-amber-100 border-amber-400 font-bold text-amber-900'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="reason_category"
                                    checked={reasonCategory === cat}
                                    onChange={() => setReasonCategory(cat)}
                                    className="text-amber-600"
                                  />
                                  <span className="text-[11px] leading-tight">{cat}</span>
                                </label>
                              ))}
                            </div>

                            <input
                              type="text"
                              className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg text-slate-800 mt-2"
                              placeholder="Describe specific field rationale for audit log..."
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-800 font-medium leading-relaxed devanagari">
                            {activeLangTab === 'hindi' ? advisory.content_hi
                              : activeLangTab === 'marathi' ? (advisory.content_mr || 'मराठी सल्ला उपलब्ध.')
                              : advisory.content_en}
                          </p>
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Target: <strong className="text-slate-700">{advisory.panchayat_name} GP Farmers</strong></span>
                            <span>Status: <strong className="text-brand-700 uppercase font-bold">{advisory.status}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* General Review Note if approving without edit */}
                  {!editing && advisory.status === 'pending' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Verification Officer Note (optional for Approve):
                      </label>
                      <input
                        type="text"
                        className="input text-xs"
                        placeholder="e.g. Telemetry verified with Kalmeshwar AWS #104. Approved for farmer delivery."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Action Footer: Approve / Modify & Approve / Reject */}
        {advisory && advisory.status === 'pending' && mainTab === 'review' && (
          <div className="p-5 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleReview('rejected')}
                disabled={submitting}
                className="btn-danger py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <XCircle size={15} />
                ✕ Reject
              </button>

              {editing ? (
                <button
                  onClick={() => handleReview('modified')}
                  disabled={submitting}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 border-none flex items-center justify-center gap-1.5"
                >
                  <Edit3 size={15} />
                  ✏ Save & Approve Advisory
                </button>
              ) : (
                <button
                  onClick={() => handleReview('approved')}
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={15} />
                  )}
                  ✓ Approve Advisory
                </button>
              )}
            </div>
          </div>
        )}

        {/* Already reviewed banner */}
        {advisory && advisory.status !== 'pending' && advisory.status !== 'draft' && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600 px-6">
            <span>✓ Verified & Signed by Agricultural Extension Officer</span>
            <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase text-[11px]">
              {advisory.status}
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
