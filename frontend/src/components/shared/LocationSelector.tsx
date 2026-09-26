import { useState, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";

interface LocationOption {
  code: string;
  name: string;
}

interface LocationSelectorProps {
  onSelectionChange: (level: "state" | "district" | "block" | "gp" | "none", code: string, stateCode?: string, districtCode?: string, blockCode?: string) => void;
  disabled: boolean;
}

export default function LocationSelector({ onSelectionChange, disabled }: LocationSelectorProps) {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [blocks, setBlocks] = useState<LocationOption[]>([]);
  const [panchayats, setPanchayats] = useState<LocationOption[]>([]);

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedPanchayat, setSelectedPanchayat] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const fetchNic = useCallback(async (layerId: number, where: string) => {
    const res = await fetch(`${API_URL}/nic/query?layer_id=${layerId}&where=${encodeURIComponent(where)}&outFields=*`);
    const data = await res.json();
    return data.features || [];
  }, [API_URL]);

  // Load States initially
  useEffect(() => {
    fetchNic(0, "1=1")
      .then((features) => {
        const unique = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features.forEach((f: any) => {
          if (f.attributes.State_LGD && f.attributes.STNAME) {
            unique.set(f.attributes.State_LGD, f.attributes.STNAME);
          }
        });
        const arr = Array.from(unique, ([code, name]) => ({ code: String(code), name }));
        arr.sort((a, b) => a.name.localeCompare(b.name));
        setStates(arr);
      })
      .catch((err) => console.error("Failed to load states", err));
  }, [fetchNic]);

  // Load Districts when State changes
  useEffect(() => {
    if (!selectedState) return;
    fetchNic(1, `State_LGD=${selectedState}`)
      .then((features) => {
        const unique = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features.forEach((f: any) => {
          if (f.attributes.Dist_LGD && f.attributes.D_Pan_Name) {
            unique.set(f.attributes.Dist_LGD, f.attributes.D_Pan_Name);
          }
        });
        const arr = Array.from(unique, ([code, name]) => ({ code: String(code), name }));
        arr.sort((a, b) => a.name.localeCompare(b.name));
        setDistricts(arr);
        setSelectedDistrict("");
        setBlocks([]);
        setPanchayats([]);
      });
  }, [selectedState, fetchNic]);

  // Load Blocks when District changes
  useEffect(() => {
    if (!selectedDistrict) return;
    fetchNic(2, `dist_lgd=${selectedDistrict}`)
      .then((features) => {
        const unique = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features.forEach((f: any) => {
          if (f.attributes.block_lgd && f.attributes.B_Pan_Name) {
            unique.set(f.attributes.block_lgd, f.attributes.B_Pan_Name);
          }
        });
        const arr = Array.from(unique, ([code, name]) => ({ code: String(code), name }));
        arr.sort((a, b) => a.name.localeCompare(b.name));
        setBlocks(arr);
        setSelectedBlock("");
        setPanchayats([]);
      });
  }, [selectedDistrict, selectedState, fetchNic]);

  // Load Panchayats when Block changes
  useEffect(() => {
    if (!selectedBlock) return;
    fetchNic(3, `blklgdcode='${selectedBlock}'`)
      .then((features) => {
        const unique = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features.forEach((f: any) => {
          if (f.attributes.gp_code && f.attributes.gp_name) {
            unique.set(f.attributes.gp_code, f.attributes.gp_name);
          }
        });
        const arr = Array.from(unique, ([code, name]) => ({ code: String(code), name }));
        arr.sort((a, b) => a.name.localeCompare(b.name));
        setPanchayats(arr);
        setSelectedPanchayat("");
      });
  }, [selectedBlock, selectedDistrict, selectedState, fetchNic]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedState(val);
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedPanchayat("");
    onSelectionChange("state", val);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedBlock("");
    setSelectedPanchayat("");
    onSelectionChange("district", val, selectedState);
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBlock(val);
    setSelectedPanchayat("");
    onSelectionChange("block", val, selectedState, selectedDistrict);
  };

  const handlePanchayatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPanchayat(val);
    onSelectionChange("gp", val, selectedState, selectedDistrict, selectedBlock);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State / UT</label>
        <select
          className="bg-white font-medium text-sm text-slate-900 w-full outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer p-3 rounded-lg border border-slate-200 shadow-sm"
          value={selectedState}
          onChange={handleStateChange}
          disabled={disabled || states.length === 0}
        >
          <option value="" disabled>Select State / Union Territory</option>
          {states.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">District</label>
        <select
          className="bg-white font-medium text-sm text-slate-900 w-full outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer p-3 rounded-lg border border-slate-200 shadow-sm"
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={disabled || districts.length === 0}
        >
          <option value="" disabled>Select District Panchayat</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Block</label>
        <select
          className="bg-white font-medium text-sm text-slate-900 w-full outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer p-3 rounded-lg border border-slate-200 shadow-sm"
          value={selectedBlock}
          onChange={handleBlockChange}
          disabled={disabled || blocks.length === 0}
        >
          <option value="" disabled>Select Block Panchayat</option>
          {blocks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Gram Panchayat</label>
        <select
          className="bg-emerald-50 font-bold text-sm text-emerald-800 w-full outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer p-3 rounded-lg border border-emerald-200 shadow-sm"
          value={selectedPanchayat}
          onChange={handlePanchayatChange}
          disabled={disabled || panchayats.length === 0}
        >
          <option value="" disabled>Select Gram Panchayat</option>
          {panchayats.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
