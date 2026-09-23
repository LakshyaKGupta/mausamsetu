import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, AlertCircle, Phone, Mail, ShieldCheck, Sprout, Building2, Sparkles } from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'
import { authApi } from '../../api/client'

export const LoginForm: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialRoleParam = searchParams.get('role')
  const initialRole =
    initialRoleParam === 'admin'
      ? 'admin'
      : initialRoleParam === 'officer'
      ? 'officer'
      : 'farmer'

  const [role, setRole] = useState<'farmer' | 'officer' | 'admin'>(initialRole)
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanInput = identifier.trim()
    if (!cleanInput) {
      setError(
        role === 'admin'
          ? 'Please enter district admin username, email, or mobile'
          : 'Please enter your mobile number or email'
      )
      return
    }

    setLoading(true)

    try {
      if (role === 'admin') {
        // District Admin verification flow (Direct demo OTP)
        setDevOtp('123456')
        setStep('otp')
      } else if (role === 'officer') {
        // Officer uses the backend auth API
        const phone = cleanInput.replace(/\D/g, '')
        if (!phone.match(/^[6-9]\d{9}$/)) {
          setError('Enter a valid 10-digit Indian mobile number for officer login')
          setLoading(false)
          return
        }

        try {
          const res = await authApi.requestOtp(phone)
          const match = res.message.match(/\d{6}/)
          if (match) setDevOtp(match[0])
          else setDevOtp('123456') // Dev fallback
          setStep('otp')
        } catch (apiErr: any) {
          if (apiErr.response?.status === 404) {
            setError('Officer not registered with this number. In demo mode, use: 9876543210')
          } else {
            // If backend is in local SQLite fallback or unreachable, allow graceful dev demo
            setDevOtp('123456')
            setStep('otp')
          }
        }
      } else {
        // Farmer login: simulated SMS OTP in demo mode
        setDevOtp('123456')
        setStep('otp')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otpValue: string) => {
    setLoading(true)
    setError('')

    try {
      if (role === 'admin') {
        // Admin verification
        if (otpValue === '123456' || otpValue.length === 6) {
          localStorage.setItem('mausamsetu_role', 'admin')
          localStorage.setItem(
            'mausamsetu_admin',
            JSON.stringify({
              username: identifier || 'admin@nagpur.gov.in',
              name: 'Dr. Suresh Patil',
              role: 'District Collector & Agromet Director',
              district: 'Nagpur',
            })
          )
          navigate('/app/admin')
        } else {
          setError('Invalid verification code. Use 123456 in demo mode.')
        }
      } else if (role === 'officer') {
        const phone = identifier.replace(/\D/g, '')
        try {
          const res = await authApi.verifyOtp(phone, otpValue)
          localStorage.setItem('mausamsetu_token', res.access_token)
          localStorage.setItem('mausamsetu_officer', JSON.stringify(res.officer))
          localStorage.setItem('mausamsetu_role', 'officer')
          navigate('/app/officer')
        } catch (apiErr: any) {
          // If offline / dev fallback
          if (otpValue === '123456') {
            localStorage.setItem('mausamsetu_token', 'demo_officer_token_123')
            localStorage.setItem(
              'mausamsetu_officer',
              JSON.stringify({
                id: 1,
                name: 'Rajesh Sharma',
                phone: phone || '9876543210',
                block: 'Nagpur Rural',
                district: 'Nagpur',
              })
            )
            localStorage.setItem('mausamsetu_role', 'officer')
            navigate('/app/officer')
          } else {
            setError(apiErr.response?.data?.detail || 'Invalid verification code')
          }
        }
      } else {
        // Farmer demo verification
        localStorage.setItem('mausamsetu_role', 'farmer')
        localStorage.setItem(
          'mausamsetu_farmer',
          JSON.stringify({
            phone: identifier || '9876543210',
            name: 'Ramesh Patel',
            panchayat: 'Dhapewada',
            block: 'Kalmeshwar',
            district: 'Nagpur',
            crop: 'Soybean',
            language: 'hi',
          })
        )
        navigate('/app/farmer')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  // Quick 1-click demo login helpers
  const handleQuickDemo = (demoRole: 'farmer' | 'officer' | 'admin') => {
    if (demoRole === 'farmer') {
      localStorage.setItem('mausamsetu_role', 'farmer')
      localStorage.setItem(
        'mausamsetu_farmer',
        JSON.stringify({
          phone: '9876543210',
          name: 'Ramesh Patel',
          panchayat: 'Dhapewada',
          block: 'Kalmeshwar',
          district: 'Nagpur',
          crop: 'Soybean',
          language: 'hi',
        })
      )
      navigate('/app/farmer')
    } else if (demoRole === 'officer') {
      localStorage.setItem('mausamsetu_token', 'demo_officer_token_123')
      localStorage.setItem(
        'mausamsetu_officer',
        JSON.stringify({
          id: 1,
          name: 'Rajesh Sharma',
          phone: '9876543210',
          block: 'Nagpur Rural',
          district: 'Nagpur',
        })
      )
      localStorage.setItem('mausamsetu_role', 'officer')
      navigate('/app/officer')
    } else if (demoRole === 'admin') {
      localStorage.setItem('mausamsetu_role', 'admin')
      localStorage.setItem(
        'mausamsetu_admin',
        JSON.stringify({
          username: 'admin@nagpur.gov.in',
          name: 'Dr. Suresh Patil',
          role: 'District Collector & Agromet Director',
          district: 'Nagpur',
        })
      )
      navigate('/app/admin')
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8E4] p-6 sm:p-10 shadow-sm text-left max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#111814] tracking-tight">Portal Sign In</h2>
        <p className="text-sm text-[#647067] mt-1">
          Select your role to access your personalized MausamSetu dashboard.
        </p>
      </div>

      {/* 3-Way Role Toggle Strip (Farmer, Officer, Admin) */}
      <div className="grid grid-cols-3 bg-[#F4F7F4] p-1 rounded-2xl border border-[#E2E8E4] mb-6 gap-1">
        <button
          type="button"
          onClick={() => {
            setRole('farmer')
            setStep('identifier')
            setError('')
          }}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            role === 'farmer'
              ? 'bg-white text-[#126B3A] shadow-xs'
              : 'text-[#647067] hover:text-[#111814]'
          }`}
        >
          <Sprout size={14} className={role === 'farmer' ? 'text-[#126B3A]' : 'text-slate-400'} />
          <span>Farmer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('officer')
            setStep('identifier')
            setError('')
          }}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            role === 'officer'
              ? 'bg-white text-[#126B3A] shadow-xs'
              : 'text-[#647067] hover:text-[#111814]'
          }`}
        >
          <ShieldCheck size={14} className={role === 'officer' ? 'text-[#126B3A]' : 'text-slate-400'} />
          <span>Officer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('admin')
            setStep('identifier')
            setError('')
          }}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            role === 'admin'
              ? 'bg-white text-purple-800 shadow-xs'
              : 'text-[#647067] hover:text-[#111814]'
          }`}
        >
          <Building2 size={14} className={role === 'admin' ? 'text-purple-700' : 'text-slate-400'} />
          <span>Admin</span>
        </button>
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1.5">
              {role === 'admin'
                ? 'Admin Username / Email / Mobile'
                : role === 'officer'
                ? 'Registered Officer Mobile'
                : 'Farmer Mobile or Email'}
            </label>
            <div className="relative">
              <input
                type={role === 'officer' ? 'tel' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  role === 'admin'
                    ? 'e.g. admin@nagpur.gov.in'
                    : role === 'officer'
                    ? 'e.g. 9876543210'
                    : 'e.g. 9876543210 or name@example.com'
                }
                autoFocus
                className="w-full py-3 px-4 bg-white border border-[#E2E8E4] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loading}
            rightIcon={<ArrowRight size={18} />}
          >
            Continue
          </Button>

          {/* Instant 1-Click Sandbox Logins */}
          <div className="pt-2">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8E4]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-2.5 text-[#647067] font-semibold">Instant Demo Access</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="py-2.5 px-3 rounded-xl border border-[#D1EAD7] bg-[#F0FDF4] hover:bg-emerald-100 text-xs font-bold text-[#126B3A] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Sprout size={14} />
                <span>Enter as Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-800 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Building2 size={14} />
                <span>Enter as Admin</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleQuickDemo('officer')}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-[#E2E8E4] bg-[#F7FAF7] hover:bg-slate-100 text-xs font-semibold text-[#111814] transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={14} className="text-[#126B3A]" />
              <span>Enter as Agricultural Extension Officer</span>
            </button>
          </div>

          {/* Footer Link */}
          <div className="pt-4 text-center text-xs text-[#647067]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#126B3A] font-bold hover:underline">
              Create account
            </Link>
          </div>
        </form>
      ) : (
        <OTPVerification
          identifier={identifier}
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
    </div>
  )
}
