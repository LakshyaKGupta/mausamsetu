import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Button } from './Button'

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      // Scroll progress
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)))
      }

      // Robust viewport-based active section detection
      const sections = ['downscaling', 'decision-intelligence', 'verification', 'experience']
      const navThreshold = 180

      let currentFound = ''
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el) {
          const rect = el.getBoundingClientRect()
          // Check if top of section is near viewport top or currently spanning viewport
          if (rect.top <= navThreshold && rect.bottom > navThreshold) {
            currentFound = sectionId
            break
          }
        }
      }

      if (window.scrollY < 250) {
        setActiveSection('')
      } else if (currentFound) {
        setActiveSection(currentFound)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { name: 'How It Works', id: 'downscaling' },
    { name: 'Crop Intelligence', id: 'decision-intelligence' },
    { name: 'Verification', id: 'verification' },
    { name: 'Platform', id: 'experience' },
  ]

  const handleNavClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
    } else {
      const element = document.getElementById(id)
      if (element) {
        const navOffset = 80
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - navOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8E4] shadow-xs'
          : 'bg-white/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      {/* Scroll Progress Bar */}
      <div
        className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-[#166534] via-[#22C55E] to-[#86EFAC] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none" aria-label="MausamSetu home">
            {/* Geometric Mark: M + bridge arch + rain-drop negative space */}
            <div className="w-9 h-9 rounded-xl bg-[#126B3A] flex items-center justify-center shadow-sm transition-all duration-200 group-hover:bg-[#0B4F2A]">
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
            <span className="font-bold text-[1.1rem] text-[#111814] tracking-tight">
              Mausam<span className="text-[#126B3A]">Setu</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleNavClick(link.id, e)}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[#166534] bg-emerald-50 font-bold shadow-xs'
                      : 'text-[#3D4A41] hover:text-[#166534] hover:bg-[#F0FDF4]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#166534] transition-all" />
                  )}
                </a>
              )
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="md">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile/Tablet Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#17201A] hover:bg-[#F0FDF4] focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E2E8E4] bg-white/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleNavClick(link.id, e)}
                  className={`px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'text-[#166534] bg-emerald-50 font-bold'
                      : 'text-[#17201A] hover:bg-[#F7FAF7]'
                  }`}
                >
                  {link.name}
                </a>
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
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
