import axios from 'axios'

/**
 * Intelligently resolve the backend API Base URL across local development,
 * Vercel production/preview deployments, Render web services, and user overrides.
 */
export function getApiBaseUrl(): string {
  // 1. URL search parameter override (e.g. ?api_url=https://my-service.onrender.com)
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search)
      const queryApi = params.get('api_url')
      if (queryApi && queryApi.trim().startsWith('http')) {
        const clean = queryApi.trim().replace(/\/$/, '')
        localStorage.setItem('mausamsetu_api_url', clean)
        return clean
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // 2. Saved user/admin preference in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mausamsetu_api_url')
    if (saved && saved.trim().startsWith('http')) {
      return saved.trim().replace(/\/$/, '')
    }
  }

  // 3. Injected runtime window global variable
  if (typeof window !== 'undefined' && (window as any).__MAUSAMSETU_API_URL__) {
    return (window as any).__MAUSAMSETU_API_URL__.replace(/\/$/, '')
  }

  // 4. Vite build-time environment variable
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/$/, '')
    const isRemote = typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1'
    
    // If running in browser on Vercel/remote domain, avoid accidentally pointing to localhost
    if (!(isRemote && trimmed.includes('localhost'))) {
      return trimmed
    }
  }

  // 5. Default production fallback when running on Vercel or remote host
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://mausamsetu-api.onrender.com'
  }

  // 6. Local development default
  return 'http://localhost:8000'
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const clean = url.trim().replace(/\/$/, '')
    localStorage.setItem('mausamsetu_api_url', clean)
    window.dispatchEvent(new CustomEvent('mausamsetu_api_url_changed', { detail: clean }))
  }
}

export function resetApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mausamsetu_api_url')
    window.dispatchEvent(new CustomEvent('mausamsetu_api_url_changed', { detail: getApiBaseUrl() }))
  }
}

export async function checkBackendHealth(targetUrl?: string): Promise<{ ok: boolean; statusText: string; latencyMs: number }> {
  const base = (targetUrl || getApiBaseUrl()).replace(/\/$/, '')
  const startTime = Date.now()
  try {
    const resp = await axios.get(`${base}/health`, { timeout: 8000 })
    return {
      ok: resp.status === 200,
      statusText: resp.data?.status || 'ok',
      latencyMs: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      ok: false,
      statusText: err.message || 'unreachable',
      latencyMs: Date.now() - startTime,
    }
  }
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 45000, // 45 seconds to gracefully accommodate Render free-tier cold-start wake-up
  headers: { 'Content-Type': 'application/json' },
})

// Attach dynamically updated baseURL and authenticated identity
api.interceptors.request.use((config) => {
  const currentBase = getApiBaseUrl()
  if (currentBase) {
    config.baseURL = currentBase
  }

  const token = localStorage.getItem('mausamsetu_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  const userJson = localStorage.getItem('mausamsetu_user')
  if (import.meta.env.VITE_DEMO_MODE === 'true' && userJson) {
    try {
      const user = JSON.parse(userJson)
      if (user.role) {
        config.headers['X-Demo-Role'] = user.role
        if (user.role === 'admin') {
          config.headers['X-Admin-Scope'] = 'national'
        }
      }
      if (user.id && user.role === 'officer') {
        config.headers['X-Officer-Id'] = user.id
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return config
})

// Redirect to login on 401 & dispatch connection notice on failure
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mausamsetu_token')
      window.location.href = '/login'
    }
    if (typeof window !== 'undefined') {
      if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
        window.dispatchEvent(
          new CustomEvent('mausamsetu_backend_connection_issue', {
            detail: {
              url: err.config?.baseURL || getApiBaseUrl(),
              message: err.message,
              isTimeout: err.code === 'ECONNABORTED',
            },
          })
        )
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ---------------------------------------------------------------------------
// Typed API helpers
// ---------------------------------------------------------------------------

export const advisoryApi = {
  generate: (body: { panchayat_id: number; crop: string; crop_stage?: string }) =>
    api.post('/advisories/generate', body).then((r) => r.data),

  list: (params?: { status?: string; panchayat_id?: number; crop?: string; district?: string; block?: string }) =>
    api.get('/advisories/', { params }).then((r) => r.data),

  get: (id: number) => api.get(`/advisories/${id}`).then((r) => r.data),

  audit: (id: number) => api.get(`/advisories/${id}/audit`).then((r) => r.data),

  stats: (block?: string) => api.get('/advisories/stats', { params: block ? { block } : {} }).then((r) => r.data),

  districtSummary: (district?: string) =>
    api.get('/advisories/district/operations-summary', { params: district ? { district } : {} }).then((r) => r.data),

  districtAudit: () => api.get('/advisories/district/audit').then((r) => r.data),

  modelHealth: () => api.get('/advisories/district/model-health').then((r) => r.data),

  review: (
    id: number,
    officer_id: number,
    body: {
      action: 'approved' | 'modified' | 'rejected'
      reason_category?: string
      note?: string
      modified_content_hi?: string
      modified_content_en?: string
      modified_content_mr?: string
    }
  ) => api.patch(`/advisories/${id}/review`, body, { params: { officer_id } }).then((r) => r.data),

  send: (id: number) => api.post(`/advisories/${id}/send`).then((r) => r.data),

  getApprovedForPanchayat: (panchayat_id: number) =>
    api.get(`/advisories/panchayat/${panchayat_id}/approved`).then((r) => r.data),
}

export const geographyApi = {
  getStates: () => api.get('/geography/states').then((r) => r.data),
  getDistricts: (state?: string) => api.get('/geography/districts', { params: state ? { state } : {} }).then((r) => r.data),
  getBlocks: (district?: string) => api.get('/geography/blocks', { params: district ? { district } : {} }).then((r) => r.data),
  getPanchayats: (block?: string, district?: string) =>
    api.get('/geography/panchayats', { params: { ...(block ? { block } : {}), ...(district ? { district } : {}) } }).then((r) => r.data),
  getCrops: (state?: string) => api.get('/geography/crops', { params: state ? { state } : {} }).then((r) => r.data),
  searchLocations: (q: string) => api.get('/geography/search', { params: { q } }).then((r) => r.data),
}

export const fieldReportApi = {
  list: (params?: { block?: string; officer_id?: number }) =>
    api.get('/field-reports/', { params }).then((r) => r.data),
  create: (data: {
    panchayat_id: number
    crop: string
    crop_stage?: string
    category: string
    severity: string
    observation_notes: string
    action_recommended?: string
  }) => api.post('/field-reports/', data).then((r) => r.data),
}

export const officerApi = {
  list: (district?: string) =>
    api.get('/officers/', { params: district ? { district } : {} }).then((r) => r.data),
  getDashboard: (officerId: number, block?: string, district?: string) =>
    api.get(`/officers/${officerId}/dashboard`, { params: { ...(block ? { block } : {}), ...(district ? { district } : {}) } }).then((r) => r.data),
  assign: (data: { officer_id: number; block: string }) =>
    api.post('/officers/assign', data).then((r) => r.data),
  create: (data: {
    name: string
    phone: string
    district: string
    block: string
    email?: string
    designation?: string
    assigned_panchayats_count?: number
    status?: string
  }) => api.post('/officers/', data).then((r) => r.data),
  dispatchBroadcast: (data: {
    officer_id?: number
    block?: string
    panchayats: string[]
    channels: string[]
    priority: string
    crop: string
    message_text: string
  }) => api.post('/officers/broadcast', data).then((r) => r.data),
}

export const weatherApi = {
  getToday: (panchayat_id: number) =>
    api.get(`/weather/${panchayat_id}/today`).then((r) => r.data),
  getLiveWeather: (params: {
    lat: number
    lon: number
    name?: string
    block?: string
    district?: string
    state?: string
    elevation_m?: number
    crop?: string
  }) => api.get('/weather/live', { params }).then((r) => r.data),
  getLiveHourly: (params: {
    lat: number
    lon: number
    mode: string
    name?: string
    crop?: string
  }) => api.get('/weather/live-hourly', { params }).then((r) => r.data),
  geocodeSearch: (q: string) =>
    api.get('/weather/geocode', { params: { q } }).then((r) => r.data),
  reverseGeocode: (lat: number, lon: number, lang = 'en') =>
    api.get('/weather/reverse-geocode', { params: { lat, lon, lang } }).then((r) => r.data),
  getHistory: (panchayat_id: number, days = 7) =>
    api.get(`/weather/${panchayat_id}/history`, { params: { days } }).then((r) => r.data),
  getAgrometIndices: (panchayat_id: number) =>
    api.get(`/weather/${panchayat_id}/agromet-indices`).then((r) => r.data),
}

export const panchayatApi = {
  list: (district?: string) =>
    api.get('/panchayats/', { params: district ? { district } : {} }).then((r) => r.data),
  get: (id: number) => api.get(`/panchayats/${id}`).then((r) => r.data),
}

export const authApi = {
  institutionalLogin: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),

  farmerSignup: (data: {
    name: string
    phone: string
    state?: string
    district?: string
    block?: string
    panchayat_id?: number
    crops?: string[]
    preferred_language?: string
    land_area_acres?: number
  }) => api.post('/auth/farmer/signup', data).then((r) => r.data),

  demoSession: (role: 'farmer' | 'officer' | 'admin') =>
    api.get(`/auth/demo-session/${role}`).then((r) => r.data),

  requestOtp: (phone: string) =>
    api.post('/auth/farmer/request-otp', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/farmer/verify-otp', { phone, otp }).then((r) => r.data),
}

export const chatbotApi = {
  message: (body: {
    message: string
    language?: string
    panchayat_id?: number
    farmer_id?: number
    session_id?: number
  }) => api.post('/chatbot/message', body).then((r) => r.data),
}

export const farmerApi = {
  getCrops: () => api.get('/farmer/crops').then((r) => r.data),
  addCrop: (data: {
    crop: string
    variety: string
    stage: string
    daysAfterSowing: number
    areaAcres: number
  }) => api.post('/farmer/crops', data).then((r) => r.data),
  getMandiPrices: () => api.get('/farmer/mandi-prices').then((r) => r.data),
  getAdvice: (params: {
    lat: number
    lon: number
    crops: string
    language: string
  }) => api.get('/farmer/advice', { params }).then((r) => r.data),
  getCropAnalysis: (params: {
    lat: number
    lon: number
    crop: string
    stage?: string
    days_after_sowing?: number
  }) => api.get('/farmer/crop-analysis', { params }).then((r) => r.data),
}

export const adminApi = {
  dataHealth: () => api.get('/admin/data-health-pipelines').then((r) => r.data),
  getModelBenchmarkCurve: () => api.get('/admin/model-benchmark-curve').then((r) => r.data),
  simulateFallback: () => api.post('/admin/simulate-fallback').then((r) => r.data),
}

export const mlApi = {
  inferDownscale: (data: {
    target_elevation_m: number
    reference_elevation_m: number
    base_temperature_c: number
    base_precipitation_mm: number
    lapse_rate_c_per_km?: number
    aspect_windward?: boolean
    soil_saturation_pct?: number
    ndvi_index?: number
  }) => api.post('/ml/infer-downscale', data).then((r) => r.data),

  predictPestRisk: (data: {
    crop: string
    growth_stage: string
    avg_temp_72h: number
    avg_humidity_72h: number
    consecutive_rain_days: number
  }) => api.post('/ml/predict-pest-risk', data).then((r) => r.data),

  getMetrics: () => api.get('/ml/metrics').then((r) => r.data),
}


