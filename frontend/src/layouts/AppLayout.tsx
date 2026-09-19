import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Home } from 'lucide-react'

export const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine user role from path or local storage
  const isOfficer = location.pathname.startsWith('/app/officer') || location.pathname.startsWith('/officer')
  const roleLabel = isOfficer ? 'Agricultural Officer Portal' : 'Farmer Advisory PWA'

  const handleLogout = () => {
    localStorage.removeItem('mausamsetu_token')
    localStorage.removeItem('mausamsetu_officer')
    localStorage.removeItem('mausamsetu_farmer')
    localStorage.removeItem('mausamsetu_role')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-[#E2E8E4] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#166534] text-white flex items-center justify-center font-bold text-base shadow-sm">
                M
              </div>
              <span className="font-bold text-base text-[#17201A]">MausamSetu</span>
            </Link>
            <span className="text-[#E2E8E4]">|</span>
            <span className="text-xs font-semibold text-[#166534] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="text-xs font-medium text-[#647067] hover:text-[#17201A] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Home size={14} />
              <span className="hidden sm:inline">Public Website</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* App Body */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
