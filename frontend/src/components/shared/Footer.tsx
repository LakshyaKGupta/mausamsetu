import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, MapPin, Heart } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#17201A] text-white border-t border-[#2A372E] pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-[#2A372E]">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#126B3A] flex items-center justify-center shadow-md shadow-emerald-950/30">
                <svg viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden="true">
                  {/* Bridge arch */}
                  <path d="M5 22 Q5 10 16 10 Q27 10 27 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  {/* M letterform uprights */}
                  <path d="M5 22 L5 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M27 22 L27 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  {/* Rain drop */}
                  <circle cx="16" cy="17" r="2" fill="#86EFAC" />
                  <path d="M16 19 L16 26" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
                </svg>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Mausam<span className="text-[#4ade80]">Setu</span>
              </span>
            </div>
            <p className="text-sm text-[#9ca89f] leading-relaxed">
              पंचायत स्तरीय कृषि मौसम निर्णय सेवा (Panchayat-Level Agricultural Weather Decision Support System).
            </p>
            <div className="flex items-center gap-2 text-xs text-[#9ca89f]">
              <ShieldCheck size={16} className="text-[#4ade80]" />
              <span>Officer-Verified Advisory Pipeline</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#4ade80] mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-[#cbd5ce]">
              <li>
                <a href="/#downscaling" className="hover:text-white transition-colors">
                  Geographic Downscaling
                </a>
              </li>
              <li>
                <a href="/#decision-intelligence" className="hover:text-white transition-colors">
                  Decision Intelligence
                </a>
              </li>
              <li>
                <a href="/#verification" className="hover:text-white transition-colors">
                  Human Verification
                </a>
              </li>
              <li>
                <a href="/#experience" className="hover:text-white transition-colors">
                  Farmer & Officer Portals
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals & Access */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#4ade80] mb-4">
              Applications
            </h4>
            <ul className="space-y-2.5 text-sm text-[#cbd5ce]">
              <li>
                <Link to="/login?role=farmer" className="hover:text-white transition-colors">
                  Farmer Advisory Sign In
                </Link>
              </li>
              <li>
                <Link to="/login?role=officer" className="hover:text-white transition-colors">
                  Agricultural Officer Portal
                </Link>
              </li>
              <li>
                <Link to="/login?role=admin" className="hover:text-white transition-colors">
                  District Admin Console
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  New User Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Public Service Notice */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#4ade80] mb-4">
              Governance & Data
            </h4>
            <p className="text-xs text-[#9ca89f] leading-relaxed mb-3">
              MausamSetu downscales coarse weather models utilising local topography and micro-climate parameters, verified by Block Agricultural Extension Officers before field dissemination.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#9ca89f]">
              <MapPin size={14} className="text-[#4ade80]" />
              <span>Designed for India's rural agricultural communities</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ca89f]">
          <p>© 2026 MausamSetu. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Built with <Heart size={12} className="text-red-400 fill-red-400" /> for Indian Farmers
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
