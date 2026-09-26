import React, { useState, useEffect } from 'react'
import { ArrowRight, AlertCircle, RefreshCw, KeyRound } from 'lucide-react'
import { Button } from '../shared/Button'

interface OTPVerificationProps {
  identifier: string
  devOtp?: string | null
  isLoading: boolean
  error?: string
  onVerify: (otp: string) => void
  onResend: () => void
  onChangeIdentifier?: () => void
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  identifier,
  devOtp,
  isLoading,
  error,
  onVerify,
  onResend,
  onChangeIdentifier,
}) => {
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = () => {
    setCountdown(30)
    onResend()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length === 6) {
      onVerify(otp)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left animate-slide-up-fade">
      {/* Dev Mode Banner (Clearly Labeled, Safe Isolation) */}
      {devOtp && (
        <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-[#92400E] font-semibold mb-1">
            <KeyRound size={14} className="text-[#D97706]" />
            <span>Development Mode Active</span>
          </div>
          <p className="text-xs text-[#B45309]">
            SMS gateway is running in sandbox mode. Use verification code:{' '}
            <strong className="font-mono text-sm tracking-wider text-[#92400E] bg-white px-2 py-0.5 rounded border border-[#FDE68A]">
              {devOtp}
            </strong>
          </p>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-[#17201A] uppercase tracking-wider block mb-1.5">
          Enter 6-Digit OTP
        </label>
        <p className="text-xs text-[#647067] mb-3">
          We sent a verification code to <strong className="text-[#17201A]">{identifier}</strong>
        </p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="······"
          autoFocus
          className="w-full text-center text-3xl font-extrabold tracking-[0.4em] font-mono py-3.5 px-4 bg-white border border-[#E2E8E4] rounded-2xl text-[#17201A] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-transparent transition-all shadow-sm"
        />

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
        isLoading={isLoading}
        disabled={otp.length !== 6 || isLoading}
        rightIcon={<ArrowRight size={18} />}
      >
        Verify & Continue
      </Button>

      {/* Resend & Change Number */}
      <div className="flex items-center justify-between text-xs text-[#647067] pt-2">
        {countdown > 0 ? (
          <span>Resend code in {countdown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-[#166534] font-semibold hover:underline flex items-center gap-1"
          >
            <RefreshCw size={12} /> Resend OTP
          </button>
        )}

        {onChangeIdentifier && (
          <button
            type="button"
            onClick={onChangeIdentifier}
            className="text-[#647067] hover:text-[#17201A] hover:underline"
          >
            Change Number
          </button>
        )}
      </div>
    </form>
  )
}
