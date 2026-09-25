import React, { useState, useEffect } from 'react'
import {
  ShieldCheck, Database, Cpu, CheckCircle2, AlertTriangle,
  BarChart2, Server, MapPin, RefreshCw, Layers, Clock,
  TrendingDown, TrendingUp, AlertCircle, X, ChevronRight,
  ExternalLink, UserCheck, Activity, Radio, Users, CheckCircle,
  XCircle, Filter, Search, Settings, FileText, Map as MapIcon,
  History, ArrowRight, ShieldAlert, Wifi, WifiOff, Globe
} from 'lucide-react'
import { advisoryApi, officerApi, geographyApi } from '@/api/client'
import type {
  DistrictOperationsSummary,
  ModelPerformanceResponse,
  OfficerDirectoryItem,
  AdvisoryListItem,
  StateConfig,
  PanchayatHierarchyItem
} from '@/types'
import { cn, formatDate } from '@/lib/utils'

type AdminTab =
  | 'overview'
  | 'panchayats'
  | 'officers'
  | 'advisories'
  | 'data-health'
  | 'model-health'
  | 'map'
  | 'audit'
  | 'settings'

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [summary, setSummary] = useState<DistrictOperationsSummary | null>(null)
  const [modelPerf, setModelPerf] = useState<ModelPerformanceResponse | null>(null)
  const [officers, setOfficers] = useState<OfficerDirectoryItem[]>([])
  const [advisories, setAdvisories] = useState<AdvisoryListItem[]>([])
  const [states, setStates] = useState<StateConfig[]>([])
  const [panchayats, setPanchayats] = useState<PanchayatHierarchyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPanchayat, setSelectedPanchayat] = useState<PanchayatHierarchyItem | null>(null)
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [searchPanchayat, setSearchPanchayat] = useState('')
  const [selectedState, setSelectedState] = useState('MH')
  const [reassignModalOfficer, setReassignModalOfficer] = useState<OfficerDirectoryItem | null>(null)
  const [reassignBlockTarget, setReassignBlockTarget] = useState('Kalmeshwar')

  const district = 'Nagpur'

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [sum, perf, offList, advList, statesList, gpList] = await Promise.all([
        advisoryApi.districtSummary(district),
        advisoryApi.modelHealth(),
        officerApi.list(district).catch(() => []),
        advisoryApi.list().catch(() => []),
        geographyApi.getStates().catch(() => []),
        geographyApi.getPanchayats().catch(() => []),
      ])
      setSummary(sum)
      setModelPerf(perf)
      setOfficers(offList)
      setAdvisories(advList)
      setStates(statesList)
      setPanchayats(gpList)
    } catch (err) {
      console.error('Failed to load district admin data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReassign = async () => {
    if (!reassignModalOfficer) return
    try {
      await officerApi.assign({
        officer_id: reassignModalOfficer.id,
        block: reassignBlockTarget,
      })
      setReassignModalOfficer(null)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const filteredPanchayats = panchayats.filter((p) => {
    const matchesBlock = filterBlock === 'all' || p.block.toLowerCase() === filterBlock.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(searchPanchayat.toLowerCase()) ||
                          p.block.toLowerCase().includes(searchPanchayat.toLowerCase())
    return matchesBlock && matchesSearch
  })

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 sticky top-16 md:h-[calc(100vh-4rem)] flex flex-col flex-shrink-0 z-10 shadow-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">District Command</h2>
              <p className="text-[11px] font-semibold text-emerald-700">{district} District Center</p>
            </div>
          </div>
        </div>

        {/* 9 Admin Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart2, badge: undefined },
            { id: 'panchayats', label: 'Panchayat Operations', icon: MapPin, badge: '78 GP' },
            { id: 'officers', label: 'Officers Directory', icon: Users, badge: officers.length || 4 },
            { id: 'advisories', label: 'Advisory Governance', icon: FileText, badge: summary?.pending_advisories },
            { id: 'data-health', label: 'Data & Telemetry', icon: Server, badge: '10/12 AWS' },
            { id: 'model-health', label: 'Model Health & Fallback', icon: Cpu, badge: 'v0.3' },
            { id: 'map', label: 'District Spatial Map', icon: MapIcon, badge: undefined },
            { id: 'audit', label: 'System Audit Log', icon: History, badge: undefined },
            { id: 'settings', label: 'State & Configuration', icon: Globe, badge: '3 States' },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as AdminTab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                activeTab === id
                  ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon size={16} className={activeTab === id ? 'text-brand-700' : 'text-slate-400'} />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin Persona */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
              PD
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-900 leading-tight">Dr. P. K. Deshmukh</p>
              <p className="text-[11px] text-slate-500">District Agricultural Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-brand-800 tracking-wider bg-brand-100 px-2.5 py-0.5 rounded-full">
                {district} District Operations Command
              </span>
              <span className="text-xs text-slate-400">• Real-Time Synchronized</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-1 capitalize">
              {activeTab === 'overview' && 'District Operations Overview'}
              {activeTab === 'panchayats' && 'Panchayat Field Operations'}
              {activeTab === 'officers' && 'Agricultural Extension Officers'}
              {activeTab === 'advisories' && 'District Advisory Governance'}
              {activeTab === 'data-health' && 'Weather & Data Feeds Health'}
              {activeTab === 'model-health' && 'Microclimate Model Health & Fallback Engine'}
              {activeTab === 'map' && 'District Spatial Distribution Map'}
              {activeTab === 'audit' && 'System-Wide Governance Audit Log'}
              {activeTab === 'settings' && 'Pan-India Configuration & Multi-State Architecture'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
              Refresh District Feeds
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Scope Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'District', val: district, sub: 'Maharashtra', color: 'slate' },
                { label: 'Panchayats', val: '78', sub: 'Total GPs', color: 'slate' },
                { label: 'Blocks', val: '4', sub: 'Sub-Districts', color: 'slate' },
                { label: 'AWS Stations', val: '12', sub: '10 Online', color: 'slate' },
                { label: 'Approved Today', val: summary?.approved_today ?? 71, sub: 'Disseminated', color: 'emerald' },
                { label: 'Pending Review', val: summary?.pending_advisories ?? 7, sub: 'Awaiting Action', color: 'amber' },
                { label: 'Stale Feeds', val: '3', sub: 'Delayed >4h', color: 'slate' },
                { label: 'Stations Offline', val: '2', sub: 'Tech Dispatched', color: 'rose' },
              ].map(({ label, val, sub, color }) => (
                <div
                  key={label}
                  className={cn(
                    'bg-white border rounded-xl p-3 shadow-xs',
                    color === 'amber' ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                  )}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{label}</span>
                  <span className={cn('text-lg font-bold font-display', color === 'amber' ? 'text-amber-800' : 'text-slate-900')}>
                    {val}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{sub}</span>
                </div>
              ))}
            </div>

            {/* Action Required Priority Box */}
            <div className="bg-gradient-to-r from-amber-50/80 via-rose-50/40 to-slate-50 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                    Action Required (जिला परिचालन कार्यसूची)
                  </h2>
                </div>
                <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-3 py-1 rounded-full">
                  4 District Exceptions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-amber-900 font-bold">
                    <span>Advisories Awaiting Review</span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                      {summary?.pending_advisories ?? 7} GP
                    </span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    Kalmeshwar & Saoner blocks downscaled batches awaiting officer sign-off.
                  </p>
                  <button
                    onClick={() => setActiveTab('advisories')}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 pt-1"
                  >
                    Inspect Queue <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-800 font-bold">
                    <span>Stale Observation Feeds</span>
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-mono">3 GP</span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    Mohpa, Khapa, and Kelwad telemetry sync delayed &gt; 4 hours.
                  </p>
                  <button
                    onClick={() => setActiveTab('data-health')}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 pt-1"
                  >
                    Force Station Sync <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-rose-900 font-bold">
                    <span>AWS Stations Offline</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono">2 STN</span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    AWS #108 (Katol East) and AWS #111 (Ramtek North) telemetry silent.
                  </p>
                  <button
                    onClick={() => alert('Field maintenance ticket dispatched')}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 pt-1"
                  >
                    Dispatch Tech <ChevronRight size={12} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span>Local Orographic Deviation</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">Normal</span>
                  </div>
                  <p className="text-slate-600 leading-snug text-[11px]">
                    DEM physics applied +5.2mm local lift adjustment along Ramtek ridge.
                  </p>
                  <button
                    onClick={() => setActiveTab('model-health')}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 pt-1"
                  >
                    View Model Logs <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Block Operations Summary Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Block-Level Operational Breakdown</h3>
                <span className="text-xs text-slate-500 font-medium">All 4 Blocks Active</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Block</th>
                    <th className="p-3">Total Panchayats</th>
                    <th className="p-3">Verified Today</th>
                    <th className="p-3">Pending Review</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3">Telemetry Error</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary?.blocks.map((b) => (
                    <tr key={b.block} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{b.block} Block</td>
                      <td className="p-3 font-semibold text-slate-700">{b.total_panchayats}</td>
                      <td className="p-3 font-bold text-emerald-700">{b.verified_today}</td>
                      <td className="p-3 font-bold text-amber-700">{b.pending_review}</td>
                      <td className="p-3 text-slate-800 font-medium">{b.assigned_officer}</td>
                      <td className="p-3 text-slate-600 font-mono">{b.avg_error_mm}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setFilterBlock(b.block)
                            setActiveTab('panchayats')
                          }}
                          className="text-brand-700 font-bold hover:underline"
                        >
                          View GPs →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PANCHAYAT OPERATIONS */}
        {activeTab === 'panchayats' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="relative flex-1 w-full max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9 text-xs w-full py-2"
                  placeholder="Search by panchayat or block..."
                  value={searchPanchayat}
                  onChange={(e) => setSearchPanchayat(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['all', 'Kalmeshwar', 'Hingna', 'Saoner', 'Katol'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setFilterBlock(b)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      filterBlock === b ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {b === 'all' ? 'All Blocks' : b}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Gram Panchayat</th>
                    <th className="p-3">Block</th>
                    <th className="p-3">Weather Status</th>
                    <th className="p-3">Data Freshness</th>
                    <th className="p-3">Advisory Status</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3">Model State</th>
                    <th className="p-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPanchayats.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.name} GP</td>
                      <td className="p-3 text-slate-700">{p.block}</td>
                      <td className="p-3 text-slate-600">3.8 mm (Rain)</td>
                      <td className="p-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', p.telemetry_status === 'FRESH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                          {p.telemetry_status}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">Approved</td>
                      <td className="p-3 text-slate-800 font-medium">Rajesh Sharma</td>
                      <td className="p-3 font-mono text-slate-600">Normal (XGB-03)</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedPanchayat(p)}
                          className="text-xs font-bold text-brand-700 hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OFFICER MANAGEMENT */}
        {activeTab === 'officers' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Agricultural Extension Officers Directory</h3>
                <p className="text-xs text-slate-500">Jurisdiction assignment, workload telemetry & review performance</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                4/4 Active Extension Leads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-3">Officer</th>
                    <th className="p-3">Assigned Block</th>
                    <th className="p-3">Panchayats</th>
                    <th className="p-3">Pending Reviews</th>
                    <th className="p-3">Approved Today</th>
                    <th className="p-3">Avg Review Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {officers.map((off) => (
                    <tr key={off.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{off.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">{off.phone}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{off.block} Block</td>
                      <td className="p-3 text-slate-600">{off.assigned_panchayats_count} GPs</td>
                      <td className="p-3 font-bold text-amber-700">{off.pending_reviews}</td>
                      <td className="p-3 font-bold text-emerald-700">{off.approved_today}</td>
                      <td className="p-3 text-slate-600 font-mono">{off.avg_review_time_mins} min</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                            off.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {off.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setReassignModalOfficer(off)
                            setReassignBlockTarget(off.block)
                          }}
                          className="text-xs font-bold text-brand-700 hover:underline mr-3"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ADVISORY GOVERNANCE */}
        {activeTab === 'advisories' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">District Advisory Governance Ledger</h3>
                <p className="text-xs text-slate-500">Lifecycle traceability: Draft → Under Review → Approved → Published</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {advisories.length} Total Records
              </span>
            </div>

            <div className="space-y-3">
              {advisories.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded">
                        #MS-{1000 + a.id}
                      </span>
                      <strong className="text-slate-900 text-sm">{a.panchayat_name} GP</strong>
                      <span className="text-slate-500 capitalize">• {a.crop}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Downscaled: {a.predicted_rainfall_mm ?? 3.8}mm (vs IMD {a.baseline_rainfall_mm ?? 4.5}mm) • Diff: {a.model_diff_mm ?? -0.7}mm
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full',
                        a.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : a.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {a.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(a.advisory_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DATA HEALTH */}
        {activeTab === 'data-health' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b pb-3">Weather Data Pipelines & Telemetry Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'IMD Regional Agromet Feed', status: 'Healthy', sync: '10:30 AM IST (8m ago)', latency: '120ms', errors: '0' },
                  { name: 'Ground AWS Network (12)', status: '10/12 Online', sync: 'Continuous', latency: '450ms', errors: '2 (Katol, Ramtek)' },
                  { name: 'DEM Terrain Physics GIS', status: 'Healthy', sync: 'Static / Calibrated', latency: '15ms', errors: '0' },
                  { name: 'Microclimate Downscaler', status: 'Active (v0.3)', sync: '09:00 IST Batch', latency: '2.1s', errors: '0' },
                  { name: 'Agronomic Rules Engine', status: 'Healthy', sync: '09:12 IST Batch', latency: '80ms', errors: '0' },
                  { name: 'Farmer Delivery Gateway (SMS)', status: 'Active', sync: 'Ready', latency: '1.4s', errors: '0' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{item.name}</strong>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <p>Last Sync: <strong>{item.sync}</strong></p>
                      <p>Ingestion Latency: <strong className="font-mono">{item.latency}</strong></p>
                      <p>Error Flags: <strong className="font-mono">{item.errors}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MODEL HEALTH & FALLBACK ENGINE */}
        {activeTab === 'model-health' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Cpu size={18} className="text-brand-600" />
                    Spatial Downscaler Model Evaluation (XGBoost v0.3)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated against Nagpur AWS Ground Truth (01 Sep – 25 Sep 2026, 1,420 samples)
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  Status: Healthy
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline IMD MAE</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">2.41 mm</span>
                  <span className="text-[10px] text-slate-400">Coarse 40km grid</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">MausamSetu MAE</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">1.38 mm</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">42.7% error reduction</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline RMSE</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">3.12 mm</span>
                  <span className="text-[10px] text-slate-400">Regional variance</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">Model RMSE</span>
                  <span className="text-2xl font-black text-blue-900 mt-1 block">1.84 mm</span>
                  <span className="text-[10px] text-blue-700 font-semibold">Low outlier skew</span>
                </div>
              </div>

              {/* Automated Fallback Engine Logic Flow */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-600" />
                  Automated Fallback Engine Decision Path
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 1: Input</span>
                    <p className="text-[11px] text-slate-500 mt-1">IMD 40km Regional Baseline</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 2: Checks</span>
                    <p className="text-[11px] text-slate-500 mt-1">Telemetry Freshness &lt;4h</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 3: Uncertainty</span>
                    <p className="text-[11px] text-slate-500 mt-1">Prediction Interval &lt;3.5mm</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800 block">Step 4: Quality Gate</span>
                    <p className="text-[11px] text-slate-500 mt-1">Diff within physical limits</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-300 shadow-2xs text-emerald-950 font-bold">
                    <span>YES → MausamSetu</span>
                    <p className="text-[10px] font-normal text-emerald-800 mt-1">NO → Fallback to IMD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DISTRICT MAP */}
        {activeTab === 'map' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Nagpur District Spatial Dissemination Map</h3>
                <p className="text-xs text-slate-500">78 Gram Panchayats across 4 Blocks</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Verified</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending Review</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {panchayats.map((p) => {
                const isPending = p.name === 'Dhapewada' || p.name === 'Ubali'
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPanchayat(p)}
                    className={cn(
                      'p-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-105',
                      isPending ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200'
                    )}
                  >
                    <MapPin size={16} className={cn('mx-auto mb-1', isPending ? 'text-amber-600' : 'text-emerald-700')} />
                    <strong className="block text-xs text-slate-900 truncate">{p.name}</strong>
                    <span className="text-[10px] text-slate-500 block">{p.block}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b pb-3">District Governance Audit Trail</h3>
            <div className="space-y-3">
              {[
                { time: '10:18 IST', actor: 'Rajesh Sharma (Officer)', action: 'Approved Advisory #MS-1042', details: 'Dhapewada GP Soybean advisory signed and published to farmers.' },
                { time: '09:20 IST', actor: 'System Gateway', action: 'Daily Ingestion Completed', details: 'Ingested 78 GP downscaled forecasts across 4 blocks.' },
                { time: '08:50 IST', actor: 'IMD Agromet Service', action: 'Baseline Broadcast', details: 'Ingested coarse 40km weather grid for Nagpur district.' },
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

        {/* TAB 9: SETTINGS & MULTI-STATE SWITCHER */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Configuration-Driven Geography (Pan-India)</h3>
                <p className="text-xs text-slate-500">
                  MausamSetu is designed India-first. The same frontend architecture supports Punjab, Karnataka, and Maharashtra without code changes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {states.map((st) => (
                  <div
                    key={st.code}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      st.is_pilot ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-slate-900 text-sm">{st.state}</strong>
                      <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        {st.code}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p>Languages: <strong className="uppercase">{st.languages.join(', ')}</strong></p>
                      <p>Major Crops: <strong className="capitalize">{st.major_crops.join(', ')}</strong></p>
                      <p>Configured Districts: <strong>{st.districts_count}</strong></p>
                      <p className="mt-2 text-[10px] font-bold text-emerald-800">
                        {st.is_pilot ? '✓ Active Pilot Deployment' : '✓ Architecture Ready'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reassign Officer Modal */}
      {reassignModalOfficer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Reassign Extension Officer</h3>
              <button onClick={() => setReassignModalOfficer(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-700 space-y-2">
              <p>Officer: <strong>{reassignModalOfficer.name}</strong></p>
              <p>Current Block: <strong>{reassignModalOfficer.block}</strong></p>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Target Block Jurisdiction:</label>
                <select
                  value={reassignBlockTarget}
                  onChange={(e) => setReassignBlockTarget(e.target.value)}
                  className="input w-full py-2 text-xs"
                >
                  <option value="Kalmeshwar">Kalmeshwar Block</option>
                  <option value="Hingna">Hingna Block</option>
                  <option value="Saoner">Saoner Block</option>
                  <option value="Katol">Katol Block</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setReassignModalOfficer(null)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="btn-primary py-1.5 px-4 text-xs font-bold"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panchayat Drill-Down Modal */}
      {selectedPanchayat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedPanchayat.name} GP</h3>
                <p className="text-xs text-slate-500">{selectedPanchayat.block} Block • Nagpur District</p>
              </div>
              <button onClick={() => setSelectedPanchayat(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <p>Registered Farmers: <strong>{selectedPanchayat.registered_farmers}</strong></p>
              <p>Primary Crops: <strong className="capitalize">{selectedPanchayat.primary_crops.join(', ')}</strong></p>
              <p>Elevation: <strong>{selectedPanchayat.elevation_m}m</strong></p>
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

export default AdminDashboard
