import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'

export const SignupForm: React.FC = () => {
  const [role, setRole] = useState<'farmer' | 'officer' | 'admin'>('farmer')
  const [step, setStep] = useState<number>(1) // 1: Phone, 2: OTP, 3: Profile

  // Form Fields
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [panchayat, setPanchayat] = useState('Dhapewada')
  const [block, setBlock] = useState('Kalmeshwar')
  const [crop, setCrop] = useState('Soybean')

  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Step 1: Request OTP
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone.match(/^[6-9]\d{9}$/)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }

    setDevOtp('123456')
    setStep(2)
  }

  // Step 2: Verify OTP
  const handleOtpVerify = (otpValue: string) => {
    if (otpValue === '123456' || otpValue.length === 6) {
      setStep(3)
      setError('')
    } else {
      setError('Invalid code. Use 123456 in demo.')
    }
  }

  // Step 3: Complete Registration
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)

    if (role === 'farmer') {
      const farmerData = {
        name,
        phone,
        language: 'hi',
        state: 'Maharashtra',
        district: 'Nagpur',
        block,
        panchayat,
        crop,
      }
      localStorage.setItem('mausamsetu_farmer', JSON.stringify(farmerData))
      localStorage.setItem('mausamsetu_role', 'farmer')
      navigate('/app/farmer')
    } else if (role === 'admin') {
      const adminData = {
        name,
        phone,
        role: 'District Agromet Director',
        district: 'Nagpur',
        username: phone + '@nagpur.gov.in',
      }
      localStorage.setItem('mausamsetu_admin', JSON.stringify(adminData))
      localStorage.setItem('mausamsetu_role', 'admin')
      navigate('/app/admin')
    } else {
      const officerData = {
        name,
        phone,
        designation: 'Agricultural Extension Officer',
        district: 'Nagpur',
        block,
      }
      localStorage.setItem('mausamsetu_officer', JSON.stringify(officerData))
      localStorage.setItem('mausamsetu_role', 'officer')
      localStorage.setItem('mausamsetu_token', 'demo-token-' + Date.now())
      navigate('/app/officer')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 shadow-xs text-left">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#111814] tracking-tight">Create account</h1>
        <p className="text-xs text-[#66736B] mt-1">
          {step === 1 && 'Select your role and enter mobile number.'}
          {step === 2 && 'Verify code sent to your mobile.'}
          {step === 3 && 'Setup your farm location & details.'}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          {/* Minimal Role Switcher */}
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1.5">
              Registering As
            </label>
            <div className="grid grid-cols-3 bg-[#F2F5F2] p-1 rounded-xl gap-1">
              {(['farmer', 'officer', 'admin'] as const).map((r) => {
                const isSelected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
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
          </div>

          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
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
            rightIcon={<ArrowRight size={16} />}
          >
            Continue
          </Button>

          <div className="pt-3 border-t border-[#F1F5F2] text-center text-xs text-[#66736B]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#126B3A] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <OTPVerification
          identifier={phone}
          devOtp={devOtp}
          isLoading={loading}
          error={error}
          onVerify={handleOtpVerify}
          onResend={() => handlePhoneSubmit({ preventDefault: () => {} } as any)}
          onChangeIdentifier={() => {
            setStep(1)
            setError('')
          }}
        />
      )}

      {step === 3 && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Patel"
              autoFocus
              className="w-full py-2.5 px-3.5 bg-white border border-[#D1D5DB] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
            />
          </div>

          {role === 'farmer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#111814] block mb-1">
                    Panchayat
                  </label>
                  <select
                    value={panchayat}
                    onChange={(e) => setPanchayat(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                  >
                    <option value="Dhapewada">Dhapewada</option>
                    <option value="Mohpa">Mohpa</option>
                    <option value="Kalmeshwar">Kalmeshwar</option>
                    <option value="Savner">Savner</option>
                    <option value="Ramtek">Ramtek</option>
                    <option value="Narkhed">Narkhed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111814] block mb-1">
                    Primary Crop
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                  >
                    <option value="Soybean">Soybean</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Orange/Citrus">Orange/Citrus</option>
                    <option value="Paddy">Paddy</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {role !== 'farmer' && (
            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1">
                Assigned Jurisdiction
              </label>
              <input
                type="text"
                value={`${block}, Nagpur`}
                readOnly
                className="w-full py-2 px-3 bg-[#F8FAF8] border border-[#E2E8E4] rounded-xl text-xs text-[#66736B]"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center"
            isLoading={loading}
          >
            Complete Registration
          </Button>
        </form>
      )}
    </div>
  )
}

export default SignupForm
