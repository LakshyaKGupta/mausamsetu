import { useState, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";
import { getApiBaseUrl } from "@/api/client";

interface LocationOption {
  code: string;
  name: string;
}

interface LocationSelectorProps {
  onSelectionChange: (
    level: "state" | "district" | "block" | "gp" | "none",
    code: string,
    stateCode?: string,
    districtCode?: string,
    blockCode?: string,
    name?: string
  ) => void;
  disabled: boolean;
  selectedGpCode?: string;
}

const DEFAULT_INDIAN_STATES: LocationOption[] = [
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '36', name: 'Telangana' },
  { code: '3', name: 'Punjab' },
  { code: '24', name: 'Gujarat' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '8', name: 'Rajasthan' },
  { code: '9', name: 'Uttar Pradesh' },
  { code: '6', name: 'Haryana' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '32', name: 'Kerala' },
  { code: '19', name: 'West Bengal' },
  { code: '10', name: 'Bihar' },
  { code: '21', name: 'Odisha' },
  { code: '20', name: 'Jharkhand' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '18', name: 'Assam' },
  { code: '2', name: 'Himachal Pradesh' },
  { code: '5', name: 'Uttarakhand' },
  { code: '30', name: 'Goa' },
  { code: '1', name: 'Jammu & Kashmir' },
  { code: '7', name: 'Delhi' },
  { code: '37', name: 'Ladakh' },
  { code: '4', name: 'Chandigarh' },
  { code: '34', name: 'Puducherry' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '14', name: 'Manipur' },
  { code: '17', name: 'Meghalaya' },
  { code: '15', name: 'Mizoram' },
  { code: '13', name: 'Nagaland' },
  { code: '16', name: 'Tripura' },
  { code: '35', name: 'Andaman & Nicobar' },
  { code: '31', name: 'Lakshadweep' },
  { code: '38', name: 'Dadra,Nagar Haveli,Daman & Diu' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function LocationSelector({
  onSelectionChange,
  disabled,
  selectedGpCode,
}: LocationSelectorProps) {
  const [states, setStates] = useState<LocationOption[]>(DEFAULT_INDIAN_STATES);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [blocks, setBlocks] = useState<LocationOption[]>([]);
  const [panchayats, setPanchayats] = useState<LocationOption[]>([]);

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedPanchayat, setSelectedPanchayat] = useState<string>("");

  const API_URL = `${getApiBaseUrl()}/api`;

  const fetchNic = useCallback(async (layerId: number, where: string) => {
    try {
      const res = await fetch(`${API_URL}/nic/query?layer_id=${layerId}&where=${encodeURIComponent(where)}&outFields=*`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.features || [];
    } catch (e) {
      console.warn("NIC query failed, using local hierarchy", e);
      return [];
    }
  }, [API_URL]);

  // Load States initially from API or keep default
  useEffect(() => {
    fetchNic(0, "1=1")
      .then((features) => {
        if (!features || features.length === 0) return;
        const unique = new Map();
        features.forEach((f: any) => {
          if (f.attributes && (f.attributes.State_LGD || f.attributes.state_lgd) && (f.attributes.STNAME || f.attributes.stname)) {
            const code = f.attributes.State_LGD || f.attributes.state_lgd;
            const name = f.attributes.STNAME || f.attributes.stname;
            unique.set(String(code), name);
          }
        });
        if (unique.size > 0) {
          const arr = Array.from(unique, ([code, name]) => ({ code: String(code), name }));
          arr.sort((a, b) => a.name.localeCompare(b.name));
          setStates(arr);
        }
      })
      .catch((err) => console.error("Failed to load states", err));
  }, [fetchNic]);


  // Load Districts when State changes
  useEffect(() => {
    if (!selectedState) return;
    fetchNic(1, `State_LGD=${selectedState}`)
      .then((features) => {
        const unique = new Map();
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
    const dObj = districts.find((d) => d.code === selectedDistrict);
    const dParam = dObj ? `&d_pan_name=${encodeURIComponent(dObj.name)}` : "";
    const stParam = selectedState ? `&State_LGD=${selectedState}` : "";

    fetchNic(2, `dist_lgd=${selectedDistrict}${stParam}${dParam}`)
      .then((features) => {
        const unique = new Map();
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
  }, [selectedDistrict, selectedState, fetchNic, districts]);


  // Sync external GP selection (e.g. from map pin clicks)
  useEffect(() => {
    if (selectedGpCode !== undefined && selectedGpCode !== selectedPanchayat) {
      setSelectedPanchayat(selectedGpCode);
    }
  }, [selectedGpCode, selectedPanchayat]);

  // Load Panchayats when Block changes
  useEffect(() => {
    if (!selectedBlock) return;
    const bObj = blocks.find((b) => b.code === selectedBlock);
    const bParam = bObj ? `&b_pan_name=${encodeURIComponent(bObj.name)}` : "";
    const dObj = districts.find((d) => d.code === selectedDistrict);
    const dParam = dObj ? `&d_pan_name=${encodeURIComponent(dObj.name)}` : "";
    const distParam = selectedDistrict ? `&dist_lgd=${selectedDistrict}` : "";
    const stParam = selectedState ? `&State_LGD=${selectedState}` : "";

    fetchNic(3, `blklgdcode='${selectedBlock}'${distParam}${stParam}${dParam}${bParam}`)
      .then((features) => {
        const unique = new Map();
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
  }, [selectedBlock, selectedDistrict, selectedState, fetchNic, blocks, districts]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const sObj = states.find((s) => s.code === val);
    setSelectedState(val);
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedPanchayat("");
    onSelectionChange("state", val, val, undefined, undefined, sObj?.name);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const dObj = districts.find((d) => d.code === val);
    setSelectedDistrict(val);
    setSelectedBlock("");
    setSelectedPanchayat("");
    onSelectionChange("district", val, selectedState, val, undefined, dObj?.name);
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const bObj = blocks.find((b) => b.code === val);
    setSelectedBlock(val);
    setSelectedPanchayat("");
    onSelectionChange("block", val, selectedState, selectedDistrict, val, bObj?.name);
  };

  const handlePanchayatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const gpObj = panchayats.find((p) => p.code === val);
    setSelectedPanchayat(val);
    onSelectionChange("gp", val, selectedState, selectedDistrict, selectedBlock, gpObj?.name);
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
