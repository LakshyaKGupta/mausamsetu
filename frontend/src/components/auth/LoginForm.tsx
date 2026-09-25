import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, ShieldCheck, UserCheck, Sprout } from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'
import { authApi } from '@/api/client'

export const LoginForm: React.FC = () => {
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier')
  const [phone, setPhone] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanInput = phone.trim()
    if (!cleanInput) {
      setError('Please enter your mobile number or ID')
      return
    }

    setLoading(true)
    try {
      // In dev/hackathon mode, OTP is always 123456
      setDevOtp('123456')
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

    try {
      const data = await authApi.login(phone, otpValue)
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
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Verification failed. Use 123456 for demo.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async (demoRole: 'farmer' | 'officer' | 'admin') => {
    setLoading(true)
    try {
      const data = await authApi.demoSession(demoRole)
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
    } catch {
      // Fallback local session if backend offline
      if (demoRole === 'admin') {
        localStorage.setItem('mausamsetu_role', 'admin')
        navigate('/app/admin')
      } else if (demoRole === 'officer') {
        localStorage.setItem('mausamsetu_role', 'officer')
        navigate('/app/officer')
      } else {
        localStorage.setItem('mausamsetu_role', 'farmer')
        navigate('/app/farmer')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 shadow-xs text-left max-w-md mx-auto">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#111814] tracking-tight">Sign in to MausamSetu</h1>
        <p className="text-xs text-[#66736B] mt-1">
          Enter your registered mobile number. Your account role is verified automatically.
        </p>
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1">
              Registered Mobile Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9812345678"
              autoFocus
              className="w-full py-2.5 px-3.5 bg-white border border-[#D1D5DB] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
            />

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center"
            isLoading={loading}
            rightIcon={<ArrowRight size={16} />}
          >
            Continue with OTP
          </Button>

          {/* Hackathon Demo Access Switcher */}
          <div className="mt-6 pt-5 border-t border-[#F1F5F2]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                Hackathon Demo Access
              </span>
              <span className="text-[10px] text-[#66736B]">1-Click Login</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#D1E0D5] bg-[#F7FAF7] hover:bg-[#EEF5EF] hover:border-[#126B3A] transition-all text-center cursor-pointer group"
              >
                <Sprout size={16} className="text-[#126B3A] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-[#111814]">Farmer</span>
                <span className="text-[10px] text-[#66736B]">Dhapewada</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('officer')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#D1E0D5] bg-[#F7FAF7] hover:bg-[#EEF5EF] hover:border-[#126B3A] transition-all text-center cursor-pointer group"
              >
                <UserCheck size={16} className="text-[#0D5C30] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-[#111814]">Officer</span>
                <span className="text-[10px] text-[#66736B]">Kalmeshwar</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-600 transition-all text-center cursor-pointer group"
              >
                <ShieldCheck size={16} className="text-purple-700 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-purple-900">Admin</span>
                <span className="text-[10px] text-purple-600">Nagpur HQ</span>
              </button>
            </div>
          </div>

          {/* Footer Security Note & Signup Link */}
          <div className="pt-3 border-t border-[#F1F5F2] space-y-2 text-center">
            <p className="text-[11px] text-[#85928A] leading-relaxed">
              Public registration is for Farmers. Field Officers and District Administrators use department-authorized credentials.
            </p>
            <div className="text-xs text-[#66736B]">
              New farmer?{' '}
              <Link to="/signup" className="text-[#126B3A] font-bold hover:underline">
                Create Farmer Account
              </Link>
            </div>
          </div>
        </form>
      ) : (
        <OTPVerification
          identifier={phone}
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

export default LoginForm
