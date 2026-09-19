// Shared TypeScript types matching backend schemas

export type Language = 'hi' | 'mr' | 'en'

export type AdvisoryStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'sent'

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'partly_cloudy'

export interface Panchayat {
  id: number
  name: string
  block: string
  district: string
  state: string
  lat: number
  lng: number
  elevation_m?: number
  created_at: string
}

export interface Officer {
  id: number
  name: string
  phone: string
  block: string
  district: string
  is_active: boolean
}

export interface Farmer {
  id: number
  panchayat_id: number
  name: string
  phone: string
  preferred_language: Language
  crops: string[]
  land_area_acres?: number
}

export interface WeatherSummary {
  panchayat_id: number
  panchayat_name: string
  date: string
  temperature_max?: number
  temperature_min?: number
  rainfall_mm?: number
  humidity_pct?: number
  condition: WeatherCondition
  confidence_score: number
  predicted_rainfall_mm?: number
  baseline_rainfall_mm?: number
  expected_error_margin_mm?: number
  prediction_interval_lower_mm?: number
  prediction_interval_upper_mm?: number
  model_reliability?: 'HIGH' | 'MODERATE' | 'UNRELIABLE'
  provenance_stage?: 'AI_DOWNSCALED' | 'OFFICIAL_BASELINE' | 'OFFICER_APPROVED' | 'STALE'
  source_name?: string
}

export interface Advisory {
  id: number
  panchayat_id: number
  panchayat_name?: string
  crop: string
  advisory_date: string
  content_en: string
  content_hi: string
  content_mr?: string
  confidence_score: number
  ml_explanation?: Record<string, unknown>
  weather_snapshot?: Record<string, unknown>
  is_imd_fallback: boolean
  status: AdvisoryStatus
  officer_note?: string
  approved_at?: string
  sent_at?: string
  created_at: string
}

export interface AdvisoryListItem {
  id: number
  panchayat_id: number
  panchayat_name?: string
  crop: string
  advisory_date: string
  status: AdvisoryStatus
  confidence_score: number
  is_imd_fallback: boolean
  created_at: string
}

export interface StatsResponse {
  total_panchayats: number
  total_farmers: number
  pending_advisories: number
  approved_today: number
  sent_today: number
}

export interface ChatbotMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AuthState {
  officer: Officer | null
  token: string | null
}
