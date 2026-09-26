import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Sprout, 
  Building2, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles,
  Smartphone,
  Check
} from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'
import { authApi } from '@/api/client'

export const LoginForm: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role')

  // Auto-detect role from query parameter (e.g. /login?role=officer or /login?role=admin)
  const [authMode, setAuthMode] = useState<'farmer' | 'institutional'>(() => {
    return initialRole === 'officer' || initialRole === 'admin' ? 'institutional' : 'farmer'
  })
  
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier')
  
  // Farmer State
  const [phone, setPhone] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  
  // Institutional State
  const [username, setUsername] = useState(() => {
    if (initialRole === 'admin') return 'MS-ADMIN-HQ'
    if (initialRole === 'officer') return 'MS-OFFICER-001'
    return ''
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (initialRole === 'officer' || initialRole === 'admin') {
      setAuthMode('institutional')
      if (initialRole === 'admin' && !username) setUsername('MS-ADMIN-HQ')
      if (initialRole === 'officer' && !username) setUsername('MS-OFFICER-001')
    }
  }, [initialRole])

  // --- Farmer Flow ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const cleanInput = phone.trim().replace(/\D/g, '')
    if (!cleanInput || cleanInput.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      await authApi.requestOtp(cleanInput)
      setDevOtp('123456') // Dev mode fallback
      setStep('otp')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to request OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otpValue: string) => {
    setLoading(true)
    setError('')
    const cleanInput = phone.trim().replace(/\D/g, '')
    try {
      const data = await authApi.verifyOtp(cleanInput, otpValue)
      handleSuccessfulLogin(data)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Needs signup
        navigate('/signup', { state: { phone: cleanInput } })
      } else {
        setError(err?.response?.data?.detail || 'Verification failed. Please check OTP.')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Institutional Flow ---
  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter both Officer/Admin ID and Password')
      return
    }
    setLoading(true)
    try {
      const data = await authApi.institutionalLogin(username.trim(), password)
      handleSuccessfulLogin(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid Officer/Admin ID or Password')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessfulLogin = (data: any) => {
    localStorage.setItem('mausamsetu_token', data.access_token)
    localStorage.setItem('mausamsetu_role', data.role)
    localStorage.setItem('mausamsetu_user', JSON.stringify(data))

    if (data.role === 'admin') {
      localStorage.setItem('mausamsetu_admin', JSON.stringify(data))
      navigate('/app/admin')
    } else if (data.role === 'officer') {
      localStorage.setItem('mausamsetu_officer', JSON.stringify(data))
      navigate('/app/officer')
    } else {
      localStorage.setItem('mausamsetu_farmer', JSON.stringify(data))
      navigate('/app/farmer')
    }
  }

  const handleQuickDemo = async (demoRole: 'farmer' | 'officer' | 'admin') => {
    setLoading(true)
    setError('')
    try {
      const data = await authApi.demoSession(demoRole)
      handleSuccessfulLogin(data)
    } catch (err) {
      console.warn('Backend demo session fallback triggered:', err)
      // Fallback local session if backend offline
      const fallbackData = {
        access_token: `demo_${demoRole}_token_${Date.now()}`,
        role: demoRole,
        name: demoRole === 'admin' ? 'District Collector Nagpur' : demoRole === 'officer' ? 'Pravin Deshmukh (AAO)' : 'Ramesh Patil',
        district: 'नागपुर',
        block: 'कलमेश्वर',
        panchayat: 'धापेवाड़ा'
      }
      handleSuccessfulLogin(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 sm:p-8 shadow-sm text-left w-full mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#126B3A] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Sparkles size={11} className="text-[#10B981]" />
            MausamSetu Portal
          </span>
          <span className="text-[11px] text-[#66736B] font-medium">Secure Access</span>
        </div>
        
        <h1 className="text-2xl font-bold text-[#111814] tracking-tight">
          Sign In
        </h1>
        <p className="text-xs text-[#66736B] mt-1">
          Select your portal account type to continue
        </p>

        {/* Segmented Role Tabs */}
        {step === 'identifier' && (
          <div className="grid grid-cols-2 gap-1.5 bg-[#F1F5F2] p-1.5 rounded-2xl mt-5 border border-[#E2E8E4]">
            {/* Farmer Tab */}
            <button
              type="button"
              onClick={() => { setAuthMode('farmer'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                authMode === 'farmer'
                  ? 'bg-white text-[#126B3A] shadow-xs font-bold border border-[#DCFCE7]'
                  : 'text-[#526057] hover:text-[#111814] font-medium hover:bg-white/50'
              }`}
            >
              <Sprout size={16} className={authMode === 'farmer' ? 'text-[#126B3A]' : 'text-[#647067]'} />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-bold">किसान / Farmer</span>
                <span className="text-[10px] opacity-75 font-normal">Phone OTP</span>
              </div>
            </button>

            {/* Officer & Admin Tab */}
            <button
              type="button"
              onClick={() => { setAuthMode('institutional'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                authMode === 'institutional'
                  ? 'bg-white text-[#126B3A] shadow-xs font-bold border border-[#DCFCE7]'
                  : 'text-[#526057] hover:text-[#111814] font-medium hover:bg-white/50'
              }`}
            >
              <Building2 size={16} className={authMode === 'institutional' ? 'text-[#126B3A]' : 'text-[#647067]'} />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-bold">अधिकारी / Officer</span>
                <span className="text-[10px] opacity-75 font-normal">ID & Password</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {step === 'identifier' ? (
        authMode === 'farmer' ? (
          /* =========================================================================
             FARMER FORM (PHONE + OTP)
             ========================================================================= */
          <form onSubmit={handleRequestOtp} className="space-y-4 animate-slide-up-fade">
            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1.5 flex items-center justify-between">
                <span>पंजीकृत मोबाइल नंबर (Mobile Number)</span>
                <span className="text-[10px] text-[#126B3A] font-medium">10 Digits</span>
              </label>

              <div className="relative flex rounded-xl border border-[#D1D5DB] focus-within:border-[#126B3A] focus-within:ring-2 focus-within:ring-[#126B3A]/20 transition-all bg-white overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-[#E2E8E4] text-xs font-bold text-slate-700 select-none flex-shrink-0">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  autoFocus
                  className="w-full py-2.5 px-3 text-sm text-[#111814] placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#66736B] leading-relaxed">
              We will send a 6-digit OTP to verify your mobile number. No password required.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center shadow-xs"
              isLoading={loading}
              rightIcon={<ArrowRight size={16} />}
            >
              Continue with OTP
            </Button>

            <div className="text-center pt-1">
              <span className="text-xs text-[#66736B]">
                New farmer on MausamSetu?{' '}
                <Link to="/signup" className="text-[#126B3A] font-bold hover:underline">
                  Register here
                </Link>
              </span>
            </div>
          </form>
        ) : (
          /* =========================================================================
             INSTITUTIONAL FORM (OFFICER & ADMIN)
             ========================================================================= */
          <form onSubmit={handleInstitutionalSubmit} className="space-y-4 animate-slide-up-fade">
            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1.5">
                Officer / Admin Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. MS-OFFICER-001 or MS-ADMIN-HQ"
                  autoFocus
                  className="w-full py-2.5 px-3.5 bg-white border border-[#D1D5DB] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#111814]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setPassword('demo123')}
                  className="text-[10px] text-[#126B3A] font-medium hover:underline cursor-pointer"
                >
                  Use Demo: demo123
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-3.5 pr-10 bg-white border border-[#D1D5DB] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#66736B] leading-relaxed">
              Restricted to Agricultural Officers, Block Coordinators, and District Administration.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center shadow-xs"
              isLoading={loading}
              rightIcon={<ArrowRight size={16} />}
            >
              Sign In Securely
            </Button>
          </form>
        )
      ) : (
        /* =========================================================================
           OTP VERIFICATION STEP
           ========================================================================= */
        <OTPVerification
          identifier={`+91 ${phone}`}
          devOtp={devOtp}
          isLoading={loading}
          error={error}
          onVerify={handleVerifyOtp}
          onResend={() => handleRequestOtp({ preventDefault: () => {} } as any)}
          onChangeIdentifier={() => {
            setStep('identifier')
            setDevOtp(null)
            setError('')
          }}
        />
      )}

      {/* =========================================================================
         HACKATHON DEMO ACCESS (1-CLICK DIRECT SWITCH)
         ========================================================================= */}
      <div className="mt-6 pt-5 border-t border-[#F1F5F2]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
              Hackathon 1-Click Demo
            </span>
          </div>
          <span className="text-[10px] text-[#66736B] font-medium">Instant Role Access</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Farmer Demo */}
          <button
            type="button"
            onClick={() => handleQuickDemo('farmer')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#D1E0D5] bg-[#F7FAF7] hover:bg-[#EEF5EF] hover:border-[#126B3A] transition-all text-center cursor-pointer group shadow-2xs active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#126B3A] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Sprout size={16} />
            </div>
            <span className="text-xs font-bold text-[#111814]">Farmer</span>
            <span className="text-[10px] text-[#66736B] font-medium">Dhapewada</span>
          </button>

          {/* Officer Demo */}
          <button
            type="button"
            onClick={() => handleQuickDemo('officer')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#D1E0D5] bg-[#F7FAF7] hover:bg-[#EEF5EF] hover:border-[#126B3A] transition-all text-center cursor-pointer group shadow-2xs active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <UserCheck size={16} />
            </div>
            <span className="text-xs font-bold text-[#111814]">Officer</span>
            <span className="text-[10px] text-[#66736B] font-medium">Kalmeshwar</span>
          </button>

          {/* Admin Demo */}
          <button
            type="button"
            onClick={() => handleQuickDemo('admin')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-600 transition-all text-center cursor-pointer group shadow-2xs active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
            <span className="text-xs font-bold text-purple-900">Admin</span>
            <span className="text-[10px] text-purple-600 font-medium">Nagpur HQ</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
