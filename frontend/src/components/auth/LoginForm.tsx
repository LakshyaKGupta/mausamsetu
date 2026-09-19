import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, AlertCircle, Phone, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'
import { authApi } from '../../api/client'

export const LoginForm: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'officer' ? 'officer' : 'farmer'

  const [role, setRole] = useState<'farmer' | 'officer'>(initialRole)
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
      setError('Please enter your mobile number or email')
      return
    }

    setLoading(true)

    try {
      if (role === 'officer') {
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
          // If 404 officer not registered, provide friendly dev help
          if (apiErr.response?.status === 404) {
            setError('Officer not registered with this number. In dev demo, use registered officer number: 9876543210')
          } else {
            setError(apiErr.response?.data?.detail || 'Failed to send OTP')
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
      if (role === 'officer') {
        const phone = identifier.replace(/\D/g, '')
        const res = await authApi.verifyOtp(phone, otpValue)
        localStorage.setItem('mausamsetu_token', res.access_token)
        localStorage.setItem('mausamsetu_officer', JSON.stringify(res.officer))
        localStorage.setItem('mausamsetu_role', 'officer')
        navigate('/app/officer')
      } else {
        // Farmer demo verification
        localStorage.setItem('mausamsetu_role', 'farmer')
        localStorage.setItem(
          'mausamsetu_farmer',
          JSON.stringify({
            phone: identifier,
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

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8E4] p-8 sm:p-10 shadow-sm text-left">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#17201A] tracking-tight">Welcome back</h2>
        <p className="text-sm text-[#647067] mt-1">Access your MausamSetu portal account.</p>
      </div>

      {/* Role Toggle Strip */}
      <div className="flex bg-[#F7FAF7] p-1 rounded-xl border border-[#E2E8E4] mb-6">
        <button
          type="button"
          onClick={() => {
            setRole('farmer')
            setStep('identifier')
            setError('')
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            role === 'farmer'
              ? 'bg-white text-[#166534] shadow-sm'
              : 'text-[#647067] hover:text-[#17201A]'
          }`}
        >
          Farmer Login
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('officer')
            setStep('identifier')
            setError('')
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            role === 'officer'
              ? 'bg-white text-[#166534] shadow-sm'
              : 'text-[#647067] hover:text-[#17201A]'
          }`}
        >
          Officer Portal
        </button>
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#17201A] uppercase tracking-wider block mb-1.5">
              {role === 'officer' ? 'Registered Mobile Number' : 'Mobile Number or Email'}
            </label>
            <div className="relative">
              <input
                type={role === 'officer' ? 'tel' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'officer' ? 'e.g. 9876543210' : 'e.g. 9876543210 or name@example.com'}
                autoFocus
                className="w-full py-3 px-4 bg-white border border-[#E2E8E4] rounded-xl text-sm text-[#17201A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-transparent transition-all"
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

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8E4]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#647067]">or</span>
            </div>
          </div>

          {/* Social Continue (Mock/Demo button) */}
          <button
            type="button"
            onClick={() => {
              // Quick demo access
              if (role === 'officer') {
                setIdentifier('9876543210')
              } else {
                setIdentifier('9876543210')
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E2E8E4] bg-[#F7FAF7] hover:bg-slate-100 text-xs font-semibold text-[#17201A] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xs">⚡ Fill Demo Credentials</span>
          </button>

          {/* Footer Link */}
          <div className="pt-4 text-center text-xs text-[#647067]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#166534] font-bold hover:underline">
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
