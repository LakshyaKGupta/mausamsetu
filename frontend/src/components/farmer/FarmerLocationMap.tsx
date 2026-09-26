import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'
import type { Language } from '@/types'

interface FarmerLocationMapProps {
  lat: number
  lon: number
  name: string
  lang: Language
}

const T: Record<Language, { showMap: string; hideMap: string; yourLocation: string }> = {
  hi: { showMap: '📍 मानचित्र देखें', hideMap: '📍 मानचित्र छुपाएं', yourLocation: 'आपका स्थान' },
  mr: { showMap: '📍 नकाशा पहा', hideMap: '📍 नकाशा लपवा', yourLocation: 'आपले स्थान' },
  en: { showMap: '📍 See Map', hideMap: '📍 Hide Map', yourLocation: 'Your Location' },
}

export const FarmerLocationMap: React.FC<FarmerLocationMapProps> = ({ lat, lon, name, lang }) => {
  const [expanded, setExpanded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const t = T[lang] || T.en

  useEffect(() => {
    if (!expanded || !mapRef.current) return

    // Dynamic import of Leaflet
    const loadMap = async () => {
      // @ts-ignore
      const L = await import('leaflet')
      // @ts-ignore
      await import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lon], 13)
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lon])
            .bindTooltip(`${name}`, { permanent: true, direction: 'top', className: 'font-bold' })
        }
        return
      }

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map)

      // Custom marker icon
      const icon = L.divIcon({
        html: `<div style="background:#047857;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      const marker = L.marker([lat, lon], { icon }).addTo(map)
      marker.bindTooltip(`${name}`, { permanent: true, direction: 'top', offset: [0, -30] })

      mapInstanceRef.current = map
      markerRef.current = marker

      // Force resize
      setTimeout(() => map.invalidateSize(), 100)
    }

    loadMap().catch(console.error)
  }, [expanded, lat, lon, name])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin size={14} className="text-emerald-600" />
          {t.yourLocation}: {name}
        </span>
        {expanded ? (
          <Minimize2 size={14} className="text-slate-400" />
        ) : (
          <Maximize2 size={14} className="text-slate-400" />
        )}
      </button>
      {expanded && (
        <div ref={mapRef} style={{ height: '200px', width: '100%' }} className="border-t border-slate-100" />
      )}
    </div>
  )
}
