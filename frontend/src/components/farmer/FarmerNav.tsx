import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CloudRain, Sprout, CheckCircle2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

interface Props {
  lang?: Language
}

export const FarmerNav: React.FC<Props> = ({ lang = 'hi' }) => {
  const tabs = [
    {
      to: '/app/farmer',
      end: true,
      icon: Home,
      labelHi: 'होम',
      labelMr: 'मुख्य',
      labelEn: 'Home',
    },
    {
      to: '/app/farmer/forecast',
      icon: CloudRain,
      labelHi: 'मौसम',
      labelMr: 'हवामान',
      labelEn: 'Weather',
    },
    {
      to: '/app/farmer/crops',
      icon: Sprout,
      labelHi: 'मेरी फसलें',
      labelMr: 'माझी पिके',
      labelEn: 'My Crops',
    },
    {
      to: '/app/farmer/advisories',
      icon: CheckCircle2,
      labelHi: 'सलाह',
      labelMr: 'सल्ला',
      labelEn: 'Advice',
    },
    {
      to: '/app/farmer/ask',
      icon: Mic,
      labelHi: 'पूछें',
      labelMr: 'विचारा',
      labelEn: 'Ask',
    },
  ]

  const getLabel = (t: typeof tabs[0]) => {
    if (lang === 'mr') return t.labelMr
    if (lang === 'en') return t.labelEn
    return t.labelHi
  }

  return (
    <>
      {/* Desktop Sub-navigation Tab Bar */}
      <nav className="bg-white border-b border-slate-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all',
                      isActive
                        ? 'border-brand-600 text-brand-700 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    )
                  }
                >
                  <Icon size={16} />
                  <span>{getLabel(tab)}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Fixed Navigation (5 items max) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 pt-1 shadow-lg"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-center min-w-[56px]',
                    isActive
                      ? 'text-brand-700 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  )
                }
              >
                <div
                  className={cn(
                    'p-1 rounded-lg transition-colors',
                    tab.to === '/app/farmer/ask' && 'bg-brand-600 text-white shadow-sm'
                  )}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] mt-0.5 leading-tight">{getLabel(tab)}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
