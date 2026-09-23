import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Home, Shield, Sprout, Building2 } from 'lucide-react'

export const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine user role from path or local storage
  const isOfficer = location.pathname.startsWith('/app/officer') || location.pathname.startsWith('/officer')
  const isAdmin = location.pathname.startsWith('/app/admin') || location.pathname.startsWith('/admin')
  
  let roleLabel = 'Farmer Advisory PWA'
  let roleIcon = Sprout
  let roleColor = 'text-[#166534] bg-[#DCFCE7]'

  if (isAdmin) {
    roleLabel = 'District Admin Console'
    roleIcon = Building2
    roleColor = 'text-purple-800 bg-purple-100'
  } else if (isOfficer) {
    roleLabel = 'Agricultural Officer Portal'
    roleIcon = Shield
    roleColor = 'text-[#166534] bg-[#DCFCE7]'
  }

  const RoleIcon = roleIcon

  const handleLogout = () => {
    localStorage.removeItem('mausamsetu_token')
    localStorage.removeItem('mausamsetu_officer')
    localStorage.removeItem('mausamsetu_farmer')
    localStorage.removeItem('mausamsetu_admin')
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
              <div className="w-8 h-8 rounded-lg bg-[#126B3A] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#0B4F2A] transition-colors">
                M
              </div>
              <span className="font-bold text-base text-[#111814] tracking-tight">
                Mausam<span className="text-[#126B3A]">Setu</span>
              </span>
            </Link>
            <span className="text-[#E2E8E4]">|</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor}`}>
              <RoleIcon size={12} />
              <span>{roleLabel}</span>
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
