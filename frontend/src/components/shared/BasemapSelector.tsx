import React, { useState } from 'react';

export type BasemapType = 'bhuvan' | 'nic-street' | 'nic-street-lite' | 'nic-satellite' | 'nic-terrain' | 'nic-imagery' | 'esri-street' | 'esri-satellite' | 'drone-map' | 'hybrid-drone' | 'india-aspiration' | 'land-use' | 'google-street' | 'google-satellite';

interface BasemapSelectorProps {
  activeBasemap: BasemapType;
  onSelect: (basemap: BasemapType) => void;
}

const basemaps: { id: BasemapType; name: string; img: string }[] = [
  { id: 'bhuvan', name: 'India', img: 'https://bhuvan-app1.nrsc.gov.in/bhuvan2d/bhuvan/images/bhuvan_logo.png' },
  { id: 'nic-street', name: 'NIC Street', img: 'https://a.tile.openstreetmap.org/2/1/1.png' },
  { id: 'nic-street-lite', name: 'NIC Street Lite', img: 'https://b.tile.openstreetmap.org/2/1/1.png' },
  { id: 'nic-satellite', name: 'NIC Satellite', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/2/1/1' },
  { id: 'nic-terrain', name: 'NIC Terrain', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/2/1/1' },
  { id: 'nic-imagery', name: 'NIC Imagery', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/2/1/1' },
  { id: 'esri-street', name: 'ESRI Street', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/2/1/1' },
  { id: 'esri-satellite', name: 'ESRI Satellite', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/2/1/1' },
  { id: 'drone-map', name: 'Drone Map', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/3/2/2' },
  { id: 'hybrid-drone', name: 'Hybrid Drone Map', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/3/2/3' },
  { id: 'india-aspiration', name: 'India Aspiration...', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/3/2/2' },
  { id: 'land-use', name: 'Land Use 2', img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/3/2/2' },
  { id: 'google-street', name: 'Google Street', img: 'https://mt1.google.com/vt/lyrs=m&x=1&y=1&z=2' },
  { id: 'google-satellite', name: 'Google Satellite', img: 'https://mt1.google.com/vt/lyrs=s&x=1&y=1&z=2' },
];

export const BasemapSelector: React.FC<BasemapSelectorProps> = ({ activeBasemap, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col-reverse items-start">
      {isOpen && (
        <div className="mb-2 bg-white shadow-xl border border-gray-200 w-[300px] max-h-[400px] overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h3 className="text-base text-gray-800">Basemaps</h3>
          </div>
          <div className="p-3 grid grid-cols-3 gap-x-2 gap-y-4 bg-white">
            {basemaps.map((map) => (
              <div 
                key={map.id} 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => {
                  onSelect(map.id);
                  setIsOpen(false);
                }}
              >
                <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeBasemap === map.id ? 'border-blue-500' : 'border-transparent group-hover:border-gray-300'}`}>
                  {map.id === 'bhuvan' ? (
                     <div className="w-full h-full bg-white flex items-center justify-center text-[10px] text-center p-1 text-gray-800 border border-gray-200 rounded-xl">India<br/>Map</div>
                  ) : (
                    <img src={map.img} alt={map.name} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  )}
                </div>
                <span className="text-[11px] text-center mt-1 text-gray-800 font-medium w-full leading-tight">
                  {map.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-300 shadow-sm p-1.5 flex flex-col items-center justify-center hover:bg-gray-50 focus:outline-none rounded-md z-[1001]"
        title="BaseMaps"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {activeBasemap === 'bhuvan' ? (
             <div className="w-full h-full flex items-center justify-center text-[8px] text-center p-0.5 text-gray-800 leading-tight">India<br/>Map</div>
          ) : (
            <img src={basemaps.find(m => m.id === activeBasemap)?.img} alt="Active Map" className="w-full h-full object-cover" />
          )}
        </div>
        <span className="text-[11px] font-medium text-gray-800 mt-1">BaseMaps</span>
      </button>
    </div>
  );
};
