import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, KeyRound, ArrowRight, Leaf } from 'lucide-react'
import { authApi } from '@/api/client'
import { useNavigate } from 'react-router-dom'

export default function OfficerLogin() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const requestOtp = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.requestOtp(phone)
      // Dev mode: OTP is in response message
      const match = res.message.match(/\d{6}/)
      if (match) setDevOtp(match[0])
      setStep('otp')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.verifyOtp(phone, otp)
      localStorage.setItem('mausamsetu_token', res.access_token)
      localStorage.setItem('mausamsetu_officer', JSON.stringify(res.officer))
      navigate('/officer')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl shadow-glow-green mb-4">
            <span className="text-3xl">🌦</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">MausamSetu</h1>
          <p className="text-slate-500 mt-1 text-sm">Agricultural Officer Portal</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-xl font-display font-bold text-slate-900 mb-1">
            {step === 'phone' ? 'Sign In' : 'Enter OTP'}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {step === 'phone'
              ? 'Enter your registered mobile number'
              : `OTP sent to +91 ${phone}`}
          </p>

          {/* Dev OTP hint */}
          {devOtp && (
            <div className="mb-4 px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl">
              <p className="text-xs text-earth-600 font-medium">
                🔧 Dev mode OTP: <span className="font-bold text-lg tracking-widest">{devOtp}</span>
              </p>
            </div>
          )}

          {step === 'phone' ? (
            <div>
              <label className="label">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="input pl-14"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
                />
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <button
                onClick={requestOtp}
                disabled={loading}
                className="btn-primary w-full mt-5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          ) : (
            <div>
              <label className="label">6-Digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input text-center text-2xl font-bold tracking-[0.5em] font-mono"
                placeholder="······"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
              />
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <button
                onClick={verifyOtp}
                disabled={loading}
                className="btn-primary w-full mt-5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verify & Continue <ArrowRight size={16} /></>
                )}
              </button>
              <button
                onClick={() => { setStep('phone'); setDevOtp(null); setError(''); setOtp('') }}
                className="btn-secondary w-full mt-3"
              >
                Change Number
              </button>
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MausamSetu · Nagpur District Agricultural Department
        </p>
      </div>
    </div>
  )
}
