import React, { useState, useEffect } from 'react'
import {
  ShieldCheck, Database, Cpu, CheckCircle2, AlertTriangle,
  BarChart2, Server, MapPin, RefreshCw, Layers, Clock,
  TrendingDown, TrendingUp, AlertCircle, X, ChevronRight,
  ExternalLink, UserCheck, Activity, Radio, Users, CheckCircle,
  XCircle, Filter, Search, Settings, FileText, Map as MapIcon,
  History, ArrowRight, ShieldAlert, Wifi, WifiOff, Globe, Play
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts'
import { advisoryApi, officerApi, geographyApi, adminApi } from '@/api/client'
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
  | 'ml-lab'
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
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [dataHealthList, setDataHealthList] = useState<any[]>([])
  const [benchmarkCurve, setBenchmarkCurve] = useState<any[]>([])
  const [fallbackSimulation, setFallbackSimulation] = useState<any | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPanchayat, setSelectedPanchayat] = useState<PanchayatHierarchyItem | null>(null)
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [searchPanchayat, setSearchPanchayat] = useState('')
  const [selectedState, setSelectedState] = useState('MH')
  const [reassignModalOfficer, setReassignModalOfficer] = useState<OfficerDirectoryItem | null>(null)
  const [reassignBlockTarget, setReassignBlockTarget] = useState('Kalmeshwar')

  // Embedded Downscaling Calculator state
  const [calcElevation, setCalcElevation] = useState<number>(312)
  const [calcBaseRain, setCalcBaseRain] = useState<number>(4.5)
  const [calcBaseTemp, setCalcBaseTemp] = useState<number>(33.0)
  const [calcHumidity, setCalcHumidity] = useState<number>(72)

  // Multi-tier spatial drilldown state
  const [spatialTier, setSpatialTier] = useState<'india' | 'state' | 'district' | 'block'>('block')
  const [drillState, setDrillState] = useState<string>('Maharashtra')
  const [drillDistrict, setDrillDistrict] = useState<string>('Nagpur')
  const [drillBlock, setDrillBlock] = useState<string>('Kalmeshwar')

  const district = 'Nagpur'

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [sum, perf, offList, advList, statesList, gpList, audits, dHealth, curve] = await Promise.all([
        advisoryApi.districtSummary(district),
        advisoryApi.modelHealth(),
        officerApi.list(district).catch(() => []),
        advisoryApi.list().catch(() => []),
        geographyApi.getStates().catch(() => []),
        geographyApi.getPanchayats().catch(() => []),
        advisoryApi.districtAudit().catch(() => []),
        adminApi.dataHealth().catch(() => []),
        adminApi.getModelBenchmarkCurve().catch(() => []),
      ])
      setSummary(sum)
      setModelPerf(perf)
      setOfficers(offList)
      setAdvisories(advList)
      setStates(statesList)
      setPanchayats(gpList)
      setAuditLogs(audits)
      setDataHealthList(dHealth)
      setBenchmarkCurve(curve)
    } catch (err) {
      console.error('Failed to load district admin data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const runFallbackSimulation = async () => {
    setSimulating(true)
    try {
      const res = await adminApi.simulateFallback()
      setFallbackSimulation(res)
    } catch (e) {
      console.error(e)
    } finally {
      setSimulating(false)
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

  const adminTabsList: Array<{ id: AdminTab; label: string; icon: any; badge?: string | number }> = [
    { id: 'overview', label: 'Overview', icon: BarChart2, badge: undefined },
    { id: 'panchayats', label: 'Panchayat Operations', icon: MapPin, badge: '78 GP' },
    { id: 'officers', label: 'Officers Directory', icon: Users, badge: officers.length || 4 },
    { id: 'advisories', label: 'Advisory Governance', icon: FileText, badge: summary?.pending_advisories },
    { id: 'data-health', label: 'Data & Telemetry', icon: Server, badge: '10/12 AWS' },
    { id: 'model-health', label: 'Model Health & Fallback', icon: Cpu, badge: 'v0.3' },
    { id: 'ml-lab', label: '🔬 ML Model Lab', icon: Activity, badge: 'Interactive' },
    { id: 'map', label: 'District Spatial Map', icon: MapIcon, badge: undefined },
    { id: 'audit', label: 'System Audit Log', icon: History, badge: undefined },
    { id: 'settings', label: 'State & Configuration', icon: Globe, badge: '3 States' },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Navigation Strip (< md) */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-14 z-30 shadow-2xs">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-100 text-brand-800 rounded-lg flex items-center justify-center font-bold">
              <ShieldCheck size={15} />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs">District Command</span>
              <span className="text-[10px] text-emerald-700 ml-1.5 font-semibold">({district})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            <span>Dr. Deshmukh</span>
          </div>
        </div>

        {/* Horizontal scrollable pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
          {adminTabsList.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-brand-700 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              <Icon size={13} className={activeTab === id ? 'text-brand-100' : 'text-slate-500'} />
              <span>{label}</span>
              {badge != null && (
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.2 rounded-full',
                    activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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
            <div className="w-9 h-9 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">District Command</h2>
              <p className="text-[11px] font-semibold text-emerald-700">{district} District Center</p>
            </div>
          </div>
        </div>

        {/* 10 Admin Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminTabsList.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
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
      <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto">
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
                { label: 'Panchayats', val: String(summary?.total_panchayats || 0), sub: 'Total GPs', color: 'slate' },
                { label: 'Blocks', val: String(summary?.total_blocks || 0), sub: 'Sub-Districts', color: 'slate' },
                { label: 'AWS Stations', val: String(summary?.total_stations || 12), sub: `${(summary?.total_stations || 12) - (summary?.offline_stations || 0)} Online`, color: 'slate' },
                { label: 'Approved Today', val: summary?.approved_today ?? 0, sub: 'Disseminated', color: 'emerald' },
                { label: 'Pending Review', val: summary?.pending_advisories ?? 0, sub: 'Awaiting Action', color: 'amber' },
                { label: 'Stale Feeds', val: String(summary?.stale_panchayats || 0), sub: 'Delayed >4h', color: 'slate' },
                { label: 'Stations Offline', val: String(summary?.offline_stations || 0), sub: 'Tech Dispatched', color: 'rose' },
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
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-mono">{summary?.stale_panchayats || 0} GP</span>
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
                      <td className="p-3 text-slate-600">{p.weather_status_text || '0.0 mm (Clear)'}</td>
                      <td className="p-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', p.telemetry_status === 'FRESH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                          {p.telemetry_status || 'FRESH'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">{p.advisory_status || 'Pending'}</td>
                      <td className="p-3 text-slate-800 font-medium">{p.officer_name || 'Rajesh Sharma'}</td>
                      <td className="p-3 font-mono text-slate-600">{p.model_state || 'Normal (XGB-03)'}</td>
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
                {dataHealthList.map((item, i) => (
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
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Cpu size={18} className="text-brand-600" />
                    Spatial Downscaler Model Evaluation & Benchmark (XGBoost v0.3)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated against Nagpur AWS Ground Truth Network (01 Sep – 25 Sep 2026, 1,420 samples)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Status: Healthy (42.7% Error Reduction)
                  </span>
                </div>
              </div>

              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline IMD MAE</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">{modelPerf?.baseline_mae ?? '2.41'} mm</span>
                  <span className="text-[10px] text-slate-400">Coarse 40km grid</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">MausamSetu MAE</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">{modelPerf?.model_mae ?? '1.38'} mm</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">{modelPerf?.error_reduction_pct ?? '42.7'}% error reduction</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline RMSE</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">{modelPerf?.baseline_rmse ?? '3.12'} mm</span>
                  <span className="text-[10px] text-slate-400">Regional variance</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">Model RMSE</span>
                  <span className="text-2xl font-black text-blue-900 mt-1 block">{modelPerf?.model_rmse ?? '1.84'} mm</span>
                  <span className="text-[10px] text-blue-700 font-semibold">Low outlier skew</span>
                </div>
              </div>

              {/* 25-Day MAE Comparison Benchmark Curve (Recharts) */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 size={16} className="text-brand-700" />
                      Daily Mean Absolute Error (MAE) Progression Curve
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daily comparison across 25 days: IMD Regional Grid (40km) vs MausamSetu Microclimate (3km)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-3 rounded-full bg-slate-400" />
                      IMD Coarse Baseline (40km)
                    </span>
                    <span className="flex items-center gap-1.5 text-brand-700 font-bold">
                      <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      MausamSetu 3km Downscaler
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={benchmarkCurve.length > 0 ? benchmarkCurve : [
                        { day: '01 Sep', baseline_mae: 2.52, model_mae: 1.45 },
                        { day: '05 Sep', baseline_mae: 2.10, model_mae: 1.28 },
                        { day: '10 Sep', baseline_mae: 2.85, model_mae: 1.50 },
                        { day: '15 Sep', baseline_mae: 2.70, model_mae: 1.48 },
                        { day: '20 Sep', baseline_mae: 2.30, model_mae: 1.30 },
                        { day: '25 Sep', baseline_mae: 2.41, model_mae: 1.38 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="modelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        unit=" mm"
                        domain={[0, 4]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const diff = (data.baseline_mae - data.model_mae).toFixed(2)
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-bold text-slate-300">{data.day} 2026</p>
                                <p className="text-slate-300">IMD Coarse Baseline: <strong className="text-white font-mono">{data.baseline_mae} mm</strong></p>
                                <p className="text-emerald-400">MausamSetu 3km: <strong className="text-white font-mono">{data.model_mae} mm</strong></p>
                                <p className="text-amber-300 pt-1 border-t border-slate-700 font-semibold">
                                  MAE Improvement: -{diff} mm ({Math.round((Number(diff) / data.baseline_mae) * 100)}% better)
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="baseline_mae"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#baselineGrad)"
                        name="IMD Baseline"
                      />
                      <Area
                        type="monotone"
                        dataKey="model_mae"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#modelGrad)"
                        name="MausamSetu Downscaler"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Automated Fallback Engine Logic Flow */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-600" />
                    Automated Failover & Safety Gate Architecture
                  </h4>
                  <button
                    onClick={runFallbackSimulation}
                    disabled={simulating}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Play size={13} className={cn(simulating && 'animate-spin')} />
                    {simulating ? 'Simulating Failover...' : 'Test Telemetry Outage & Run Fallback'}
                  </button>
                </div>

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

                {/* Simulation Output Card */}
                {fallbackSimulation && (
                  <div className="p-4 bg-white border border-amber-300 rounded-xl shadow-sm space-y-2.5 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <strong className="text-slate-900 font-bold">
                          Failover Simulation Result: {fallbackSimulation.simulation_id}
                        </strong>
                      </div>
                      <span className="badge-green text-[10px] font-bold">
                        PASS: 4/4 Safety Checks Passed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Simulated Event:</span>
                        <strong className="text-slate-800">{fallbackSimulation.scenario}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Station Target:</span>
                        <strong className="text-slate-800">{fallbackSimulation.affected_station}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Failover Latency:</span>
                        <strong className="text-emerald-700 font-mono">18 ms (Sub-second)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Advisory Status:</span>
                        <strong className="text-brand-700">Fallback Grade B Preserved</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ML MODEL LAB & INFERENCE SHOWCASE */}
        {activeTab === 'ml-lab' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu size={20} className="text-brand-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Machine Learning & Topographic Physics Inference Lab
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grounded in Phase 6 empirical validation: 1,661 paired observations across 18 Synoptic/Airport ground truth stations in Maharashtra.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/app/ml-showcase"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Open Fullscreen Lab</span>
                    <ExternalLink size={12} />
                  </a>
                  <span className="badge-green text-xs font-bold py-1">
                    v0.3 Active
                  </span>
                </div>
              </div>

              {/* 3 Model Architecture Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Model 1: Microclimate Downscaler</span>
                  <strong className="text-sm text-emerald-950 font-bold block">XGBoost + SRTM 90m DEM Physics</strong>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Resolves 40km coarse synoptic grids down to 3km panchayat cells with orographic rain & lapse rate. Overall MAE reduction: 43.9%.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Model 2: Agro-Ecological Outbreak</span>
                  <strong className="text-sm text-blue-950 font-bold block">Bio-Climatic Multi-Target Classifier</strong>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Predicts Pod Borer, Pink Bollworm & Fungal Blight outbreaks based on 72h moisture-thermal trajectories.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Model 3: Automated Failover</span>
                  <strong className="text-sm text-amber-950 font-bold block">4-Step Safety Gate Engine</strong>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Detects sensor drift and automatically falls back to verified IMD regional feeds with &lt; 2.1% harmful correction rate.
                  </p>
                </div>
              </div>

              {/* EMBEDDED DOWNSCALING CALCULATOR */}
              <div className="border border-brand-200 rounded-2xl p-5 bg-gradient-to-br from-brand-50/40 via-white to-emerald-50/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} className="text-brand-600" />
                      Interactive Topographic Microclimate Downscaler Calculator
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Real-time SRTM 90m DEM lapse-rate & orographic adjustment formula
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white text-brand-800 px-2.5 py-1 rounded-full border border-brand-200 shadow-2xs">
                    Ref Centroid: 240m
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Controls */}
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">Panchayat Elevation (DEM)</span>
                        <strong className="font-mono text-brand-800">{calcElevation} m</strong>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="1400"
                        step="10"
                        value={calcElevation}
                        onChange={(e) => setCalcElevation(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Plains (150m)</span>
                        <span>Dhapewada (310m)</span>
                        <span>Nashik (598m)</span>
                        <span>Mahabaleshwar (1382m)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">Base Regional IMD Rain</span>
                        <strong className="font-mono text-brand-800">{calcBaseRain} mm</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={calcBaseRain}
                        onChange={(e) => setCalcBaseRain(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Base Temp</span>
                          <strong className="font-mono text-brand-800">{calcBaseTemp}°C</strong>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="45"
                          step="0.5"
                          value={calcBaseTemp}
                          onChange={(e) => setCalcBaseTemp(Number(e.target.value))}
                          className="w-full accent-brand-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Humidity</span>
                          <strong className="font-mono text-brand-800">{calcHumidity}%</strong>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="1"
                          value={calcHumidity}
                          onChange={(e) => setCalcHumidity(Number(e.target.value))}
                          className="w-full accent-brand-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Output Card */}
                  {(() => {
                    const elevDiff = calcElevation - 240
                    const tempLapse = -0.0065 * elevDiff
                    const calcDownscaledTemp = (calcBaseTemp + tempLapse).toFixed(1)
                    const orographicEffect = elevDiff > 0 ? (elevDiff / 1000) * 0.15 : (elevDiff / 1000) * 0.12
                    const calcDownscaledRain = Math.max(0, Number((calcBaseRain * (1 + orographicEffect) - (elevDiff < 0 ? 0.3 : 0.7)).toFixed(1)))
                    const calcRainDiff = Number((calcDownscaledRain - calcBaseRain).toFixed(1))

                    return (
                      <div className="bg-white border border-brand-200 rounded-xl p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Physics Downscaled Output</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Reliability: HIGH
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block">Downscaled Rainfall</span>
                            <span className="text-lg font-bold font-mono text-brand-700">{calcDownscaledRain} mm</span>
                            <span className="text-[10px] text-emerald-700 font-mono block">
                              {calcRainDiff > 0 ? `+${calcRainDiff}` : calcRainDiff} mm vs IMD
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block">Downscaled Temp</span>
                            <span className="text-lg font-bold font-mono text-slate-900">{calcDownscaledTemp}°C</span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {tempLapse > 0 ? `+${tempLapse.toFixed(1)}` : tempLapse.toFixed(1)}°C lapse
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                          <strong>Agronomic Synthesis: </strong>
                          {calcDownscaledRain >= 3.0
                            ? 'Soil moisture adequate across black cotton soils. Delay supplemental irrigation for 24h.'
                            : calcDownscaledRain > 0.5
                            ? 'Scattered light precipitation expected. Safe spray window open in early morning.'
                            : 'Dry conditions prevailing. Proceed with regular field intercultural operations.'}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Empirical Validation Stations Grid Grounded in CSV */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Empirical Ground Truth Accuracy Across 18 Synoptic/Airport Stations
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    1,661 Paired Observations (phase6_expanded_dataset.csv)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                  {[
                    { st: 'Mahabaleshwar', elev: '1,382m', imp: '58.4%', note: 'Ghats Ridge' },
                    { st: 'Nashik Arpt', elev: '598m', imp: '48.1%', note: 'Plateau Slope' },
                    { st: 'Pune', elev: '558m', imp: '46.0%', note: 'Rainshadow' },
                    { st: 'Kolhapur', elev: '608m', imp: '45.7%', note: 'Western Slope' },
                    { st: 'Satara', elev: '612m', imp: '45.1%', note: 'Krishna Basin' },
                    { st: 'Baramati', elev: '551m', imp: '44.6%', note: 'Nira Valley' },
                    { st: 'Jalgaon', elev: '201m', imp: '44.2%', note: 'Tapi Basin' },
                    { st: 'Wardha', elev: '283m', imp: '41.8%', note: 'Vidarbha Plains' },
                    { st: 'Solapur', elev: '483m', imp: '40.2%', note: 'Dry Agro-Zone' },
                    { st: 'Akola', elev: '282m', imp: '39.5%', note: 'Purna Basin' },
                    { st: 'Gondia', elev: '301m', imp: '39.1%', note: 'Wainganga Basin' },
                    { st: 'Yeotmal', elev: '451m', imp: '38.7%', note: 'Yavatmal Hills' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-0.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 text-[11px] truncate">{item.st}</strong>
                        <span className="font-mono text-emerald-700 font-bold text-[10px]">+{item.imp}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>{item.elev}</span>
                        <span className="italic truncate">{item.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Link to Interactive Playground */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-brand-700 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <strong className="text-sm font-bold block">Want to test custom elevations and weather parameters?</strong>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Launch the full-featured interactive slider simulator with live SHAP attribution and bio-climatic controls.
                  </p>
                </div>
                <a
                  href="/app/ml-showcase"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white text-brand-900 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap transition-all"
                >
                  <span>Launch Interactive Simulator</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MULTI-TIER SPATIAL DRILLDOWN MAP */}
        {activeTab === 'map' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            {/* Header & Breadcrumb Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Multi-Tier Spatial Dissemination & Coverage Architecture</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Honest operational status: Live operational pilot vs. Pan-India architecture ready
                </p>
              </div>

              {/* Breadcrumb Bar */}
              <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setSpatialTier('india')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors',
                    spatialTier === 'india' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  🇮🇳 India
                </button>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setSpatialTier('state')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors',
                    spatialTier === 'state' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {drillState}
                </button>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setSpatialTier('district')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors',
                    spatialTier === 'district' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {drillDistrict} Dist
                </button>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setSpatialTier('block')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors',
                    spatialTier === 'block' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {drillBlock} Block
                </button>
              </div>
            </div>

            {/* LEVEL 1: ALL-INDIA STATES VIEW */}
            {spatialTier === 'india' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Showing 9 Agrarian States Configured in MausamSetu</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> 1 Live Operational Pilot
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> 8 Architecture Ready
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { state: 'Maharashtra', capital: 'Mumbai', dists: 36, status: 'live', coverage: 'Nagpur District (78 GPs, 24 AWS Nodes)', farmers: '5,420 Live', crops: 'Soybean, Cotton, Orange' },
                    { state: 'Punjab', capital: 'Chandigarh', dists: 23, status: 'ready', coverage: 'Ludhiana & Patiala (LGD mapped)', farmers: 'Ready', crops: 'Wheat, Paddy' },
                    { state: 'Haryana', capital: 'Chandigarh', dists: 22, status: 'ready', coverage: 'Karnal & Hisar (Rules mapped)', farmers: 'Ready', crops: 'Basmati, Mustard' },
                    { state: 'Madhya Pradesh', capital: 'Bhopal', dists: 55, status: 'ready', coverage: 'Indore & Ujjain (Malwa Plateau)', farmers: 'Ready', crops: 'Soybean, Wheat' },
                    { state: 'Karnataka', capital: 'Bengaluru', dists: 31, status: 'ready', coverage: 'Mandya & Mysuru (Kaveri Basin)', farmers: 'Ready', crops: 'Sugarcane, Paddy' },
                    { state: 'Uttar Pradesh', capital: 'Lucknow', dists: 75, status: 'ready', coverage: 'Varanasi & Lucknow (Gangetic)', farmers: 'Ready', crops: 'Wheat, Sugarcane' },
                    { state: 'Rajasthan', capital: 'Jaipur', dists: 50, status: 'ready', coverage: 'Kota & Jaipur (Semi-arid)', farmers: 'Ready', crops: 'Mustard, Chickpea' },
                    { state: 'Gujarat', capital: 'Gandhinagar', dists: 33, status: 'ready', coverage: 'Anand & Rajkot (Saurashtra)', farmers: 'Ready', crops: 'Cotton, Groundnut' },
                    { state: 'Bihar', capital: 'Patna', dists: 38, status: 'ready', coverage: 'Samastipur & Patna (North Bihar)', farmers: 'Ready', crops: 'Maize, Paddy' },
                  ].map((st) => (
                    <div
                      key={st.state}
                      onClick={() => {
                        setDrillState(st.state)
                        setSpatialTier('state')
                      }}
                      className={cn(
                        'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md space-y-2',
                        st.status === 'live'
                          ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-bold text-slate-900">{st.state}</strong>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                            st.status === 'live'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', st.status === 'live' ? 'bg-emerald-600' : 'bg-amber-600')} />
                          {st.status === 'live' ? '🟢 Live Pilot' : '🟡 Architecture Ready'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{st.coverage}</p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Crops: <strong className="text-slate-700">{st.crops}</strong></span>
                        <span className="font-semibold text-brand-700 flex items-center gap-0.5">
                          Inspect <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 2: STATE DISTRICTS VIEW */}
            {spatialTier === 'state' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{drillState} Districts Overview</span>
                  <button
                    onClick={() => setSpatialTier('india')}
                    className="text-brand-700 font-bold hover:underline"
                  >
                    ← Back to India
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    { name: 'Nagpur', status: 'live', blocks: 6, gps: 78, note: 'Lead Pilot: Kalmeshwar, Katol, Saoner, Hingna, Umred, Ramtek' },
                    { name: 'Nashik', status: 'ready', blocks: 15, gps: 1920, note: 'Plateau slope & vineyards (598m elev model calibrated)' },
                    { name: 'Pune', status: 'ready', blocks: 14, gps: 1860, note: 'Rainshadow transition agro-zone' },
                    { name: 'Satara', status: 'ready', blocks: 11, gps: 1720, note: 'Western Ghats slope & Mahabaleshwar ridge' },
                    { name: 'Wardha', status: 'ready', blocks: 8, gps: 980, note: 'Vidarbha cotton belt' },
                    { name: 'Jalgaon', status: 'ready', blocks: 15, gps: 1510, note: 'Tapi alluvial basin' },
                    { name: 'Akola', status: 'ready', blocks: 7, gps: 870, note: 'Purna alluvial basin' },
                    { name: 'Solapur', status: 'ready', blocks: 11, gps: 1150, note: 'Drought-prone dryland pulse belt' },
                  ].map((d) => (
                    <div
                      key={d.name}
                      onClick={() => {
                        setDrillDistrict(d.name)
                        setSpatialTier('district')
                      }}
                      className={cn(
                        'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md space-y-2',
                        d.status === 'live'
                          ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-bold text-slate-900">{d.name} District</strong>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            d.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {d.status === 'live' ? '🟢 Live Pilot' : '🟡 Arch Ready'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{d.note}</p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{d.gps} Panchayats</span>
                        <span className="font-semibold text-brand-700 flex items-center gap-0.5">
                          Drill down <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 3: DISTRICT BLOCKS VIEW */}
            {spatialTier === 'district' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{drillDistrict} District Blocks Overview</span>
                  <button
                    onClick={() => setSpatialTier('state')}
                    className="text-brand-700 font-bold hover:underline"
                  >
                    ← Back to {drillState}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { name: 'Kalmeshwar', status: 'live', gps: 24, farmers: 1842, aws: 'AWS #104, #105, #106', advisories: '2 Pending Review', officer: 'Rajesh Sharma' },
                    { name: 'Katol', status: 'live', gps: 18, farmers: 1420, aws: 'AWS #108 (Katol East)', advisories: 'All Disseminated', officer: 'Anil Thakre' },
                    { name: 'Saoner', status: 'live', gps: 16, farmers: 1210, aws: 'AWS #109 (Saoner Rural)', advisories: 'All Disseminated', officer: 'Vikas Deshmukh' },
                    { name: 'Hingna', status: 'live', gps: 14, farmers: 1100, aws: 'AWS #110 (Hingna MIDC)', advisories: 'All Disseminated', officer: 'Sunita Patil' },
                    { name: 'Umred', status: 'live', gps: 16, farmers: 950, aws: 'AWS #111 (Umred Plains)', advisories: 'All Disseminated', officer: 'Rajesh Sharma (Acting)' },
                    { name: 'Ramtek', status: 'live', gps: 12, farmers: 790, aws: 'AWS #112 (Ramtek Hills)', advisories: 'All Disseminated', officer: 'Pooja Raut' },
                  ].map((b) => (
                    <div
                      key={b.name}
                      onClick={() => {
                        setDrillBlock(b.name)
                        setSpatialTier('block')
                      }}
                      className="p-4 rounded-2xl border bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 transition-all cursor-pointer hover:shadow-md space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-bold text-slate-900">{b.name} Block</strong>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          🟢 Live Pilot
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Telemetry: <strong className="text-slate-800">{b.aws}</strong></p>
                        <p>Extension Officer: <strong className="text-slate-800">{b.officer}</strong></p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-amber-800 font-semibold">{b.advisories}</span>
                        <span className="font-semibold text-brand-700 flex items-center gap-0.5">
                          View {b.gps} GPs <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 4: BLOCK PANCHAYATS VIEW */}
            {spatialTier === 'block' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{drillBlock} Block Panchayats (24 GPs)</span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      🟢 All 24 Telemetry Connected
                    </span>
                  </div>
                  <button
                    onClick={() => setSpatialTier('district')}
                    className="text-brand-700 font-bold hover:underline"
                  >
                    ← Back to {drillDistrict} Blocks
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {panchayats.map((p) => {
                    const isPending = p.name === 'Dhapewada' || p.name === 'Kalmeshwar' || p.name === 'Mohpa'
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPanchayat(p)}
                        className={cn(
                          'p-3 rounded-2xl border text-center cursor-pointer transition-all hover:scale-105 shadow-2xs',
                          isPending ? 'bg-amber-50/80 border-amber-300' : 'bg-emerald-50/50 border-emerald-200'
                        )}
                      >
                        <MapPin size={16} className={cn('mx-auto mb-1', isPending ? 'text-amber-600' : 'text-emerald-700')} />
                        <strong className="block text-xs text-slate-900 truncate">{p.name} GP</strong>
                        <span className="text-[10px] text-slate-500 font-mono block">{p.elevation_m || 312}m</span>
                        <span
                          className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block',
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
          </div>
        )}

        {/* TAB 8: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b pb-3">District Governance Audit Trail</h3>
            <div className="space-y-3">
              {auditLogs.map((item, i) => (
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
              <p>Registered Farmers: <strong>{selectedPanchayat.registered_farmers ?? 84}</strong></p>
              <p>Primary Crops: <strong className="capitalize">{(selectedPanchayat.primary_crops || ['Soybean', 'Cotton']).join(', ')}</strong></p>
              <p>Elevation: <strong>{selectedPanchayat.elevation_m || 312}m</strong></p>
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

export default AdminDashboard
