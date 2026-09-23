import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAF8] text-[#111814] relative selection:bg-emerald-200 selection:text-emerald-900">
      {/* Subtle topographic background accent */}
      <div className="absolute inset-0 bg-topo-grid opacity-15 pointer-events-none" aria-hidden="true" />

      {/* Minimal Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" aria-label="MausamSetu Home">
          <div className="w-8 h-8 rounded-lg bg-[#126B3A] flex items-center justify-center text-white shadow-xs transition-colors group-hover:bg-[#0B4F2A]">
            <svg viewBox="0 0 32 32" width="20" height="20" fill="none" aria-hidden="true">
              <path d="M5 22 Q5 10 16 10 Q27 10 27 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M5 22 L5 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M27 22 L27 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="16" cy="17" r="2" fill="#86EFAC" />
              <path d="M16 19 L16 26" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
            </svg>
          </div>
          <span className="font-bold text-base text-[#111814] tracking-tight">
            Mausam<span className="text-[#126B3A]">Setu</span>
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66736B] hover:text-[#126B3A] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>
      </header>

      {/* Main Centered Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <Outlet />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-[11px] text-[#66736B] font-medium border-t border-[#E2E8E4]/60">
        <span>&copy; {new Date().getFullYear()} MausamSetu &middot; Hyperlocal Agro-Meteorological Intelligence</span>
      </footer>
    </div>
  )
}

export default AuthLayout
