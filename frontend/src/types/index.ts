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

export type UserRole = 'farmer' | 'officer' | 'admin'

export interface WeatherSummary {
  panchayat_id: number
  panchayat_name: string
  date: string
  temperature_max?: number
  temperature_min?: number
  rainfall_mm?: number
  humidity_pct?: number
  wind_speed_kmh?: number
  elevation_m?: number
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
  forecast_issued_at?: string
  data_updated_at?: string
  valid_until?: string
}

export interface Advisory {
  id: number
  panchayat_id: number
  panchayat_name?: string
  crop: string
  crop_stage?: string
  advisory_date: string
  content_en: string
  content_hi: string
  content_mr?: string
  confidence_score: number
  baseline_rainfall_mm?: number
  predicted_rainfall_mm?: number
  model_diff_mm?: number
  reliability_tier?: string
  terrain_factors?: {
    elevation_m?: number
    orographic_lapse?: string
    station_calibration?: string
    terrain_roughness?: string
  }
  ml_explanation?: Record<string, unknown>
  weather_snapshot?: Record<string, unknown>
  is_imd_fallback: boolean
  status: AdvisoryStatus
  officer_note?: string
  approved_at?: string
  sent_at?: string
  created_at: string
  officer_name?: string
}

export interface AdvisoryListItem {
  id: number
  panchayat_id: number
  panchayat_name?: string
  crop: string
  crop_stage?: string
  advisory_date: string
  status: AdvisoryStatus
  confidence_score: number
  baseline_rainfall_mm?: number
  predicted_rainfall_mm?: number
  model_diff_mm?: number
  reliability_tier?: string
  is_imd_fallback: boolean
  created_at: string
}

export interface AdvisoryAuditItem {
  timestamp: string
  stage: string
  actor: string
  role: string
  action: string
  details: string
}

export interface AdvisoryAuditResponse {
  advisory_id: number
  panchayat_name: string
  crop: string
  status: AdvisoryStatus
  history: AdvisoryAuditItem[]
}

export interface DistrictAlertItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: 'advisory_pending' | 'stale_data' | 'station_offline' | 'forecast_deviation'
  title: string
  description: string
  affected_entity: string
  action_label: string
  action_target: string
}

export interface BlockSummaryItem {
  block: string
  total_panchayats: number
  verified_today: number
  pending_review: number
  stale_count: number
  avg_error_mm: string
  assigned_officer: string
}

export interface DistrictOperationsSummary {
  district: string
  total_panchayats: number
  total_blocks: number
  total_stations: number
  approved_today: number
  pending_advisories: number
  stale_panchayats: number
  offline_stations: number
  telemetry_status: string
  model_status: string
  alerts: DistrictAlertItem[]
  blocks: BlockSummaryItem[]
}

export interface ModelPerformanceResponse {
  model_version: string
  evaluation_period: string
  total_evaluation_samples: number
  baseline_mae_mm: number
  mausamsetu_mae_mm: number
  error_reduction_pct: number
  status: string
  last_evaluated_at: string
  fallback_rules: string[]
  baseline_mae?: number
  model_mae?: number
  baseline_rmse?: number
  model_rmse?: number
}

export interface UnifiedLoginResponse {
  access_token: string
  token_type: string
  role: UserRole
  user_id: number
  name: string
  phone: string
  district: string
  block?: string
  panchayat_id?: number
  panchayat_name?: string
  preferred_language?: Language
  crops?: string[]
}

export interface FarmerSignupRequest {
  name: string
  phone: string
  state?: string
  district?: string
  block?: string
  panchayat_id?: number
  crops?: string[]
  preferred_language?: Language
  land_area_acres?: number
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
  user: {
    id: number
    name: string
    role: UserRole
    phone: string
    block?: string
    district?: string
    panchayat_name?: string
  } | null
  token: string | null
}

// ---------------------------------------------------------------------------
// Geography & Multi-Crop Types (India-Ready)
// ---------------------------------------------------------------------------

export interface CropGrowthStage {
  id: string
  name: string
  name_hi: string
  duration_days: number
  moisture_sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
}

export interface CropMetadata {
  crop_id: string
  name: string
  name_hi: string
  name_mr: string
  category: string
  growth_stages: CropGrowthStage[]
  weather_thresholds: {
    critical_rain_mm_24h: number
    temp_max_c: number
    temp_min_c: number
    humidity_max_pct: number
  }
}

export interface StateConfig {
  state: string
  code: string
  languages: string[]
  major_crops: string[]
  districts_count: number
  is_active: boolean
  is_pilot?: boolean
}

export interface DistrictItem {
  district: string
  state: string
  blocks_count: number
  panchayats_count: number
  is_pilot: boolean
}

export interface BlockItem {
  block: string
  district: string
  state: string
  panchayats_count: number
  assigned_officer: string
}

export interface PanchayatHierarchyItem {
  id: number
  name: string
  block: string
  district: string
  state: string
  elevation_m: number
  registered_farmers: number
  primary_crops: string[]
  telemetry_status: 'FRESH' | 'STALE' | 'OFFLINE'
  last_sync: string
  weather_status_text?: string
  advisory_status?: string
  officer_name?: string
  model_state?: string
}

// ---------------------------------------------------------------------------
// Extension Field Reports & Officer Ops
// ---------------------------------------------------------------------------

export interface FieldReport {
  id: number
  officer_id: number
  panchayat_id: number
  crop: string
  crop_stage?: string
  category: 'pest_disease' | 'soil_moisture' | 'crop_stress' | 'drainage' | 'aws_sensor_drift' | 'general'
  severity: 'low' | 'medium' | 'high' | 'critical'
  observation_notes: string
  action_recommended?: string
  photo_url?: string
  panchayat_name?: string
  officer_name?: string
  created_at: string
}

export interface OfficerDirectoryItem {
  id: number
  name: string
  phone: string
  district: string
  block: string
  assigned_panchayats_count: number
  pending_reviews: number
  approved_today: number
  avg_review_time_mins: number
  status: 'active' | 'on_leave' | 'transferred'
  last_active: string
}

export interface OfficerBlockDashboard {
  officer_id: number
  officer_name: string
  block: string
  district: string
  total_panchayats: number
  total_farmers: number
  active_crops_count: number
  pending_advisories: number
  approved_today: number
  field_reports_count: number
  weather_watch_alerts: Array<{
    severity: 'critical' | 'warning' | 'info'
    type: string
    panchayats: string[]
    detail: string
  }>
  audit_trail?: Array<{
    time: string
    actor: string
    action: string
    details: string
  }>
}

