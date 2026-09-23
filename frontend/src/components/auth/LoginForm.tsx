import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, AlertCircle } from 'lucide-react'
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
          ? 'Enter admin username, email or mobile'
          : 'Enter your 10-digit mobile number'
      )
      return
    }

    setLoading(true)

    try {
      if (role === 'admin') {
        setDevOtp('123456')
        setStep('otp')
      } else if (role === 'officer') {
        const phone = cleanInput.replace(/\D/g, '')
        if (!phone.match(/^[6-9]\d{9}$/)) {
          setError('Enter a valid 10-digit Indian mobile number')
          setLoading(false)
          return
        }

        try {
          const res = await authApi.requestOtp(phone)
          const match = res.message.match(/\d{6}/)
          setDevOtp(match ? match[0] : '123456')
          setStep('otp')
        } catch (apiErr: any) {
          // Dev / demo fallback
          setDevOtp('123456')
          setStep('otp')
        }
      } else {
        // Farmer demo OTP
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
          setError('Invalid code. Use 123456 in demo mode.')
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
            crop: 'Soybean',
          })
        )
        navigate('/app/farmer')
      }
    } finally {
      setLoading(false)
    }
  }

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
          crop: 'Soybean',
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
    <div className="bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 shadow-xs text-left">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#111814] tracking-tight">Sign in</h1>
        <p className="text-xs text-[#66736B] mt-1">
          Select role to access your personalized weather portal.
        </p>
      </div>

      {/* Minimal Role Switcher */}
      <div className="grid grid-cols-3 bg-[#F2F5F2] p-1 rounded-xl mb-5 gap-1">
        {(['farmer', 'officer', 'admin'] as const).map((r) => {
          const isSelected = role === r
          return (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r)
                setStep('identifier')
                setError('')
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                isSelected
                  ? r === 'admin'
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'bg-white text-[#126B3A] shadow-2xs font-bold'
                  : 'text-[#66736B] hover:text-[#111814]'
              }`}
            >
              {r}
            </button>
          )
        })}
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1">
              {role === 'admin'
                ? 'Admin ID / Email / Phone'
                : role === 'officer'
                ? 'Officer Mobile Number'
                : 'Mobile Number or Email'}
            </label>
            <input
              type={role === 'officer' ? 'tel' : 'text'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                role === 'admin'
                  ? 'admin@nagpur.gov.in'
                  : '10-digit mobile number'
              }
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

          {/* Understated Minimal Demo Links */}
          <div className="pt-2 text-center">
            <span className="text-[11px] text-[#66736B]">Instant Demo: </span>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="text-[#126B3A] hover:underline"
              >
                Farmer
              </button>
              <span className="text-[#D1D5DB]">&bull;</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('officer')}
                className="text-[#126B3A] hover:underline"
              >
                Officer
              </button>
              <span className="text-[#D1D5DB]">&bull;</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="text-purple-700 hover:underline"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-3 border-t border-[#F1F5F2] text-center text-xs text-[#66736B]">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-[#126B3A] font-bold hover:underline">
              Sign up
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

export default LoginForm
