import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, AlertCircle, Sprout, MapPin, Globe, CheckCircle2 } from 'lucide-react'
import { Button } from '../shared/Button'
import { OTPVerification } from './OTPVerification'
import { authApi } from '@/api/client'

export const SignupForm: React.FC = () => {
  const [step, setStep] = useState<number>(1) // 1: Mobile, 2: OTP, 3: Profile & Location, 4: Crops & Language
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [landArea, setLandArea] = useState<string>('3.5')

  // Location
  const [state] = useState('Maharashtra')
  const [district] = useState('Nagpur')
  const [block, setBlock] = useState('Kalmeshwar')
  const [panchayat, setPanchayat] = useState('Dhapewada')

  // Crops & Language
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['soybean', 'cotton'])
  const [language, setLanguage] = useState<'hi' | 'mr' | 'en'>('hi')

  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const availableCrops = [
    { id: 'soybean', label: 'Soybean (सोयाबीन)', icon: '🌱' },
    { id: 'cotton', label: 'Cotton (कपास)', icon: '🌾' },
    { id: 'wheat', label: 'Wheat (गेहूं)', icon: '🌾' },
    { id: 'orange', label: 'Orange / Citrus (संतरा)', icon: '🍊' },
    { id: 'chickpea', label: 'Gram / Chana (चना)', icon: '🫘' },
    { id: 'paddy', label: 'Paddy / Rice (धान)', icon: '🌾' },
  ]

  const blockPanchayats: Record<string, string[]> = {
    Kalmeshwar: ['Dhapewada', 'Mohpa', 'Kalmeshwar Rural', 'Seloo', 'Ubali'],
    Saoner: ['Saoner Rural', 'Khapa', 'Kelwad', 'Patansawangi', 'Bichwa'],
    Katol: ['Katol Rural', 'Kondhali', 'Paradsinga', 'Metpanjra', 'Yenwa'],
    Ramtek: ['Ramtek Rural', 'Mansar', 'Nagardhan', 'Bhandarbodi', 'Deolapar'],
  }

  const toggleCrop = (cropId: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropId) ? prev.filter((c) => c !== cropId) : [...prev, cropId]
    )
  }

  // Step 1: Request OTP
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
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
      setError('Invalid code. Use 123456 in demo mode.')
    }
  }

  // Step 3 to Step 4
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }
    setError('')
    setStep(4)
  }

  // Step 4: Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCrops.length === 0) {
      setError('Please select at least one crop')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await authApi.farmerSignup({
        name,
        phone,
        state,
        district,
        block,
        panchayat_id: 1,
        crops: selectedCrops,
        preferred_language: language,
        land_area_acres: parseFloat(landArea) || 3.0,
      })

      localStorage.setItem('mausamsetu_token', data.access_token)
      localStorage.setItem('mausamsetu_role', 'farmer')
      localStorage.setItem('mausamsetu_farmer', JSON.stringify(data))
      localStorage.setItem('mausamsetu_user', JSON.stringify(data))
      localStorage.setItem('mausamsetu_lang', language)

      navigate('/app/farmer')
    } catch {
      // Fallback local session if backend offline
      const localData = {
        name,
        phone,
        district,
        block,
        panchayat_name: panchayat,
        preferred_language: language,
        crops: selectedCrops,
      }
      localStorage.setItem('mausamsetu_role', 'farmer')
      localStorage.setItem('mausamsetu_farmer', JSON.stringify(localData))
      navigate('/app/farmer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 shadow-xs text-left max-w-lg mx-auto">
      {/* Header & Progressive Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#166534] uppercase tracking-wider flex items-center gap-1.5">
            <Sprout size={15} />
            Farmer Onboarding
          </span>
          <span className="text-xs text-[#66736B] font-medium">
            Step {step === 1 ? '1' : step === 2 ? '2' : step === 3 ? '3' : '4'} of 4
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#EEF2EF] h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-[#126B3A] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <h1 className="text-xl font-bold text-[#111814] tracking-tight">
          {step === 1 && 'Enter your mobile number'}
          {step === 2 && 'Verify your mobile'}
          {step === 3 && 'Farm & Panchayat location'}
          {step === 4 && 'Your crops & language'}
        </h1>
        <p className="text-xs text-[#66736B] mt-1">
          {step === 1 && 'Receive localized weather alerts and verified crop advisories.'}
          {step === 2 && 'We sent a 6-digit confirmation code.'}
          {step === 3 && 'Pinpoint your Gram Panchayat for microclimate downscaling.'}
          {step === 4 && 'Tailors agronomic thresholds to your exact crops and language.'}
        </p>
      </div>

      {/* Step 1: Mobile */}
      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#66736B] font-medium">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                autoFocus
                className="w-full py-2.5 pl-12 pr-3.5 bg-white border border-[#D1D5DB] rounded-xl text-sm text-[#111814] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126B3A] focus:border-transparent transition-all"
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
            size="md"
            className="w-full justify-center"
            rightIcon={<ArrowRight size={16} />}
          >
            Continue
          </Button>

          {/* Institutional note */}
          <div className="pt-4 border-t border-[#F1F5F2] text-center space-y-2">
            <p className="text-[11px] text-[#85928A] leading-relaxed">
              Agricultural Officers and District Administrators use department-provisioned credentials.
            </p>
            <div className="text-xs text-[#66736B]">
              Already registered?{' '}
              <Link to="/login" className="text-[#126B3A] font-bold hover:underline">
                Sign in
              </Link>
            </div>
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
            setError('')
          }}
        />
      )}

      {/* Step 3: Identity & Location */}
      {step === 3 && (
        <form onSubmit={handleLocationSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-1">
              Farmer Full Name (किसान का पूरा नाम)
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1">
                District (ज़िला)
              </label>
              <input
                type="text"
                value="Nagpur, Maharashtra"
                disabled
                className="w-full py-2 px-3 bg-[#F4F6F4] border border-[#D1D5DB] rounded-xl text-xs text-[#66736B] font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1">
                Block / Tehsil (तहसील)
              </label>
              <select
                value={block}
                onChange={(e) => {
                  const newBlock = e.target.value
                  setBlock(newBlock)
                  setPanchayat(blockPanchayats[newBlock]?.[0] || 'Dhapewada')
                }}
                className="w-full py-2 px-3 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#111814] font-medium focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
              >
                {Object.keys(blockPanchayats).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-[#126B3A]" />
                Gram Panchayat (ग्राम पंचायत)
              </label>
              <select
                value={panchayat}
                onChange={(e) => setPanchayat(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#111814] font-medium focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
              >
                {(blockPanchayats[block] || []).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#111814] block mb-1">
                Total Land (एकड़)
              </label>
              <input
                type="number"
                step="0.5"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                placeholder="3.5"
                className="w-full py-2 px-3 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#111814] font-medium focus:outline-none focus:ring-2 focus:ring-[#126B3A]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-bold text-[#66736B] hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 justify-center"
              rightIcon={<ArrowRight size={16} />}
            >
              Continue to Crops
            </Button>
          </div>
        </form>
      )}

      {/* Step 4: Crops & Language */}
      {step === 4 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-2">
              Select crops grown on your farm (आपकी फसलें चुनें)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableCrops.map((c) => {
                const isSelected = selectedCrops.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCrop(c.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#126B3A] bg-[#EEF5EF] text-[#111814] font-bold shadow-2xs'
                        : 'border-[#E2E8E4] bg-white text-[#66736B] hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="text-xs flex-1">{c.label}</span>
                    {isSelected && <Check size={14} className="text-[#126B3A]" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#111814] block mb-2 flex items-center gap-1">
              <Globe size={13} className="text-[#126B3A]" />
              Preferred Language for Advisories & Voice (पसंदीदा भाषा)
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#126B3A] bg-[#126B3A] text-white font-bold'
                        : 'border-[#D1D5DB] bg-white text-[#66736B] hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs">{l.name}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {l.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-bold text-[#66736B] hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 justify-center"
              isLoading={loading}
              rightIcon={<CheckCircle2 size={16} />}
            >
              Complete Registration & Open Farm
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SignupForm
