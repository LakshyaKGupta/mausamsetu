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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                M
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
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/farmers" className="hover:text-white transition-colors">
                  For Farmers
                </Link>
              </li>
              <li>
                <Link to="/officers" className="hover:text-white transition-colors">
                  For Agricultural Officers
                </Link>
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
                <Link to="/app/farmer" className="hover:text-white transition-colors">
                  Farmer PWA App
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Officer Portal Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Farmer Registration
                </Link>
              </li>
              <li>
                <Link to="/app/admin" className="hover:text-white transition-colors">
                  District Admin Overview
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
              MausamSetu downscales coarse weather models utilizing local topography and micro-climate parameters, verified by Block Agricultural Extension Officers before field dissemination.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#9ca89f]">
              <MapPin size={14} className="text-[#4ade80]" />
              <span>Pilot deployment: Nagpur District, Maharashtra</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ca89f]">
          <p>© 2026 MausamSetu. Developed for Smart India Hackathon (SIH 2026).</p>
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
