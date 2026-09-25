import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token if present
// Attach auth token and demo role if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mausamsetu_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  const userJson = localStorage.getItem('mausamsetu_user')
  if (userJson) {
    try {
      const user = JSON.parse(userJson)
      if (user.role) {
        config.headers['X-Demo-Role'] = user.role
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

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mausamsetu_token')
      window.location.href = '/login'
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

  list: (params?: { status?: string; panchayat_id?: number; crop?: string }) =>
    api.get('/advisories/', { params }).then((r) => r.data),

  get: (id: number) => api.get(`/advisories/${id}`).then((r) => r.data),

  audit: (id: number) => api.get(`/advisories/${id}/audit`).then((r) => r.data),

  stats: (block?: string) => api.get('/advisories/stats', { params: block ? { block } : {} }).then((r) => r.data),

  districtSummary: (district?: string) =>
    api.get('/advisories/district/operations-summary', { params: district ? { district } : {} }).then((r) => r.data),

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
  getPanchayats: (block?: string) => api.get('/geography/panchayats', { params: block ? { block } : {} }).then((r) => r.data),
  getCrops: (state?: string) => api.get('/geography/crops', { params: state ? { state } : {} }).then((r) => r.data),
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
  getDashboard: (officerId: number) =>
    api.get(`/officers/${officerId}/dashboard`).then((r) => r.data),
  assign: (data: { officer_id: number; block: string }) =>
    api.post('/officers/assign', data).then((r) => r.data),
}

export const weatherApi = {
  getToday: (panchayat_id: number) =>
    api.get(`/weather/${panchayat_id}/today`).then((r) => r.data),
  getHistory: (panchayat_id: number, days = 7) =>
    api.get(`/weather/${panchayat_id}/history`, { params: { days } }).then((r) => r.data),
}

export const panchayatApi = {
  list: (district?: string) =>
    api.get('/panchayats/', { params: district ? { district } : {} }).then((r) => r.data),
  get: (id: number) => api.get(`/panchayats/${id}`).then((r) => r.data),
}

export const authApi = {
  login: (phone: string, otp?: string) =>
    api.post('/auth/login', { phone, otp: otp || '123456' }).then((r) => r.data),

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
    api.post('/auth/officer/request-otp', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/officer/verify-otp', { phone, otp }).then((r) => r.data),
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
