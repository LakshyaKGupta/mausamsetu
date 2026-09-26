import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CloudRain, Sprout, CheckCircle2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

interface Props {
  lang?: Language
}

export const FarmerNav: React.FC<Props> = ({ lang = 'hi' }) => {
  // Re-ordered: Home -> Weather -> [Ask (Special Center)] -> Crops -> Advice
  const tabs = [
    {
      to: '/app/farmer',
      end: true,
      icon: Home,
      labelHi: 'होम',
      labelMr: 'मुख्य',
      labelEn: 'Home',
      isSpecial: false,
    },
    {
      to: '/app/farmer/forecast',
      icon: CloudRain,
      labelHi: 'मौसम',
      labelMr: 'हवामान',
      labelEn: 'Weather',
      isSpecial: false,
    },
    {
      to: '/app/farmer/ask',
      icon: Mic,
      labelHi: 'पूछें',
      labelMr: 'विचारा',
      labelEn: 'Ask',
      isSpecial: true,
    },
    {
      to: '/app/farmer/crops',
      icon: Sprout,
      labelHi: 'मेरी फसलें',
      labelMr: 'माझी पिके',
      labelEn: 'My Crops',
      isSpecial: false,
    },
    {
      to: '/app/farmer/advisories',
      icon: CheckCircle2,
      labelHi: 'सलाह',
      labelMr: 'सल्ला',
      labelEn: 'Advice',
      isSpecial: false,
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
      <nav className="bg-white border-b border-[#E2E8E4] hidden md:block shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer',
                      isActive
                        ? 'border-[#126B3A] text-[#126B3A] font-bold'
                        : 'border-transparent text-[#647067] hover:text-[#111814] hover:border-slate-300'
                    )
                  }
                >
                  <Icon size={16} className={tab.isSpecial ? 'text-[#126B3A]' : ''} />
                  <span>{getLabel(tab)}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Fixed Navigation (Ask as Elevated Center Action) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E2E8E4] z-40 px-2 pt-1 shadow-lg"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon

            if (tab.isSpecial) {
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center -mt-5 relative z-10 transition-transform active:scale-90 select-none touch-manipulation'
                    )
                  }
                >
                  <div className="w-12 h-12 rounded-full bg-[#126B3A] hover:bg-[#0B4F2A] text-white flex items-center justify-center shadow-md border-2 border-white">
                    <Mic size={22} className="text-emerald-200" />
                  </div>
                  <span className="text-[10px] font-bold text-[#126B3A] mt-0.5">
                    {getLabel(tab)}
                  </span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-center min-w-[54px] min-h-[48px] select-none active:scale-95 touch-manipulation',
                    isActive
                      ? 'text-[#126B3A] font-bold'
                      : 'text-[#647067] hover:text-[#111814]'
                  )
                }
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium mt-0.5">
                  {getLabel(tab)}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default FarmerNav
