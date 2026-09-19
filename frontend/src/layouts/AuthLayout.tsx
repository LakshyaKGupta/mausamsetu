import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { CloudRain, ShieldCheck, Cpu, ArrowLeft } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7FAF7]">
      {/* Left: Decorative Agricultural Branding (Visible on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#166534] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle geographic contour pattern */}
        <div className="absolute inset-0 opacity-10 bg-contour-pattern pointer-events-none" />

        {/* Top Back Link & Brand */}
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#DCFCE7] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            <span>Back to MausamSetu Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#166534] flex items-center justify-center font-bold text-2xl shadow-md">
              M
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight text-white">MausamSetu</span>
              <p className="text-xs text-[#DCFCE7] font-medium">
                पंचायत स्तरीय कृषि मौसम निर्णय सेवा
              </p>
            </div>
          </div>
        </div>

        {/* Center: Editorial Product Statement & Illustrated Card */}
        <div className="relative z-10 max-w-md space-y-6 my-auto py-8">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#DCFCE7] bg-[#14532D] px-3 py-1 rounded-full">
              Panchayat-Level Decision Support
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Weather intelligence for every farm, not just your block.
            </h2>
            <p className="text-sm text-[#DCFCE7]/90 leading-relaxed">
              MausamSetu bridges the gap between regional meteorological forecasts and hyper-local crop decisions through spatial downscaling and agricultural extension officer verification.
            </p>
          </div>

          {/* Realistic Micro Weather Mockup */}
          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <p className="text-xs font-semibold text-[#DCFCE7]">Dhapewada Gram Panchayat</p>
                <p className="text-[11px] text-white/70">Kalmeshwar, Nagpur</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck size={12} /> Officer Verified
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudRain size={32} className="text-[#93c5fd]" />
                <div>
                  <span className="text-3xl font-bold">28°C</span>
                  <p className="text-xs text-white/80">Partly Cloudy · 4.2 mm Rain</p>
                </div>
              </div>
              <div className="text-right text-xs text-white/80">
                <p>Humidity: <span className="font-semibold text-white">72%</span></p>
                <p>Wind: <span className="font-semibold text-white">14 km/h</span></p>
              </div>
            </div>

            <div className="text-xs bg-[#14532D]/70 p-2.5 rounded-xl border border-white/10 flex items-start gap-2">
              <span className="text-emerald-300 font-bold">Advisory:</span>
              <span className="text-white/90">
                Moderate rain anticipated. Delay irrigation for Soybean crop today.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#DCFCE7]/80">
          <div className="flex items-center gap-2">
            <Cpu size={14} />
            <span>Downscaled from IMD / Open-Meteo</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span>SIH 2026 Innovation</span>
          </div>
        </div>
      </div>

      {/* Right: Auth Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="w-full max-w-md lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-[#166534] font-medium mb-4">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-lg">
              M
            </div>
            <div>
              <span className="font-bold text-lg text-[#17201A]">MausamSetu</span>
              <p className="text-[10px] text-[#647067]">पंचायत स्तरीय कृषि मौसम निर्णय सेवा</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
