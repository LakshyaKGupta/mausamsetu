import React, { useState, useEffect } from 'react'
import { Server, Wifi, AlertTriangle, CheckCircle2, RefreshCw, X, ExternalLink } from 'lucide-react'
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, checkBackendHealth } from '../../api/client'

export const BackendStatusIndicator: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>(getApiBaseUrl())
  const [customInput, setCustomInput] = useState<string>(getApiBaseUrl())
  const [status, setStatus] = useState<'checking' | 'connected' | 'waking_up' | 'unreachable'>('checking')
  const [latency, setLatency] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const verifyHealth = async (urlToCheck?: string) => {
    setIsTesting(true)
    const target = urlToCheck || getApiBaseUrl()
    const result = await checkBackendHealth(target)
    setIsTesting(false)
    if (result.ok) {
      setStatus('connected')
      setLatency(result.latencyMs)
    } else {
      // If we are on production and it failed, it's likely Render cold start
      const isRemote = window.location.hostname !== 'localhost'
      setStatus(isRemote ? 'waking_up' : 'unreachable')
      setLatency(null)
    }
  }

  useEffect(() => {
    // Initial health check
    verifyHealth()

    // Listen for connection issues caught by Axios
    const handleIssue = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string; message: string; isTimeout: boolean }>
      if (status !== 'waking_up') {
        setStatus('waking_up')
      }
    }

    const handleUrlChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      setCurrentUrl(customEvent.detail)
      setCustomInput(customEvent.detail)
      verifyHealth(customEvent.detail)
    }

    window.addEventListener('mausamsetu_backend_connection_issue', handleIssue)
    window.addEventListener('mausamsetu_api_url_changed', handleUrlChange)

    // Periodically re-check health if waking up (every 10s until connected)
    const timer = setInterval(() => {
      if (status === 'waking_up' || status === 'checking') {
        verifyHealth()
      }
    }, 10000)

    return () => {
      window.removeEventListener('mausamsetu_backend_connection_issue', handleIssue)
      window.removeEventListener('mausamsetu_api_url_changed', handleUrlChange)
      clearInterval(timer)
    }
  }, [status])

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInput.trim()) return
    setApiBaseUrl(customInput.trim())
    setIsOpen(false)
  }

  const handleReset = () => {
    resetApiBaseUrl()
    const defaultUrl = getApiBaseUrl()
    setCustomInput(defaultUrl)
    setIsOpen(false)
  }

  // If connected and user minimized it or it's healthy on desktop, render a small discreet pill
  return (
    <>
      {/* Floating Indicator Button */}
      <div className="fixed bottom-3 right-3 z-50 flex items-center">
        {status === 'waking_up' && (
          <div className="mr-2 hidden sm:flex items-center gap-2 bg-amber-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Render backend waking up (~30s)...</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-md transition-all backdrop-blur ${
            status === 'connected'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/90'
              : status === 'waking_up'
              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40 hover:bg-amber-900/90 animate-pulse'
              : 'bg-rose-950/90 text-rose-300 border border-rose-500/40 hover:bg-rose-900/90'
          }`}
          title="Click to view or configure Backend API Connection"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === 'connected' ? 'bg-emerald-400' : status === 'waking_up' ? 'bg-amber-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === 'connected' ? 'bg-emerald-500' : status === 'waking_up' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </span>

          <Server className="w-3.5 h-3.5" />
          <span className="hidden md:inline">API:</span>
          <span className="font-mono truncate max-w-[120px] sm:max-w-[160px]">
            {currentUrl.replace(/^https?:\/\//, '')}
          </span>
          {latency !== null && <span className="opacity-75">({latency}ms)</span>}
        </button>
      </div>

      {/* Configuration & Status Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-xl border ${
                  status === 'connected'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : status === 'waking_up'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Backend Connection Status</h3>
                <p className="text-xs text-slate-400">Vercel Frontend ↔ Render API Service</p>
              </div>
            </div>

            {/* Current Status Box */}
            <div
              className={`p-3.5 rounded-xl border mb-5 text-xs ${
                status === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : status === 'waking_up'
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  {status === 'connected' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : status === 'waking_up' ? (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  {status === 'connected'
                    ? 'Connected & Operational'
                    : status === 'waking_up'
                    ? 'Render Free Tier Warming Up'
                    : 'Backend Unreachable'}
                </span>
                {latency !== null && <span className="font-mono">{latency}ms latency</span>}
              </div>
              <p className="mt-1.5 text-[11px] opacity-80 leading-relaxed">
                {status === 'connected'
                  ? 'All microclimate queries, authentication, and advisory routes are responsive.'
                  : status === 'waking_up'
                  ? 'Render spins down inactive free web services after 15 minutes. The initial wake-up takes approximately 30-45 seconds. Requests will automatically resolve.'
                  : 'Could not reach /health endpoint. Check if the Render URL is correct and the service is active.'}
              </p>
            </div>

            {/* URL Override Form */}
            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Backend API URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="https://mausamsetu-api.onrender.com"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Tip: You can change this to your custom Render backend URL without rebuilding on Vercel.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => verifyHealth(customInput)}
                  disabled={isTesting}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Test Health
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
                >
                  Save & Connect
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={handleReset}
                  className="hover:text-slate-200 underline"
                >
                  Reset to Render Default
                </button>
                <a
                  href={`${currentUrl}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400"
                >
                  Swagger Docs <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
