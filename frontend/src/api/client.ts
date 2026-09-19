import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mausamsetu_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mausamsetu_token')
      window.location.href = '/officer/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ---------------------------------------------------------------------------
// Typed API helpers
// ---------------------------------------------------------------------------

export const advisoryApi = {
  generate: (body: { panchayat_id: number; crop: string }) =>
    api.post('/advisories/generate', body).then((r) => r.data),

  list: (params?: { status?: string; panchayat_id?: number; crop?: string }) =>
    api.get('/advisories/', { params }).then((r) => r.data),

  get: (id: number) => api.get(`/advisories/${id}`).then((r) => r.data),

  stats: () => api.get('/advisories/stats').then((r) => r.data),

  review: (
    id: number,
    officer_id: number,
    body: {
      action: 'approved' | 'modified' | 'rejected'
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
