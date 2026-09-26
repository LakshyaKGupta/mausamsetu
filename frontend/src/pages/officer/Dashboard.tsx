import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Edit3, Clock, Leaf, MapPin,
  TrendingUp, Users, Send, AlertTriangle, RefreshCw,
  ChevronRight, Filter, Search, ShieldCheck, Activity,
  CloudRain, Wind, Droplets, Thermometer, Plus, FileText,
  Compass, Map as MapIcon, History, Radio, Layers, X, Download
} from 'lucide-react'
import { advisoryApi, officerApi, fieldReportApi, geographyApi } from '@/api/client'
import type {
  AdvisoryListItem,
  StatsResponse,
  OfficerBlockDashboard,
  FieldReport,
  PanchayatHierarchyItem
} from '@/types'
import { cn, confidenceLevel, cropEmoji, formatDate } from '@/lib/utils'
import { GramWeatherDemo } from '@/components/shared/GramWeatherDemo'
import { AdvisoryDetailModal } from '@/components/officer/AdvisoryDetailModal'
import { FieldReportModal } from '@/components/officer/FieldReportModal'
import { downloadSingleReportPDF, downloadAllReportsPDF } from '@/utils/pdfGenerator'

type SubView =
  | 'dashboard'
  | 'queue'
  | 'panchayats'
  | 'weather'
  | 'reports'
  | 'approved'
  | 'map'
  | 'audit'

export default function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState<SubView>('dashboard')
  const [advisories, setAdvisories] = useState<AdvisoryListItem[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [blockDashboard, setBlockDashboard] = useState<OfficerBlockDashboard | null>(null)
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([])
  const [panchayats, setPanchayats] = useState<PanchayatHierarchyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedPanchayat, setSelectedPanchayat] = useState<PanchayatHierarchyItem | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Current logged in officer identity (Rajesh Sharma, Kalmeshwar Block, Nagpur)
  const officerId = 1
  const blockName = 'Kalmeshwar'
  const districtName = 'Nagpur'
  const officerData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mausamsetu_officer') || '{}')
    } catch {
      return {}
    }
  })()
  const officerName = officerData.name || 'Rajesh Sharma'

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const [advData, statsData, dashData, reportsData, panchayatData] = await Promise.all([
        advisoryApi.list({ status: filter !== 'all' ? filter : undefined }),
        advisoryApi.stats(blockName),
        officerApi.getDashboard(officerId).catch(() => null),
        fieldReportApi.list({ block: blockName }).catch(() => []),
        geographyApi.getPanchayats(blockName).catch(() => []),
      ])
      setAdvisories(advData)
      setStats(statsData)
      setBlockDashboard(dashData)
      setFieldReports(reportsData)
      setPanchayats(panchayatData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  const filteredAdvisories = advisories.filter(
    (a) =>
      a.panchayat_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.crop.toLowerCase().includes(search.toLowerCase())
  )

  const handleReviewed = () => {
    setSelectedId(null)
    fetchData()
  }

  const subviewList: Array<{ id: SubView; label: string; icon: any; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: undefined },
    { id: 'queue', label: 'Advisory Queue', icon: Clock, badge: stats?.pending_advisories },
    { id: 'panchayats', label: 'Panchayats (24)', icon: MapPin, badge: undefined },
    { id: 'weather', label: 'Weather Watch', icon: CloudRain, badge: undefined },
    { id: 'reports', label: 'Field Reports', icon: FileText, badge: fieldReports.length || 3 },
    { id: 'approved', label: 'Approved Advisories', icon: CheckCircle, badge: stats?.approved_today },
    { id: 'map', label: 'Block Map', icon: MapIcon, badge: undefined },
    { id: 'audit', label: 'Audit Trail', icon: History, badge: undefined },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Subview Navigation Strip (< md) */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-14 z-30 shadow-2xs">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-bold">
              <Leaf size={15} />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs">Extension Console</span>
              <span className="text-[10px] text-emerald-700 ml-1.5 font-semibold">({blockName})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Rajesh S.</span>
          </div>
        </div>

        {/* Horizontal scrollable pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
          {subviewList.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              <Icon size={13} className={activeTab === id ? 'text-emerald-100' : 'text-slate-500'} />
              <span>{label}</span>
              {badge != null && badge > 0 && (
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.2 rounded-full',
                    activeTab === id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar Navigation (>= md) */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 sticky top-16 md:h-[calc(100vh-4rem)] flex-col flex-shrink-0 z-10 shadow-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
              <Leaf size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">Extension Console</h2>
              <p className="text-[11px] font-semibold text-emerald-700">{blockName} Block, Nagpur</p>
            </div>
          </div>
        </div>

        {/* 8 Primary Subviews */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {subviewList.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                activeTab === id
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon size={16} className={activeTab === id ? 'text-emerald-700' : 'text-slate-400'} />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && badge > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    id === 'queue' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Officer Badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
              RS
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-900 leading-tight">Rajesh Sharma</p>
              <p className="text-[11px] text-slate-500">Sr. Agricultural Officer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto">
        {/* Top Operational Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {blockName} Block Operations
              </span>
              <span className="text-xs text-slate-400">• Updated 10:30 AM IST</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-1 capitalize">
              {activeTab === 'dashboard' && 'Extension Operations Dashboard'}
              {activeTab === 'queue' && 'Advisory Verification Queue'}
              {activeTab === 'panchayats' && 'Jurisdiction Panchayats'}
              {activeTab === 'weather' && 'Local Weather Watch & Telemetry'}
              {activeTab === 'reports' && 'Field Extension Observations'}
              {activeTab === 'approved' && 'Verified Advisories Archive'}
              {activeTab === 'map' && 'Kalmeshwar Spatial Block Map'}
              {activeTab === 'audit' && 'Governance Audit Log'}
            </h1>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex-1 sm:flex-initial text-xs py-2 px-3 sm:px-3.5 flex items-center justify-center gap-1.5 shadow-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold transition-all min-h-[38px] whitespace-nowrap"
            >
              <Radio size={14} className="animate-pulse" />
              Emergency Broadcast
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 sm:flex-initial btn-primary text-xs py-2 px-3 sm:px-3.5 flex items-center justify-center gap-1.5 shadow-sm min-h-[38px] whitespace-nowrap"
            >
              <Plus size={14} />
              File Field Report
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
              Sync
            </button>
          </div>
        </div>

        {/* SUBVIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Operational Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Jurisdiction', val: `${blockName} Block`, sub: 'Nagpur Dist', color: 'slate', tab: undefined },
                { label: 'Panchayats', val: '24', sub: 'In Block', color: 'slate', tab: 'panchayats' },
                { label: 'Farmers', val: '1,842', sub: 'Registered', color: 'slate', tab: undefined },
                { label: 'Active Crops', val: '5', sub: 'Soybean, Cotton..', color: 'slate', tab: undefined },
                { label: 'Pending Review', val: stats?.pending_advisories ?? 2, sub: 'Immediate Action', color: 'amber', tab: 'queue' },
                { label: 'Approved Today', val: stats?.approved_today ?? 22, sub: 'Disseminated', color: 'emerald', tab: 'approved' },
                { label: 'Field Reports', val: fieldReports.length || 3, sub: 'On Record', color: 'sky', tab: 'reports' },
              ].map(({ label, val, sub, color, tab }) => (
                <div
                  key={label}
                  onClick={() => tab && setActiveTab(tab as any)}
                  className={cn(
                    'bg-white border rounded-xl p-3.5 shadow-xs transition-all',
                    tab && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
                    color === 'amber' ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                  )}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{label}</span>
                  <span className={cn('text-xl font-bold font-display', color === 'amber' ? 'text-amber-800' : 'text-slate-900')}>
                    {val}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{sub}</span>
                </div>
              ))}
            </div>

            {/* Priority Actions & Weather Watch Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    Priority Actions Required
                  </h3>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {stats?.pending_advisories ?? 2} Pending
                  </span>
                </div>
                <div className="space-y-3">
                  <div
                    onClick={() => setActiveTab('queue')}
                    className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          HIGH
                        </span>
                        <strong className="text-xs text-amber-950 font-bold">
                          {stats?.pending_advisories ?? 2} Advisories Require Review
                        </strong>
                      </div>
                      <p className="text-[11px] text-amber-900 mt-1">
                        Dhapewada (Soybean) and Ubali (Cotton) downscaled forecasts awaiting verification.
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-amber-700 flex-shrink-0" />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          MEDIUM
                        </span>
                        <strong className="text-xs text-slate-900 font-bold">
                          1 Panchayat With Stale Observation
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Telgaon GP observation delayed by 3.5h. Defaulting to AWS #104 proxy.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">AWS #104 Proxy</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('reports')}
                    className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-sky-100/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-sky-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          FIELD
                        </span>
                        <strong className="text-xs text-sky-950 font-bold">
                          3 Extension Field Reports Recorded
                        </strong>
                      </div>
                      <p className="text-[11px] text-sky-900 mt-1">
                        Recent field observations regarding waterlogged furrows and stem fly watch.
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-sky-700 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Weather Watch */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CloudRain size={16} className="text-sky-600" />
                    Block Weather Watch
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">Live Convective Radar</span>
                </div>
                <div className="space-y-3">
                  {(blockDashboard?.weather_watch_alerts || []).map((w, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-xl border text-xs',
                        w.severity === 'warning' ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className={w.severity === 'warning' ? 'text-amber-900 font-bold' : 'text-slate-800 font-bold'}>
                          {w.type}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-semibold">{w.panchayats.join(', ')}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{w.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Queue Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Advisories Awaiting Your Review</h3>
                  <p className="text-xs text-slate-500">Review downscaled adjustments before dissemination</p>
                </div>
                <button
                  onClick={() => setActiveTab('queue')}
                  className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
                >
                  View All in Queue <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {filteredAdvisories.slice(0, 3).map((advisory, i) => (
                  <AdvisoryRow
                    key={advisory.id}
                    advisory={advisory}
                    onReview={() => setSelectedId(advisory.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 2: ADVISORY QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 w-full max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9 text-xs w-full py-2"
                  placeholder="Filter by panchayat or crop..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['pending', 'approved', 'sent', 'all'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                      filter === s
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAdvisories.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-slate-500 font-semibold text-sm">No advisories matching current filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAdvisories.map((advisory) => (
                  <AdvisoryRow
                    key={advisory.id}
                    advisory={advisory}
                    onReview={() => setSelectedId(advisory.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 3: PANCHAYATS VIEW */}
        {activeTab === 'panchayats' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Jurisdiction Panchayats (24 Gram Panchayats)</h3>
                <p className="text-xs text-slate-500">Telemetry status and registered farmers in {blockName} block</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                23/24 Fresh Telemetry
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Gram Panchayat</th>
                    <th className="p-3">Elevation</th>
                    <th className="p-3">Farmers</th>
                    <th className="p-3">Primary Crops</th>
                    <th className="p-3">Data Freshness</th>
                    <th className="p-3">Last Sync</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {panchayats.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.name} GP</td>
                      <td className="p-3 text-slate-600">{p.elevation_m || 312} m</td>
                      <td className="p-3 font-semibold text-slate-800">{p.registered_farmers ?? 84}</td>
                      <td className="p-3 text-slate-600 capitalize">{(p.primary_crops || ['Soybean', 'Cotton']).join(', ')}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            (p.telemetry_status || 'FRESH') === 'FRESH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {p.telemetry_status || 'FRESH'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{p.last_sync || '10:30 AM'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedPanchayat(p)}
                          className="text-xs font-bold text-brand-700 hover:underline"
                        >
                          Inspect GP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBVIEW 4: WEATHER WATCH */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">Local Microclimate Telemetry Grid</h3>
                  <span className="badge-green text-xs font-bold">All 3 Stations Synchronized</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time automated weather stations (AWS) feeding {blockName} downscaling engine
                </p>
              </div>

              {/* 3 AWS Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900 font-bold">AWS #104 (Kalmeshwar East)</strong>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Temperature: <strong className="text-slate-900">28.1°C</strong></p>
                    <p>Humidity: <strong className="text-slate-900">78%</strong></p>
                    <p>24h Ground Rain: <strong className="text-slate-900 font-mono">1.2 mm</strong></p>
                    <p>Battery / Signal: <strong className="text-emerald-700">12.8V • -64 dBm (Healthy)</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900 font-bold">AWS #105 (Dhapewada West)</strong>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Temperature: <strong className="text-slate-900">27.8°C</strong></p>
                    <p>Humidity: <strong className="text-slate-900">81%</strong></p>
                    <p>24h Ground Rain: <strong className="text-slate-900 font-mono">1.8 mm</strong></p>
                    <p>Battery / Signal: <strong className="text-emerald-700">12.6V • -71 dBm (Healthy)</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900 font-bold">AWS #106 (Seloo Ridge)</strong>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Temperature: <strong className="text-slate-900">29.2°C</strong></p>
                    <p>Humidity: <strong className="text-slate-900">74%</strong></p>
                    <p>24h Ground Rain: <strong className="text-slate-900 font-mono">0.8 mm</strong></p>
                    <p>Battery / Signal: <strong className="text-emerald-700">12.9V • -58 dBm (Healthy)</strong></p>
                  </div>
                </div>
              </div>

              {/* Ground Truth vs Downscaler Model Calibration Comparator */}
              <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-r from-slate-50 to-emerald-50/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-brand-700" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Ground Truth AWS vs. 3km Downscaler Calibration Audit
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Ground Variance: ±0.3 mm</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="pb-2">Station Name</th>
                        <th className="pb-2">Physical Sensor</th>
                        <th className="pb-2">Downscaled 3km</th>
                        <th className="pb-2">IMD Coarse (40km)</th>
                        <th className="pb-2">Local Bias</th>
                        <th className="pb-2 text-right">Model Calibration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">AWS #104 Kalmeshwar East</td>
                        <td className="py-2.5 font-mono">1.2 mm</td>
                        <td className="py-2.5 font-mono font-bold text-brand-700">1.4 mm</td>
                        <td className="py-2.5 font-mono text-slate-400">4.5 mm</td>
                        <td className="py-2.5 font-mono text-emerald-700">+0.2 mm</td>
                        <td className="py-2.5 text-right"><span className="badge-green text-[10px]">Optimal Calibration</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">AWS #105 Dhapewada West</td>
                        <td className="py-2.5 font-mono">1.8 mm</td>
                        <td className="py-2.5 font-mono font-bold text-brand-700">1.6 mm</td>
                        <td className="py-2.5 font-mono text-slate-400">4.5 mm</td>
                        <td className="py-2.5 font-mono text-emerald-700">-0.2 mm</td>
                        <td className="py-2.5 text-right"><span className="badge-green text-[10px]">Optimal Calibration</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">AWS #106 Seloo Ridge</td>
                        <td className="py-2.5 font-mono">0.8 mm</td>
                        <td className="py-2.5 font-mono font-bold text-brand-700">0.9 mm</td>
                        <td className="py-2.5 font-mono text-slate-400">4.5 mm</td>
                        <td className="py-2.5 font-mono text-emerald-700">+0.1 mm</td>
                        <td className="py-2.5 text-right"><span className="badge-green text-[10px]">Optimal Calibration</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agromet Action Indices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Sprayer Safe Window</span>
                  <strong className="text-sm text-emerald-950 font-bold mt-1 block">08:00 AM – 11:30 AM</strong>
                  <p className="text-[11px] text-emerald-700 mt-1">Wind speed 6–8 km/h • 0mm rain window</p>
                </div>
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Soil Moisture Saturation</span>
                  <strong className="text-sm text-blue-950 font-bold mt-1 block">68% (Adequate Level)</strong>
                  <p className="text-[11px] text-blue-700 mt-1">Field trafficability index: Safe for tractors</p>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Evapotranspiration (ET₀)</span>
                  <strong className="text-sm text-amber-950 font-bold mt-1 block">4.2 mm / day</strong>
                  <p className="text-[11px] text-amber-700 mt-1">Moderate water demand across Soybean vegetative</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 5: FIELD REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Field Extension Observations</h3>
                <p className="text-xs text-slate-500">Ground truth logged by agricultural officers in the field</p>
              </div>
              <div className="flex items-center gap-2">
                {fieldReports.length > 0 && (
                  <button
                    onClick={() => downloadAllReportsPDF(fieldReports as any, officerName, blockName, districtName)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Download consolidated report register as PDF"
                  >
                    <Download size={14} className="text-slate-600" />
                    Download All (PDF)
                  </button>
                )}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  + Record Observation
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {fieldReports.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No field reports logged yet. Click "+ Record Observation" to log ground observations.
                </div>
              ) : (
                fieldReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {report.panchayat_name || 'Kalmeshwar'} GP
                        </span>
                        <span className="text-xs text-slate-500 capitalize">• {report.crop}</span>
                        {report.crop_stage && (
                          <span className="text-[11px] text-slate-400">({report.crop_stage})</span>
                        )}
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase px-2 py-0.5 rounded',
                            report.severity === 'high' || report.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : report.severity === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          )}
                        >
                          {report.severity}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(report.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mb-2 leading-relaxed">
                      {report.observation_notes || (report as any).description}
                    </p>

                    {report.action_recommended && (
                      <p className="text-[11px] text-brand-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100 font-medium mb-3">
                        <strong className="font-bold text-emerald-900">Recommended Action:</strong>{' '}
                        {report.action_recommended}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200/70">
                      <span className="text-[10px] text-slate-400 font-mono">
                        REF: FR-{String(report.id).padStart(4, '0')}
                      </span>
                      <button
                        onClick={() => downloadSingleReportPDF(report as any, officerName, districtName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        title="Download official Field Inspection Report as PDF"
                      >
                        <Download size={13} />
                        Download Report (PDF)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBVIEW 6: APPROVED ADVISORIES */}
        {activeTab === 'approved' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Approved & Published Advisories</h3>
              <p className="text-xs text-slate-500">Official verified guidance delivered to farmers</p>
            </div>
            <div className="space-y-3">
              {advisories
                .filter((a) => a.status === 'approved' || a.status === 'sent')
                .map((advisory) => (
                  <AdvisoryRow
                    key={advisory.id}
                    advisory={advisory}
                    onReview={() => setSelectedId(advisory.id)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 7: BLOCK MAP */}
        {activeTab === 'map' && (
          <div className="w-full h-full -m-6 md:-m-8 overflow-hidden">
            <GramWeatherDemo
              className="h-[calc(100vh-8.5rem)] min-h-[640px]"
              initialLat={21.2333}
              initialLon={78.9167}
              initialZoom={11}
            />
          </div>
        )}

        {/* SUBVIEW 8: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck size={20} className="text-emerald-700" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Jurisdiction Governance Audit Log</h3>
                <p className="text-xs text-slate-500">Immutable ledger of advisory modifications and approvals</p>
              </div>
            </div>

            <div className="space-y-3">
              {(blockDashboard?.audit_trail || []).length > 0 ? (
                blockDashboard!.audit_trail!.map((item: any, i: number) => (
                  <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-900">{item.action}</strong>
                      <span className="font-mono text-[11px] text-slate-400 font-bold">{item.time}</span>
                    </div>
                    <p className="text-slate-600 mb-1">By: <strong>{item.actor}</strong></p>
                    <p className="text-slate-500 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                      {item.details}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No audit logs found for this block.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Signature Review Modal */}
      {selectedId && (
        <AdvisoryDetailModal
          advisoryId={selectedId}
          officerId={officerId}
          onClose={() => setSelectedId(null)}
          onReviewed={handleReviewed}
        />
      )}

      {/* Field Report Creation Modal */}
      {showReportModal && (
        <FieldReportModal
          panchayats={panchayats}
          onClose={() => setShowReportModal(false)}
          onCreated={fetchData}
        />
      )}

      {/* Emergency Broadcast Modal */}
      {showBroadcastModal && (
        <EmergencyBroadcastModal
          panchayats={panchayats}
          onClose={() => setShowBroadcastModal(false)}
        />
      )}

      {/* Panchayat Drilldown Inspection Drawer */}
      {selectedPanchayat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedPanchayat.name} Gram Panchayat</h3>
                <p className="text-xs text-slate-500">{selectedPanchayat.block} Block • Elevation {selectedPanchayat.elevation_m}m</p>
              </div>
              <button onClick={() => setSelectedPanchayat(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <p>Registered Farmers: <strong>{selectedPanchayat.registered_farmers ?? 84}</strong></p>
              <p>Primary Crops: <strong className="capitalize">{(selectedPanchayat.primary_crops || ['Soybean', 'Cotton']).join(', ')}</strong></p>
              <p>Telemetry Status: <strong className="text-emerald-700">{selectedPanchayat.telemetry_status || 'FRESH'}</strong></p>
              <p>Last Sync: <strong>{selectedPanchayat.last_sync || '10:30 AM'}</strong></p>
            </div>
            <button
              onClick={() => setSelectedPanchayat(null)}
              className="btn-primary w-full py-2 text-xs font-bold"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmergencyBroadcastModal({
  panchayats,
  onClose,
}: {
  panchayats: PanchayatHierarchyItem[]
  onClose: () => void
}) {
  const [selectedPanchayats, setSelectedPanchayats] = useState<string[]>(
    panchayats.slice(0, 4).map((p) => p.name)
  )
  const [channels, setChannels] = useState<string[]>(['whatsapp', 'sms'])
  const [priority, setPriority] = useState<string>('urgent')
  const [crop, setCrop] = useState<string>('soybean')
  const [message, setMessage] = useState<string>(
    '⚠️ आसन्न भारी वर्षा एवं जलभराव चेतावनी: अगले 24 घंटों में 45mm+ वर्षा का अनुमान है। सोयाबीन एवं कपास खेतों में जल निकासी तुरंत सुनिश्चित करें और कीटनाशक छिड़काव स्थगित रखें।'
  )
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const quickTemplates = [
    {
      title: 'जलभराव व ओलावृष्टि (Heavy Rain & Hail)',
      text: '⚠️ आसन्न भारी वर्षा एवं जलभराव चेतावनी: अगले 24 घंटों में 45mm+ वर्षा का अनुमान है। सोयाबीन एवं कपास खेतों में जल निकासी तुरंत सुनिश्चित करें और कीटनाशक छिड़काव स्थगित रखें।',
      priority: 'urgent',
    },
    {
      title: 'सुरक्षित स्प्रे खिड़की (Spray Window)',
      text: '🌱 छिड़काव सलाह: आज सुबह 08:00 से 11:30 बजे तक हवा की गति अनुकूल (<8 km/h) रहेगी। दोपहर बाद तेज हवा के कारण छिड़काव न करें।',
      priority: 'advisory',
    },
    {
      title: 'कीट प्रकोप चेतावनी (Pink Bollworm Alert)',
      text: '🚨 गुलाबी सुंडी रोकथाम: कपास की फसल में फूल आने की अवस्था में फेरोमोन ट्रैप (8 ट्रैप/एकड़) तुरंत लगाएं।',
      priority: 'urgent',
    },
  ]

  const handleDispatch = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await officerApi.dispatchBroadcast({
        panchayats: selectedPanchayats.length ? selectedPanchayats : ['All Kalmeshwar'],
        channels,
        priority,
        crop,
        message_text: message,
      })
      setResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const farmerCount = (selectedPanchayats.length || panchayats.length || 24) * 77

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Emergency Agricultural Broadcast</h3>
              <p className="text-xs text-slate-500">Dispatch instant multi-channel alerts to registered farmers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="space-y-4 py-4 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Broadcast Dispatched Successfully</h4>
              <p className="text-xs text-slate-500 mt-1">Broadcast ID: <strong className="font-mono">{result.broadcast_id}</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">SMS Delivered</span>
                <span className="text-base font-bold text-slate-900 font-mono">{result.sms_sent}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">WhatsApp Push</span>
                <span className="text-base font-bold text-emerald-700 font-mono">{result.whatsapp_sent}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Delivery Rate</span>
                <span className="text-base font-bold text-brand-700 font-mono">{result.delivery_rate_pct}%</span>
              </div>
            </div>

            <button onClick={onClose} className="btn-primary w-full py-2.5 text-xs font-bold">
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Template Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Quick Alert Templates:</label>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessage(t.text)
                      setPriority(t.priority)
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Channel and Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="urgent">🔴 Red Alert (Hazard / Distress)</option>
                  <option value="advisory">🟡 Amber Alert (Crop Action Required)</option>
                  <option value="info">🔵 Blue Alert (Routine Advisory)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Crop Focus</label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none capitalize"
                >
                  <option value="soybean">Soybean (सोयाबीन)</option>
                  <option value="cotton">Cotton (कपास)</option>
                  <option value="orange">Nagpur Orange (संतरा)</option>
                  <option value="all">All Crops (समस्त फसलें)</option>
                </select>
              </div>
            </div>

            {/* Target Panchayats Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">Target Gram Panchayats</label>
                <span className="text-[11px] font-bold text-brand-700">
                  ~{farmerCount} Farmers Reached
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {panchayats.slice(0, 12).map((p) => {
                  const isChecked = selectedPanchayats.includes(p.name)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPanchayats((prev) =>
                          isChecked ? prev.filter((n) => n !== p.name) : [...prev, p.name]
                        )
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                        isChecked
                          ? 'bg-brand-600 text-white border-brand-700 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Broadcast Bulletin (Devanagari / English)</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="यहाँ किसानों के लिए आपातकालीन संदेश लिखें..."
              />
            </div>

            {/* Dissemination Channels */}
            <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Channels:</span>
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.includes('whatsapp')}
                  onChange={(e) => {
                    setChannels((prev) =>
                      e.target.checked ? [...prev, 'whatsapp'] : prev.filter((c) => c !== 'whatsapp')
                    )
                  }}
                  className="rounded text-brand-600"
                />
                WhatsApp (Rich Card)
              </label>
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.includes('sms')}
                  onChange={(e) => {
                    setChannels((prev) =>
                      e.target.checked ? [...prev, 'sms'] : prev.filter((c) => c !== 'sms')
                    )
                  }}
                  className="rounded text-brand-600"
                />
                SMS Push (NIC Gateway)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={sending || !message.trim()}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send size={14} className={cn(sending && 'animate-spin')} />
                {sending ? 'Broadcasting...' : `Transmit to ~${farmerCount} Farmers`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AdvisoryRow({
  advisory,
  onReview,
}: {
  advisory: AdvisoryListItem
  onReview: () => void
}) {
  const baseline = advisory.baseline_rainfall_mm ?? 4.5
  const predicted = advisory.predicted_rainfall_mm ?? 3.8
  const diff = advisory.model_diff_mm ?? Number((predicted - baseline).toFixed(1))

  return (
    <div
      onClick={onReview}
      className="card hover:border-brand-300 hover:shadow-md cursor-pointer transition-all bg-white border border-slate-200 p-4 rounded-2xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-emerald-100">
            {cropEmoji(advisory.crop)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                #MS-{1000 + advisory.id}
              </span>
              <strong className="text-slate-900 text-sm">{advisory.panchayat_name} GP</strong>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="capitalize font-semibold">{advisory.crop}</span> • {advisory.crop_stage || 'Vegetative Stage'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">IMD</span>
            <span className="font-semibold text-slate-700">{baseline} mm</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Model</span>
            <span className="font-bold text-brand-700">{predicted} mm</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Diff</span>
            <span className="font-mono font-bold text-emerald-700">{diff > 0 ? `+${diff}` : diff} mm</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          {(advisory.status === 'approved' || advisory.status === 'sent') && (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-600" />
              Delivered to 84 farmers
            </span>
          )}
          <span
            className={cn(
              'badge text-[11px] font-bold uppercase',
              advisory.status === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : advisory.status === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            {advisory.status}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReview()
            }}
            className={cn(
              'text-xs py-1.5 px-3 flex items-center gap-1 shadow-xs rounded-xl font-bold transition-all',
              advisory.status === 'pending'
                ? 'btn-primary'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {advisory.status === 'pending' ? (
              <>
                <Edit3 size={12} />
                Review
              </>
            ) : (
              <>
                <History size={12} />
                Audit Log
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
