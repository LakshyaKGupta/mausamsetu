import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/shared/Button'

export const ForgotPasswordPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Please enter your mobile number or registered email')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8E4] p-8 sm:p-10 shadow-sm text-left">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[#166534] font-semibold mb-6 hover:underline"
      >
        <ArrowLeft size={14} /> Back to Login
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#17201A] tracking-tight">Account Recovery</h2>
        <p className="text-sm text-[#647067] mt-1">
          Reset access to your MausamSetu agricultural portal.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#17201A] uppercase tracking-wider block mb-1.5">
              Mobile Number or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9876543210 or officer@gov.in"
              autoFocus
              className="w-full py-3 px-4 bg-white border border-[#E2E8E4] rounded-xl text-sm text-[#17201A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534]"
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
            isLoading={loading}
            rightIcon={<ArrowRight size={18} />}
          >
            Send Recovery Code
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl flex items-start gap-3">
            <CheckCircle2 size={20} className="text-[#166534] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#14532D]">Recovery Code Dispatched</p>
              <p className="text-xs text-[#166534] mt-0.5">
                We have sent an authentication recovery code to{' '}
                <strong className="text-[#14532D]">{identifier}</strong>.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/verify?identifier=${encodeURIComponent(identifier)}`)}
          >
            Enter Recovery Code
          </Button>
        </div>
      )}
    </div>
  )
}

export default ForgotPasswordPage
