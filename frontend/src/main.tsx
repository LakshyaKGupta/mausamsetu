import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

// Pages
import FarmerHome from './pages/farmer/Home'
import OfficerDashboard from './pages/officer/Dashboard'
import OfficerLogin from './pages/auth/OfficerLogin'

// Simple officer auth guard
function OfficerRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('mausamsetu_token')
  if (!token) return <Navigate to="/officer/login" replace />
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Farmer PWA */}
        <Route path="/" element={<FarmerHome />} />

        {/* Officer portal */}
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route
          path="/officer"
          element={
            <OfficerRoute>
              <OfficerDashboard />
            </OfficerRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
