import React, { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react'
import type { Language } from '@/types'

interface Props {
  lang?: Language
  variant?: 'banner' | 'button' | 'card'
}

export const PWAInstallBanner: React.FC<Props> = ({ lang = 'hi', variant = 'banner' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(false)
  const [isIOS, setIsIOS] = useState<boolean>(false)
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('mausamsetu_pwa_dismissed') === 'true'
  })

  useEffect(() => {
    // Check if app is already running in standalone / installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      setShowIOSModal(true)
    } else {
      // Fallback message for browsers without direct programmatic install
      setShowIOSModal(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('mausamsetu_pwa_dismissed', 'true')
  }

  if (isInstalled) {
    if (variant === 'button') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
          <Check size={13} className="text-brand-600" />
          <span>{lang === 'en' ? 'App Installed' : lang === 'mr' ? 'अ‍ॅप स्थापित' : 'ऐप स्थापित'}</span>
        </span>
      )
    }
    return null
  }

  if (dismissed && variant === 'banner') {
    return null
  }

  // Text localization
  const title =
    lang === 'en'
      ? 'Install MausamSetu App'
      : lang === 'mr'
      ? 'मौसमसेतू अ‍ॅप इन्स्टॉल करा'
      : 'मौसमसेतु ऐप इंस्टॉल करें'

  const subtitle =
    lang === 'en'
      ? 'Fast access & works offline in the field'
      : lang === 'mr'
      ? 'शेतात ऑफलाइन काम करते व थेट होम स्क्रीनवरून उघडते'
      : 'खेत में ऑफ़लाइन काम करता है व होम स्क्रीन से तुरंत खुलता है'

  const buttonText =
    lang === 'en'
      ? 'Install App'
      : lang === 'mr'
      ? 'अ‍ॅप डाउनलोड करा'
      : 'ऐप इंस्टॉल करें'

  // Variant: Standalone Button for Header
  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#126B3A] hover:bg-[#0B4F2A] px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
          title={title}
          aria-label={title}
        >
          <Smartphone size={14} className="text-emerald-300" />
          <span className="hidden sm:inline">{buttonText}</span>
          <span className="sm:hidden">{lang === 'en' ? 'App' : 'ऐप'}</span>
        </button>

        {showIOSModal && (
          <IOSInstallModal
            lang={lang}
            onClose={() => setShowIOSModal(false)}
          />
        )}
      </>
    )
  }

  // Variant: Card for inside Farmer Home
  if (variant === 'card') {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between gap-4 border border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
              <Smartphone size={22} className="text-emerald-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">{title}</h4>
              <p className="text-xs text-emerald-100/90 mt-0.5 line-clamp-1">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Download size={14} />
            <span>{buttonText}</span>
          </button>
        </div>

        {showIOSModal && (
          <IOSInstallModal
            lang={lang}
            onClose={() => setShowIOSModal(false)}
          />
        )}
      </>
    )
  }

  // Default Variant: Floating / Top Banner
  return (
    <>
      <div className="bg-[#126B3A] text-white px-4 py-2.5 text-xs sm:text-sm shadow-md transition-all relative border-b border-[#0B4F2A]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-emerald-300 flex-shrink-0">
              <Smartphone size={16} />
            </span>
            <div className="truncate">
              <span className="font-bold">{title}: </span>
              <span className="text-emerald-100/90 hidden sm:inline">{subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs text-emerald-950 bg-emerald-300 hover:bg-emerald-200 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>{buttonText}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {showIOSModal && (
        <IOSInstallModal
          lang={lang}
          onClose={() => setShowIOSModal(false)}
        />
      )}
    </>
  )
}

function IOSInstallModal({ lang, onClose }: { lang: Language; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <Smartphone size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              {lang === 'en'
                ? 'Install on your Phone'
                : lang === 'mr'
                ? 'आपल्या फोनवर इन्स्टॉल करा'
                : 'अपने फ़ोन पर इंस्टॉल करें'}
            </h3>
            <p className="text-xs text-slate-500">MausamSetu PWA</p>
          </div>
        </div>

        <div className="space-y-3.5 my-5 text-xs sm:text-sm">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg flex-shrink-0 mt-0.5">
              <Share size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                1. {lang === 'en' ? 'Tap the Share icon' : 'शेयर (Share) आइकन पर टैप करें'}
              </p>
              <p className="text-slate-500 text-xs">
                {lang === 'en'
                  ? 'Found at the bottom or top of your browser (Safari/Chrome)'
                  : 'ब्राउज़र के नीचे या ऊपर मेनू बार में स्थित'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg flex-shrink-0 mt-0.5">
              <PlusSquare size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                2. {lang === 'en' ? 'Select "Add to Home Screen"' : '"Add to Home Screen" (होम स्क्रीन पर जोड़ें) चुनें'}
              </p>
              <p className="text-slate-500 text-xs">
                {lang === 'en'
                  ? 'Scroll down the options list and tap the plus icon'
                  : 'विकल्पों में नीचे स्क्रॉल करके प्लस आइकन दबाएं'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg flex-shrink-0 mt-0.5">
              <Check size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                3. {lang === 'en' ? 'Tap "Add" in the top right' : 'ऊपर दाएं कोने में "Add" दबाएं'}
              </p>
              <p className="text-slate-500 text-xs">
                {lang === 'en'
                  ? 'MausamSetu will now open as a standalone app with offline support'
                  : 'मौसमसेतु सीधे आपकी होम स्क्रीन पर एक नेटिव ऐप की तरह काम करेगा'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-[#126B3A] hover:bg-[#0B4F2A] text-white font-semibold rounded-xl text-sm transition-all shadow-xs cursor-pointer"
        >
          {lang === 'en' ? 'Understood' : lang === 'mr' ? 'समजले' : 'समझ गया'}
        </button>
      </div>
    </div>
  )
}
