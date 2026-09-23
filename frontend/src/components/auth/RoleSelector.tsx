import React from 'react'
import { Sprout, ShieldCheck, Building2, CheckCircle } from 'lucide-react'

export type UserRole = 'farmer' | 'officer' | 'admin'

interface RoleSelectorProps {
  selectedRole: UserRole
  onSelectRole: (role: UserRole) => void
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-[#111814] uppercase tracking-wider block">
        I am registering as:
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Farmer Option */}
        <button
          type="button"
          onClick={() => onSelectRole('farmer')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
            selectedRole === 'farmer'
              ? 'border-[#126B3A] bg-[#F0FDF4] shadow-sm ring-1 ring-[#126B3A]'
              : 'border-[#E2E8E4] bg-white hover:bg-[#F7FAF7]'
          }`}
        >
          {selectedRole === 'farmer' && (
            <div className="absolute top-2.5 right-2.5 text-[#126B3A]">
              <CheckCircle size={15} />
            </div>
          )}
          <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#126B3A] flex items-center justify-center font-bold mb-2">
            <Sprout size={18} />
          </div>
          <h4 className="text-xs font-bold text-[#111814]">Farmer</h4>
          <p className="text-[10px] text-[#647067] mt-0.5 leading-tight">
            Local weather, crop advice & voice help
          </p>
        </button>

        {/* Officer Option */}
        <button
          type="button"
          onClick={() => onSelectRole('officer')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
            selectedRole === 'officer'
              ? 'border-[#126B3A] bg-[#F0FDF4] shadow-sm ring-1 ring-[#126B3A]'
              : 'border-[#E2E8E4] bg-white hover:bg-[#F7FAF7]'
          }`}
        >
          {selectedRole === 'officer' && (
            <div className="absolute top-2.5 right-2.5 text-[#126B3A]">
              <CheckCircle size={15} />
            </div>
          )}
          <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#126B3A] flex items-center justify-center font-bold mb-2">
            <ShieldCheck size={18} />
          </div>
          <h4 className="text-xs font-bold text-[#111814]">Agri Officer</h4>
          <p className="text-[10px] text-[#647067] mt-0.5 leading-tight">
            Review, verify & approve local advisories
          </p>
        </button>

        {/* Admin Option */}
        <button
          type="button"
          onClick={() => onSelectRole('admin')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
            selectedRole === 'admin'
              ? 'border-purple-600 bg-purple-50 shadow-sm ring-1 ring-purple-600'
              : 'border-[#E2E8E4] bg-white hover:bg-[#F7FAF7]'
          }`}
        >
          {selectedRole === 'admin' && (
            <div className="absolute top-2.5 right-2.5 text-purple-700">
              <CheckCircle size={15} />
            </div>
          )}
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-2">
            <Building2 size={18} />
          </div>
          <h4 className="text-xs font-bold text-[#111814]">District Admin</h4>
          <p className="text-[10px] text-[#647067] mt-0.5 leading-tight">
            Monitor sensor nodes & system pipelines
          </p>
        </button>
      </div>
    </div>
  )
}
