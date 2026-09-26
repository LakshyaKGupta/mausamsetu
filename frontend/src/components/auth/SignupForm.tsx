import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, AlertCircle, MapPin, Globe, CheckCircle2 } from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'
import { authApi } from '@/api/client'

export const SignupForm: React.FC = () => {
  const location = useLocation()
  const initialPhone = location.state?.phone || ''

  const [step, setStep] = useState<number>(initialPhone ? 2 : 1) // 1 to 6
  
  // Step 1: Phone
  const [phone, setPhone] = useState(initialPhone)
  // Step 2: OTP
  const [devOtp, setDevOtp] = useState<string | null>(initialPhone ? '123456' : null) // Assuming requestOtp was already called if initialPhone is passed
  // Step 3: Name
  const [name, setName] = useState('')
  // Step 4: Location
  const [state] = useState('Maharashtra')
  const [district] = useState('Nagpur')
  const [block, setBlock] = useState('Kalmeshwar')
  const [panchayat, setPanchayat] = useState('Dhapewada')
  const [landArea, setLandArea] = useState<string>('3.5')
  // Step 5: Crops
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['soybean'])
  // Step 6: Language
  const [language, setLanguage] = useState<'hi' | 'mr' | 'en'>('hi')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const availableCrops = [
    { id: 'soybean', label: 'Soybean (सोयाबीन)', icon: '🌱' },
    { id: 'cotton', label: 'Cotton (कपास)', icon: '🌾' },
    { id: 'wheat', label: 'Wheat (गेहूं)', icon: '🌾' },
    { id: 'orange', label: 'Orange / Citrus (संतरा)', icon: '🍊' },
    { id: 'chickpea', label: 'Gram (चना)', icon: '🫘' },
    { id: 'paddy', label: 'Paddy / Rice (धान)', icon: '🌾' },
  ]

  const blockPanchayats: Record<string, string[]> = {
    Kalmeshwar: ['Dhapewada', 'Mohpa', 'Kalmeshwar Rural', 'Seloo', 'Ubali'],
    Saoner: ['Saoner Rural', 'Khapa', 'Kelwad', 'Patansawangi', 'Bichwa'],
    Katol: ['Katol Rural', 'Kondhali', 'Paradsinga', 'Metpanjra', 'Yenwa'],
    Ramtek: ['Ramtek Rural', 'Mansar', 'Nagardhan', 'Bhandarbodi', 'Deolapar'],
  }

  // --- Step 1: Phone ---
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      await authApi.requestOtp(cleanPhone)
      setDevOtp('123456') // Hackathon demo fallback
      setStep(2)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to request OTP')
    } finally {
      setLoading(false)
    }
  }

  // --- Step 2: OTP Verify ---
  const handleOtpVerify = async (otpValue: string) => {
    setLoading(true)
    setError('')
    try {
      // For signup, we just verify the OTP to create a verified record.
      // However, the current auth schema allows login to fail with 404 if farmer profile is missing.
      const data = await authApi.verifyOtp(phone, otpValue)
      localStorage.setItem('mausamsetu_token', data.access_token)
      localStorage.setItem('mausamsetu_role', data.role)
      localStorage.setItem('mausamsetu_user', JSON.stringify(data))
      localStorage.setItem('mausamsetu_farmer', JSON.stringify(data))
      navigate('/app/farmer')
      
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // User not found (farmer profile missing), meaning OTP was valid but needs signup
        setStep(3) // Proceed to name
      } else {
        setError(err?.response?.data?.detail || 'Invalid OTP code.')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Step 3: Name ---
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setError('')
    setStep(4)
  }

  // --- Step 4: Location ---
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep(5)
  }

  // --- Step 5: Crops ---
  const toggleCrop = (cropId: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropId) ? prev.filter((c) => c !== cropId) : [...prev, cropId]
    )
  }
  const handleCropsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCrops.length === 0) {
      setError('Please select at least one crop')
      return
    }
    setError('')
    setStep(6)
  }

  // --- Step 6: Finalize (Language) ---
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await authApi.farmerSignup({
        name,
        phone,
        state,
        district,
        block,
        panchayat_id: 1, // hardcoded for demo, normally would look up based on panchayat name
        crops: selectedCrops,
        preferred_language: language,
        land_area_acres: parseFloat(landArea) || 3.0,
      })

      localStorage.setItem('mausamsetu_token', data.access_token)
      localStorage.setItem('mausamsetu_role', 'farmer')
      localStorage.setItem('mausamsetu_user', JSON.stringify(data))
      localStorage.setItem('mausamsetu_farmer', JSON.stringify(data))
      localStorage.setItem('mausamsetu_lang', language)

      navigate('/app/farmer')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 shadow-xs text-left max-w-md mx-auto min-h-[420px] flex flex-col">
      {/* Progress Bar & Back Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {step > 1 && step < 6 ? (
            <button 
              onClick={() => setStep(step - 1)} 
              className="text-[#66736B] hover:text-[#111814] transition-colors p-1"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-[26px]"></div> /* Placeholder to keep centering */
          )}
          <span className="text-xs text-[#66736B] font-medium">
            Step {step} of 6
          </span>
          <div className="w-[26px]"></div>
        </div>

        {/* 6-step progress */}
        <div className="w-full bg-[#EEF2EF] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#126B3A] h-full transition-all duration-500 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        
        {/* Step 1: Mobile */}
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 animate-slide-up-fade">
            <h1 className="text-xl font-bold text-[#111814] tracking-tight mb-4">
              Enter your mobile number
            </h1>
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm text-[#66736B] font-medium">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  autoFocus
                  className="w-full py-3 pl-12 pr-3.5 bg-white border border-[#D1D5DB] rounded-xl text-base text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
                />
              </div>
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
              size="lg"
              className="w-full justify-center mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight size={18} />}
            >
              Continue
            </Button>
            <div className="text-center pt-4">
              <span className="text-xs text-[#66736B]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#126B3A] font-bold hover:underline">
                  Log in
                </Link>
              </span>
            </div>
          </form>
        )}

        {/* Step 2: OTP */}
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
              setDevOtp(null)
              setError('')
            }}
          />
        )}

        {/* Step 3: Name */}
        {step === 3 && (
          <form onSubmit={handleNameSubmit} className="space-y-4 animate-slide-up-fade">
            <h1 className="text-xl font-bold text-[#111814] tracking-tight mb-2">
              What is your name?
            </h1>
            <p className="text-xs text-[#66736B] mb-4">
              We'll use this to personalize your advisories.
            </p>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                autoFocus
                className="w-full py-3 px-4 bg-white border border-[#D1D5DB] rounded-xl text-base text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
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
              size="lg"
              className="w-full justify-center mt-4"
              rightIcon={<ArrowRight size={18} />}
            >
              Next
            </Button>
          </form>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <form onSubmit={handleLocationSubmit} className="space-y-4 animate-slide-up-fade">
            <h1 className="text-xl font-bold text-[#111814] tracking-tight mb-4">
              Where is your farm?
            </h1>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#66736B] block mb-1">District</label>
                  <input
                    type="text"
                    value="Nagpur, MH"
                    disabled
                    className="w-full py-2 px-3 bg-[#F4F6F4] border border-[#E2E8E4] rounded-lg text-sm text-[#66736B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#66736B] block mb-1">Block (Tehsil)</label>
                  <select
                    value={block}
                    onChange={(e) => {
                      const newBlock = e.target.value
                      setBlock(newBlock)
                      setPanchayat(blockPanchayats[newBlock]?.[0] || 'Dhapewada')
                    }}
                    className="w-full py-2 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                  >
                    {Object.keys(blockPanchayats).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#66736B] block mb-1 flex items-center gap-1">
                  <MapPin size={12} className="text-[#126B3A]" />
                  Gram Panchayat
                </label>
                <select
                  value={panchayat}
                  onChange={(e) => setPanchayat(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                >
                  {(blockPanchayats[block] || []).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#66736B] block mb-1">
                  Total Land (Acres)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder="3.5"
                  className="w-full py-2.5 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              rightIcon={<ArrowRight size={18} />}
            >
              Next
            </Button>
          </form>
        )}

        {/* Step 5: Crops */}
        {step === 5 && (
          <form onSubmit={handleCropsSubmit} className="space-y-4 animate-slide-up-fade">
            <h1 className="text-xl font-bold text-[#111814] tracking-tight mb-2">
              Which crops do you grow?
            </h1>
            <p className="text-xs text-[#66736B] mb-4">
              Select all that apply for tailored alerts.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {availableCrops.map((c) => {
                const isSelected = selectedCrops.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCrop(c.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#126B3A] bg-[#EEF5EF] text-[#111814] font-bold shadow-2xs'
                        : 'border-[#E2E8E4] bg-white text-[#66736B] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[13px] flex-1 leading-tight">{c.label}</span>
                    {isSelected && <Check size={16} className="text-[#126B3A]" />}
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-4"
              rightIcon={<ArrowRight size={18} />}
            >
              Next
            </Button>
          </form>
        )}

        {/* Step 6: Language */}
        {step === 6 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-slide-up-fade">
            <h1 className="text-xl font-bold text-[#111814] tracking-tight mb-2 flex items-center gap-2">
              <Globe size={20} className="text-[#126B3A]" />
              Choose your language
            </h1>
            <p className="text-xs text-[#66736B] mb-6">
              Advisories and voice alerts will be in this language.
            </p>
            
            <div className="grid gap-3">
              {[
                { code: 'mr', name: 'मराठी', label: 'Marathi' },
                { code: 'hi', name: 'हिन्दी', label: 'Hindi' },
                { code: 'en', name: 'English', label: 'English' },
              ].map((l) => {
                const isSelected = language === l.code
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code as any)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#126B3A] bg-[#126B3A] text-white shadow-md'
                        : 'border-[#D1D5DB] bg-white text-[#111814] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-base font-bold">{l.name}</div>
                      <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-[#66736B]'}`}>
                        {l.label}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={24} className="text-white" />}
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-6"
              isLoading={loading}
              rightIcon={<CheckCircle2 size={18} />}
            >
              Complete Setup
            </Button>
          </form>
        )}

      </div>
    </div>
  )
}

export default SignupForm
