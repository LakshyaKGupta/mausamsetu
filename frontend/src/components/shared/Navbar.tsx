import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Button } from './Button'

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'For Farmers', path: '/farmers' },
    { name: 'For Officers', path: '/officers' },
  ]

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8E4] shadow-sm'
          : 'bg-white/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Subtitle */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg sm:text-xl text-[#17201A] tracking-tight">
                  Mausam<span className="text-[#166534]">Setu</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#14532D]">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-[#647067] font-medium hidden sm:block">
                पंचायत स्तरीय कृषि मौसम निर्णय सेवा
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#166534] bg-[#F7FAF7] font-semibold'
                      : 'text-[#17201A] hover:text-[#166534] hover:bg-[#F7FAF7]'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="md">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#17201A] hover:bg-[#F7FAF7] focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#E2E8E4] bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <p className="text-xs text-[#647067] font-medium px-3 pt-2">
            पंचायत स्तरीय कृषि मौसम निर्णय सेवा
          </p>
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2.5 rounded-xl text-base font-medium ${
                    isActive
                      ? 'text-[#166534] bg-[#F7FAF7] font-semibold'
                      : 'text-[#17201A] hover:bg-[#F7FAF7]'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>
          <div className="pt-3 border-t border-[#E2E8E4] flex flex-col gap-2">
            <Link to="/signup" className="w-full">
              <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight size={18} />}>
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="w-full">
              <Button variant="outline" size="lg" className="w-full">
                Login to Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
