import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, CheckCircle2, ChevronRight, Building2, ShieldCheck, Sprout } from 'lucide-react'
import { Button } from '../shared/Button'
import { RoleSelector, UserRole } from './RoleSelector'
import { OTPVerification } from './OTPVerification'

export const SignupForm: React.FC = () => {
  const [role, setRole] = useState<UserRole>('farmer')
  const [step, setStep] = useState<number>(1) // 1: Role & Phone, 2: OTP, 3: Profile & Location

  // Form Fields
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<'hi' | 'mr' | 'en'>('hi')
  const [state, setState] = useState('Maharashtra')
  const [district, setDistrict] = useState('Nagpur')
  const [block, setBlock] = useState('Kalmeshwar')
  const [panchayat, setPanchayat] = useState('Dhapewada')
  const [crop, setCrop] = useState('Soybean')

  // Officer specific
  const [designation, setDesignation] = useState('Agricultural Extension Officer (AEO)')
  const [department, setDepartment] = useState('Department of Agriculture, Maharashtra')

  // Admin specific
  const [adminRole, setAdminRole] = useState('District Agromet Director & Collectorate Liaison')

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
      setError('Please enter a valid 10-digit Indian mobile number')
      return
    }

    // Set demo OTP
    setDevOtp('123456')
    setStep(2)
  }

  // Step 2: Verify OTP
  const handleOtpVerify = (otpValue: string) => {
    if (otpValue === '123456' || otpValue.length === 6) {
      setStep(3)
      setError('')
    } else {
      setError('Invalid verification code')
    }
  }

  // Step 3: Complete Registration
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)

    if (role === 'farmer') {
      const farmerData = {
        name,
        phone,
        language,
        state,
        district,
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
        role: adminRole,
        district,
        department,
        username: phone + '@nagpur.gov.in',
      }
      localStorage.setItem('mausamsetu_admin', JSON.stringify(adminData))
      localStorage.setItem('mausamsetu_role', 'admin')
      navigate('/app/admin')
    } else {
      const officerData = {
        name,
        phone,
        designation,
        department,
        district,
        block,
      }
      localStorage.setItem('mausamsetu_officer', JSON.stringify(officerData))
      localStorage.setItem('mausamsetu_role', 'officer')
      localStorage.setItem('mausamsetu_token', 'demo-token-' + Date.now())
      navigate('/app/officer')
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8E4] p-8 sm:p-10 shadow-sm text-left max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#111814] tracking-tight">Create your account</h2>
        <p className="text-xs text-[#647067] mt-1">
          {step === 1 && 'Step 1 of 3: Choose role and enter mobile number'}
          {step === 2 && 'Step 2 of 3: Verify your mobile with OTP'}
          {step === 3 && 'Step 3 of 3: Setup your agricultural profile'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#126B3A]' : 'bg-slate-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#126B3A]' : 'bg-slate-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-[#126B3A]' : 'bg-slate-200'}`} />
      </div>

      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <RoleSelector selectedRole={role} onSelectRole={setRole} />

          <div className="pt-2">
            <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#647067] font-semibold">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                autoFocus
                className="w-full py-3 pl-12 pr-4 bg-white border border-[#E2E8E4] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
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
            rightIcon={<ArrowRight size={18} />}
          >
            Send Verification Code
          </Button>

          <div className="pt-4 text-center text-xs text-[#647067]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#126B3A] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <OTPVerification
          identifier={`+91 ${phone}`}
          devOtp={devOtp}
          isLoading={loading}
          error={error}
          onVerify={handleOtpVerify}
          onResend={() => setDevOtp('123456')}
          onChangeIdentifier={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Patel"
              autoFocus
              className="w-full py-2.5 px-3.5 bg-white border border-[#E2E8E4] rounded-xl text-sm text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
            />
          </div>

          {role === 'farmer' ? (
            <>
              {/* Language Selection */}
              <div>
                <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                  Preferred Advisory Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'hi', label: 'हिंदी (Hindi)' },
                    { code: 'mr', label: 'मराठी (Marathi)' },
                    { code: 'en', label: 'English' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        language === l.code
                          ? 'border-[#126B3A] bg-[#DCFCE7] text-[#14532D]'
                          : 'border-[#E2E8E4] bg-white text-[#647067]'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location: Block & Panchayat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                    Block
                  </label>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-[#E2E8E4] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                  >
                    <option value="Kalmeshwar">Kalmeshwar</option>
                    <option value="Saoner">Saoner</option>
                    <option value="Katol">Katol</option>
                    <option value="Ramtek">Ramtek</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                    Gram Panchayat
                  </label>
                  <select
                    value={panchayat}
                    onChange={(e) => setPanchayat(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-[#E2E8E4] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                  >
                    <option value="Dhapewada">Dhapewada</option>
                    <option value="Kalamna">Kalamna</option>
                    <option value="Mohpa">Mohpa</option>
                    <option value="Brahmani">Brahmani</option>
                  </select>
                </div>
              </div>

              {/* Primary Crop */}
              <div>
                <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                  Primary Crop
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-[#E2E8E4] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                >
                  <option value="Soybean">Soybean (सोयाबीन)</option>
                  <option value="Cotton">Cotton (कपास)</option>
                  <option value="Orange">Orange / Citrus (संतरा)</option>
                  <option value="Gram">Gram / Chana (चना)</option>
                  <option value="Wheat">Wheat (गेहूं)</option>
                </select>
              </div>
            </>
          ) : role === 'admin' ? (
            <>
              {/* Admin specific fields */}
              <div>
                <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                  Administrative Designation
                </label>
                <input
                  type="text"
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  placeholder="e.g. District Agromet Director"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#E2E8E4] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                    State Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={state}
                    disabled
                    className="w-full py-2.5 px-3 bg-slate-100 border border-[#E2E8E4] rounded-xl text-xs text-[#647067]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                    District Headquarters
                  </label>
                  <input
                    type="text"
                    value={district}
                    disabled
                    className="w-full py-2.5 px-3 bg-slate-100 border border-[#E2E8E4] rounded-xl text-xs text-[#647067]"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Officer Designation & Department */}
              <div>
                <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                  Official Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Agricultural Extension Officer"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#E2E8E4] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    disabled
                    className="w-full py-2.5 px-3 bg-slate-100 border border-[#E2E8E4] rounded-xl text-xs text-[#647067]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block mb-1">
                    Assigned Block
                  </label>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-[#E2E8E4] rounded-xl text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                  >
                    <option value="Kalmeshwar">Kalmeshwar</option>
                    <option value="Saoner">Saoner</option>
                    <option value="Katol">Katol</option>
                    <option value="Ramtek">Ramtek</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            isLoading={loading}
            rightIcon={<CheckCircle2 size={18} />}
          >
            Complete Registration
          </Button>
        </form>
      )}
    </div>
  )
}
