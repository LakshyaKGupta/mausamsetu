import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Edit3, Clock, Leaf, MapPin,
  TrendingUp, Users, Send, AlertTriangle, RefreshCw,
  ChevronRight, Filter, Search
} from 'lucide-react'
import { advisoryApi } from '@/api/client'
import type { AdvisoryListItem, StatsResponse } from '@/types'
import { cn, confidenceLevel, cropEmoji, formatDate, statusLabel } from '@/lib/utils'
import { AdvisoryDetailModal } from '@/components/officer/AdvisoryDetailModal'

const OFFICER_ID = 1 // TODO: from auth context

export default function OfficerDashboard() {
  const [advisories, setAdvisories] = useState<AdvisoryListItem[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const [advData, statsData] = await Promise.all([
        advisoryApi.list({ status: filter !== 'all' ? filter : undefined }),
        advisoryApi.stats(),
      ])
      setAdvisories(advData)
      setStats(statsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [filter])

  const filtered = advisories.filter(
    (a) =>
      a.panchayat_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.crop.toLowerCase().includes(search.toLowerCase())
  )

  const handleReviewed = () => {
    setSelectedId(null)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow-green">
              <span className="text-white text-lg">🌦</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-900 text-base leading-tight">MausamSetu</h1>
              <p className="text-xs text-slate-400 font-medium">Officer Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: Clock, label: 'Advisory Queue', badge: stats?.pending_advisories },
            { icon: CheckCircle, label: 'Approved', badge: stats?.approved_today },
            { icon: Send, label: 'Sent to Farmers', badge: stats?.sent_today },
            { icon: MapPin, label: 'Panchayat Map' },
          ].map(({ icon: Icon, label, badge }) => (
            <button
              key={label}
              className={cn(
                'nav-item w-full text-left',
                label === 'Advisory Queue' && 'nav-item-active'
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Officer info */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 text-sm font-bold">RK</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Rajesh Sharma</p>
              <p className="text-xs text-slate-400">Nagpur Rural Block</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Advisory Review Queue</h2>
            <p className="text-slate-500 text-sm mt-1">AI-generated advisories awaiting your review</p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Panchayats', value: stats.total_panchayats, icon: MapPin, color: 'sky' },
              { label: 'Farmers', value: stats.total_farmers, icon: Users, color: 'brand' },
              { label: 'Pending Review', value: stats.pending_advisories, icon: Clock, color: 'earth', urgent: true },
              { label: 'Approved Today', value: stats.approved_today, icon: CheckCircle, color: 'brand' },
            ].map(({ label, value, icon: Icon, color, urgent }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'card-sm flex items-center gap-4',
                  urgent && value > 0 && 'border-earth-200 bg-earth-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  color === 'sky' && 'bg-sky-100',
                  color === 'brand' && 'bg-brand-100',
                  color === 'earth' && (urgent && value > 0 ? 'bg-earth-200' : 'bg-earth-100'),
                )}>
                  <Icon size={20} className={cn(
                    color === 'sky' && 'text-sky-600',
                    color === 'brand' && 'text-brand-600',
                    color === 'earth' && 'text-earth-600',
                  )} />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search panchayat or crop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
            {['pending', 'approved', 'sent', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  filter === s
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Advisory List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-500 font-medium">No advisories found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((advisory, i) => (
                <AdvisoryQueueRow
                  key={advisory.id}
                  advisory={advisory}
                  index={i}
                  onClick={() => setSelectedId(advisory.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Advisory Detail Modal */}
      {selectedId && (
        <AdvisoryDetailModal
          advisoryId={selectedId}
          officerId={OFFICER_ID}
          onClose={() => setSelectedId(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Advisory Queue Row
// ---------------------------------------------------------------------------

function AdvisoryQueueRow({
  advisory, index, onClick
}: {
  advisory: AdvisoryListItem
  index: number
  onClick: () => void
}) {
  const level = confidenceLevel(advisory.confidence_score)
  const pct = Math.round(advisory.confidence_score * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="card-sm hover:border-brand-200 hover:shadow-md cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        {/* Crop icon */}
        <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100">
          {cropEmoji(advisory.crop)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-slate-900 text-sm truncate">{advisory.panchayat_name}</p>
            <span className="text-slate-300">·</span>
            <p className="text-sm text-slate-500 capitalize">{advisory.crop}</p>
            {advisory.is_imd_fallback && (
              <span className="badge-yellow text-xs">IMD Fallback</span>
            )}
          </div>
          <p className="text-xs text-slate-400">{formatDate(advisory.advisory_date)}</p>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold',
            level === 'high' && 'confidence-high',
            level === 'medium' && 'confidence-medium',
            level === 'low' && 'confidence-low',
          )}>
            <TrendingUp size={12} />
            {pct}%
          </div>

          {/* Status badge */}
          <StatusBadge status={advisory.status} />

          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'badge-yellow',
    approved: 'badge-green',
    rejected: 'badge-red',
    sent: 'badge-blue',
    draft: 'badge-slate',
  }
  const labels: Record<string, string> = {
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected', sent: 'Sent', draft: 'Draft',
  }
  return (
    <span className={cn('badge text-xs', map[status] || 'badge-slate')}>
      {labels[status] || status}
    </span>
  )
}
