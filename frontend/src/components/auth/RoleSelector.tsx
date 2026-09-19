import React from 'react'
import { Sprout, ShieldCheck, CheckCircle } from 'lucide-react'

export type UserRole = 'farmer' | 'officer'

interface RoleSelectorProps {
  selectedRole: UserRole
  onSelectRole: (role: UserRole) => void
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-[#17201A] uppercase tracking-wider block">
        I am registering as:
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Farmer Option */}
        <button
          type="button"
          onClick={() => onSelectRole('farmer')}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedRole === 'farmer'
              ? 'border-[#166534] bg-[#F0FDF4] shadow-sm ring-1 ring-[#166534]'
              : 'border-[#E2E8E4] bg-white hover:bg-[#F7FAF7]'
          }`}
        >
          {selectedRole === 'farmer' && (
            <div className="absolute top-3 right-3 text-[#166534]">
              <CheckCircle size={16} />
            </div>
          )}
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold mb-2">
            <Sprout size={20} />
          </div>
          <h4 className="text-sm font-bold text-[#17201A]">Farmer</h4>
          <p className="text-[11px] text-[#647067] mt-0.5">
            Get local weather, crop advice & voice help
          </p>
        </button>

        {/* Officer Option */}
        <button
          type="button"
          onClick={() => onSelectRole('officer')}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedRole === 'officer'
              ? 'border-[#166534] bg-[#F0FDF4] shadow-sm ring-1 ring-[#166534]'
              : 'border-[#E2E8E4] bg-white hover:bg-[#F7FAF7]'
          }`}
        >
          {selectedRole === 'officer' && (
            <div className="absolute top-3 right-3 text-[#166534]">
              <CheckCircle size={16} />
            </div>
          )}
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold mb-2">
            <ShieldCheck size={20} />
          </div>
          <h4 className="text-sm font-bold text-[#17201A]">Agri Officer</h4>
          <p className="text-[11px] text-[#647067] mt-0.5">
            Review, verify & approve local advisories
          </p>
        </button>
      </div>
    </div>
  )
}
