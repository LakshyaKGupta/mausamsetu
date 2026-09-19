import React from 'react'
import { ShieldCheck, Database, Cpu, CheckCircle2, AlertCircle, BarChart2, Server, MapPin, RefreshCw } from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const systems = [
    { name: 'IMD API Gateway', status: 'Operational', latency: '142 ms', uptime: '99.9%' },
    { name: 'Open-Meteo High-Res Feed', status: 'Connected', latency: '88 ms', uptime: '100%' },
    { name: 'SRTM 30m DEM Elevation Cache', status: 'Active', latency: '< 5 ms', uptime: '100%' },
    { name: 'ML Spatial Downscaler (XGBoost)', status: 'Online', latency: '32 ms', uptime: '99.8%' },
    { name: 'SMS / WhatsApp Notification Gateway', status: 'Operational', latency: '210 ms', uptime: '99.5%' },
  ]

  const panchayatStats = [
    { block: 'Kalmeshwar', total: 24, verified: 22, pending: 2, error: '±0.9 mm' },
    { block: 'Saoner', total: 20, verified: 18, pending: 2, error: '±1.2 mm' },
    { block: 'Katol', total: 18, verified: 16, pending: 2, error: '±1.1 mm' },
    { block: 'Ramtek', total: 16, verified: 15, pending: 1, error: '±0.8 mm' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E4] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#166534] uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>District Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17201A]">
            Nagpur District Weather Intelligence System
          </h1>
          <p className="text-xs sm:text-sm text-[#647067] mt-0.5">
            Real-time monitoring of downscaling pipelines, sensor networks, and officer verification status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
            All Systems Healthy
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-sm">
          <p className="text-xs text-[#647067] font-semibold">Total Panchayats Monitored</p>
          <p className="text-3xl font-extrabold text-[#17201A] mt-1">78</p>
          <p className="text-[11px] text-[#166534] mt-1 font-medium">Across 4 Pilot Blocks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-sm">
          <p className="text-xs text-[#647067] font-semibold">Advisories Verified Today</p>
          <p className="text-3xl font-extrabold text-[#166534] mt-1">71 / 78</p>
          <p className="text-[11px] text-[#14532D] mt-1 font-medium">91% Coverage (7 Pending)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-sm">
          <p className="text-xs text-[#647067] font-semibold">AWS Ground Stations</p>
          <p className="text-3xl font-extrabold text-[#17201A] mt-1">12</p>
          <p className="text-[11px] text-[#166534] mt-1 font-medium">Real-time Telemetry Synced</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-sm">
          <p className="text-xs text-[#647067] font-semibold">Mean Downscaling Error</p>
          <p className="text-3xl font-extrabold text-[#2563EB] mt-1">±1.0 mm</p>
          <p className="text-[11px] text-[#1e40af] mt-1 font-medium">Within ±E80 Target</p>
        </div>
      </div>

      {/* System Infrastructure Table */}
      <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4">
          <h3 className="text-base font-bold text-[#17201A] flex items-center gap-2">
            <Server size={18} className="text-[#166534]" />
            Pipeline & Service Health
          </h3>
          <span className="text-xs text-[#647067]">Last refreshed 1 min ago</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8E4] text-[#647067] uppercase font-bold">
                <th className="pb-3">Service</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E4]">
              {systems.map((s) => (
                <tr key={s.name} className="hover:bg-[#F7FAF7]">
                  <td className="py-3 font-semibold text-[#17201A]">{s.name}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[#14532D] bg-[#DCFCE7] px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle2 size={12} /> {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#647067] font-mono">{s.latency}</td>
                  <td className="py-3 text-[#17201A] font-medium">{s.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Progress Table */}
      <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-4">
          <h3 className="text-base font-bold text-[#17201A] flex items-center gap-2">
            <MapPin size={18} className="text-[#166534]" />
            Block-Level Dissemination Status
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8E4] text-[#647067] uppercase font-bold">
                <th className="pb-3">Block</th>
                <th className="pb-3">Panchayats</th>
                <th className="pb-3">Verified</th>
                <th className="pb-3">Pending</th>
                <th className="pb-3">Avg Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E4]">
              {panchayatStats.map((b) => (
                <tr key={b.block} className="hover:bg-[#F7FAF7]">
                  <td className="py-3 font-bold text-[#17201A]">{b.block}</td>
                  <td className="py-3 text-[#647067]">{b.total}</td>
                  <td className="py-3 text-[#166534] font-semibold">{b.verified}</td>
                  <td className="py-3 text-[#D97706] font-semibold">{b.pending}</td>
                  <td className="py-3 font-mono text-[#647067]">{b.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
