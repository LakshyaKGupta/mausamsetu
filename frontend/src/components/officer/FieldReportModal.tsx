import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ClipboardCheck, AlertTriangle, MapPin, Leaf, Camera } from 'lucide-react'
import { fieldReportApi } from '@/api/client'
import type { PanchayatHierarchyItem } from '@/types'

interface Props {
  panchayats: PanchayatHierarchyItem[]
  onClose: () => void
  onCreated: () => void
}

export function FieldReportModal({ panchayats, onClose, onCreated }: Props) {
  const [panchayatId, setPanchayatId] = useState<number>(panchayats[0]?.id || 1)
  const [crop, setCrop] = useState('soybean')
  const [cropStage, setCropStage] = useState('Vegetative')
  const [category, setCategory] = useState('crop_stress')
  const [severity, setSeverity] = useState('medium')
  const [notes, setNotes] = useState('')
  const [actionRecommended, setActionRecommended] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) {
      setError('Please provide observation notes.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await fieldReportApi.create({
        officer_id: 1,
        panchayat_id: panchayatId,
        crop,
        crop_stage: cropStage,
        category,
        observation_type: category,
        severity,
        notes,
        observation_notes: notes,
        description: notes,
        action_recommended: actionRecommended || undefined,
      } as any)
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit field report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">File Extension Field Observation</h3>
                <p className="text-xs text-slate-500">Record ground reality for advisory calibration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gram Panchayat</label>
                <select
                  value={panchayatId}
                  onChange={(e) => setPanchayatId(Number(e.target.value))}
                  className="input w-full py-2 text-xs"
                >
                  {panchayats.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} GP
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Crop</label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="input w-full py-2 text-xs"
                >
                  <option value="soybean">Soybean (सोयाबीन)</option>
                  <option value="cotton">Cotton (कपास)</option>
                  <option value="wheat">Wheat (गेहूं)</option>
                  <option value="orange">Orange (संत्रा)</option>
                  <option value="chickpea">Chickpea (चना)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input w-full py-2 text-xs"
                >
                  <option value="crop_stress">Crop Stress / Wilting</option>
                  <option value="pest_disease">Pest / Disease Reported</option>
                  <option value="drainage">Field Drainage Blocked</option>
                  <option value="soil_moisture">Soil Moisture Anomaly</option>
                  <option value="aws_sensor_drift">AWS Sensor Discrepancy</option>
                  <option value="general">General Agronomic Inspection</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observed Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="input w-full py-2 text-xs"
                >
                  <option value="low">Low (Routine)</option>
                  <option value="medium">Medium (Watch Required)</option>
                  <option value="high">High (Advisory Update Needed)</option>
                  <option value="critical">Critical (Immediate Alert)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Field Observation Notes *</label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Inspected 4 farms in Dhapewada South: waterlogged furrows after night showers. Recommend pausing irrigation."
                className="input w-full p-2.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recommended Action (Optional)</label>
              <input
                type="text"
                value={actionRecommended}
                onChange={(e) => setActionRecommended(e.target.value)}
                placeholder="e.g. Issue emergency drainage alert for vegetative soybean"
                className="input w-full py-2 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                {submitting ? 'Submitting...' : 'Save Field Report'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
