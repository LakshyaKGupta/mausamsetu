import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { OTPVerification } from '../../components/auth/OTPVerification'

export const VerifyOTPPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const identifier = searchParams.get('identifier') || '+91 9876543210'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleVerify = (otp: string) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (otp === '123456') {
        navigate('/app/farmer')
      } else {
        setError('Invalid verification code. Use 123456 in dev mode.')
      }
    }, 500)
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8E4] p-8 sm:p-10 shadow-sm text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#17201A] tracking-tight">Verify Code</h2>
        <p className="text-sm text-[#647067] mt-1">
          Enter the 6-digit OTP to authenticate your session.
        </p>
      </div>

      <OTPVerification
        identifier={identifier}
        devOtp="123456"
        isLoading={loading}
        error={error}
        onVerify={handleVerify}
        onResend={() => {}}
        onChangeIdentifier={() => navigate('/login')}
      />
    </div>
  )
}

export default VerifyOTPPage
