import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Edit3, Clock, Leaf, MapPin,
  TrendingUp, Users, Send, AlertTriangle, RefreshCw,
  ChevronRight, Filter, Search, ShieldCheck, Activity,
  CloudRain, Wind, Droplets, Thermometer, Plus, FileText,
  Compass, Map as MapIcon, History, Radio, Layers, X
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
import { AdvisoryDetailModal } from '@/components/officer/AdvisoryDetailModal'
import { FieldReportModal } from '@/components/officer/FieldReportModal'

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
  const [refreshing, setRefreshing] = useState(false)

  // Current logged in officer identity (Rajesh Sharma, Kalmeshwar Block, Nagpur)
  const officerId = 1
  const blockName = 'Kalmeshwar'

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 sticky top-16 md:h-[calc(100vh-4rem)] flex flex-col flex-shrink-0 z-10 shadow-xs">
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
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: undefined },
            { id: 'queue', label: 'Advisory Queue', icon: Clock, badge: stats?.pending_advisories },
            { id: 'panchayats', label: 'Panchayats (24)', icon: MapPin, badge: undefined },
            { id: 'weather', label: 'Weather Watch', icon: CloudRain, badge: undefined },
            { id: 'reports', label: 'Field Reports', icon: FileText, badge: fieldReports.length || 3 },
            { id: 'approved', label: 'Approved Advisories', icon: CheckCircle, badge: stats?.approved_today },
            { id: 'map', label: 'Block Map', icon: MapIcon, badge: undefined },
            { id: 'audit', label: 'Audit Trail', icon: History, badge: undefined },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as SubView)}
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
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              File Field Report
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
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
                { label: 'Jurisdiction', val: `${blockName} Block`, sub: 'Nagpur Dist', color: 'slate' },
                { label: 'Panchayats', val: '24', sub: 'In Block', color: 'slate' },
                { label: 'Farmers', val: '1,842', sub: 'Registered', color: 'slate' },
                { label: 'Active Crops', val: '5', sub: 'Soybean, Cotton..', color: 'slate' },
                { label: 'Pending Review', val: stats?.pending_advisories ?? 2, sub: 'Immediate Action', color: 'amber' },
                { label: 'Approved Today', val: stats?.approved_today ?? 22, sub: 'Disseminated', color: 'emerald' },
                { label: 'Field Reports', val: fieldReports.length || 3, sub: 'On Record', color: 'sky' },
              ].map(({ label, val, sub, color }) => (
                <div
                  key={label}
                  className={cn(
                    'bg-white border rounded-xl p-3.5 shadow-xs',
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
                  {[
                    {
                      type: 'Convective Rain Alert',
                      severity: 'warning',
                      detail: 'Local convective shower (+4.2 mm) modeled between 14:00 - 17:00 IST for Dhapewada & Seloo.',
                      panchayats: 'Dhapewada, Seloo',
                    },
                    {
                      type: 'Humidity Anomaly',
                      severity: 'info',
                      detail: 'RH > 78% with night dew increases fungal sporulation risk on vegetative soybean.',
                      panchayats: 'Bokhara, Khapa',
                    },
                    {
                      type: 'Wind Gust Watch',
                      severity: 'info',
                      detail: 'Gusts up to 22 km/h expected late afternoon. Advise against foliar pesticide spraying.',
                      panchayats: 'All 24 GPs',
                    },
                  ].map((w, idx) => (
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
                        <span className="text-[10px] text-slate-400 font-semibold">{w.panchayats}</span>
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
                      <td className="p-3 text-slate-600">{p.elevation_m} m</td>
                      <td className="p-3 font-semibold text-slate-800">{p.registered_farmers}</td>
                      <td className="p-3 text-slate-600 capitalize">{p.primary_crops.join(', ')}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            p.telemetry_status === 'FRESH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {p.telemetry_status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{p.last_sync}</td>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Local Microclimate Telemetry Grid</h3>
              <p className="text-xs text-slate-500 mb-4">
                Real-time automated weather stations (AWS) feeding {blockName} downscaling engine
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900 font-bold">AWS #104 (Kalmeshwar East)</strong>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Temperature: <strong>28.1°C</strong></p>
                    <p>Humidity: <strong>78%</strong></p>
                    <p>24h Rain: <strong>1.2 mm</strong></p>
                    <p>Battery: <strong className="text-emerald-700">12.8V (Healthy)</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900 font-bold">AWS #105 (Dhapewada West)</strong>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Temperature: <strong>27.8°C</strong></p>
                    <p>Humidity: <strong>81%</strong></p>
                    <p>24h Rain: <strong>1.8 mm</strong></p>
                    <p>Battery: <strong className="text-emerald-700">12.6V (Healthy)</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900 font-bold">AWS #106 (Seloo Ridge)</strong>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Temperature: <strong>29.2°C</strong></p>
                    <p>Humidity: <strong>74%</strong></p>
                    <p>24h Rain: <strong>0.8 mm</strong></p>
                    <p>Battery: <strong className="text-emerald-700">12.9V (Healthy)</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 5: FIELD REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Field Extension Observations</h3>
                <p className="text-xs text-slate-500">Ground truth logged by agricultural officers in the field</p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Plus size={14} />
                + Record Observation
              </button>
            </div>

            <div className="space-y-3">
              {fieldReports.map((report) => (
                <div key={report.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {report.panchayat_name} GP
                      </span>
                      <span className="text-xs text-slate-500 capitalize">• {report.crop}</span>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase px-2 py-0.5 rounded',
                          report.severity === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : report.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {report.severity}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mb-2">{report.observation_notes}</p>
                  {report.action_recommended && (
                    <p className="text-[11px] text-brand-800 bg-emerald-50/80 p-2 rounded border border-emerald-100 font-medium">
                      Recommended Action: {report.action_recommended}
                    </p>
                  )}
                </div>
              ))}
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Kalmeshwar Block Spatial Map</h3>
                <p className="text-xs text-slate-500">24 Panchayats color-coded by advisory status & rainfall intensity</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Verified</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending</span>
              </div>
            </div>

            {/* Interactive Grid Map representation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {panchayats.map((p) => {
                const isPending = p.name === 'Dhapewada' || p.name === 'Ubali'
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPanchayat(p)}
                    className={cn(
                      'p-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 shadow-xs',
                      isPending ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50/60 border-emerald-200'
                    )}
                  >
                    <MapPin size={16} className={cn('mx-auto mb-1', isPending ? 'text-amber-600' : 'text-emerald-700')} />
                    <strong className="block text-xs text-slate-900 truncate">{p.name}</strong>
                    <span className="text-[10px] text-slate-500 block">{p.elevation_m}m</span>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded-full inline-block',
                        isPending ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                      )}
                    >
                      {isPending ? 'Pending' : 'Verified'}
                    </span>
                  </div>
                )
              })}
            </div>
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
              {[
                {
                  time: '10:18 IST',
                  actor: 'Rajesh Sharma (Officer)',
                  action: 'Approved Advisory #MS-1042',
                  details: 'Soil moisture verified at Dhapewada AWS #104. Irrigation delay approved.',
                },
                {
                  time: '09:12 IST',
                  actor: 'Agronomic Rule Engine',
                  action: 'Draft Generated #MS-1042',
                  details: 'Downscaled 4.5mm to 3.8mm (-0.7mm diff) with HIGH reliability for Soybean.',
                },
                {
                  time: '09:00 IST',
                  actor: 'IMD Agromet Service',
                  action: 'Baseline Ingestion',
                  details: '40km coarse grid baseline ingested for Nagpur district.',
                },
              ].map((item, i) => (
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
              ))}
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
              <p>Registered Farmers: <strong>{selectedPanchayat.registered_farmers}</strong></p>
              <p>Primary Crops: <strong className="capitalize">{selectedPanchayat.primary_crops.join(', ')}</strong></p>
              <p>Telemetry Status: <strong className="text-emerald-700">{selectedPanchayat.telemetry_status}</strong></p>
              <p>Last Sync: <strong>{selectedPanchayat.last_sync}</strong></p>
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
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-xs"
          >
            <Edit3 size={12} />
            Review
          </button>
        </div>
      </div>
    </div>
  )
}
