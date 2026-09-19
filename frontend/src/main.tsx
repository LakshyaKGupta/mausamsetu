import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './styles/design-system.css'

// Layouts
import { PublicLayout } from './layouts/PublicLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'

// Public Landing Pages
import Home from './pages/landing/Home'
import HowItWorksPage from './pages/landing/HowItWorks'
import FarmersPage from './pages/landing/Farmers'
import OfficersPage from './pages/landing/Officers'

// Auth Pages
import LoginPage from './pages/auth/Login'
import SignupPage from './pages/auth/Signup'
import VerifyOTPPage from './pages/auth/VerifyOTP'
import ForgotPasswordPage from './pages/auth/ForgotPassword'

// Authenticated Application Pages
import FarmerHome from './pages/app/farmer/Home'
import OfficerDashboard from './pages/app/officer/Dashboard'
import AdminDashboard from './pages/app/admin/Admin'

// Officer Auth Guard
function OfficerRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('mausamsetu_token')
  const role = localStorage.getItem('mausamsetu_role')
  // Allow access if token or role is officer (supports both full JWT and demo session)
  if (!token && role !== 'officer') {
    return <Navigate to="/login?role=officer" replace />
  }
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. Public Product Website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/farmers" element={<FarmersPage />} />
          <Route path="/officers" element={<OfficersPage />} />
        </Route>

        {/* 2. Authentication Flow */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyOTPPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* 3. Authenticated Role Applications */}
        <Route path="/app" element={<AppLayout />}>
          {/* Farmer PWA */}
          <Route path="farmer" element={<FarmerHome />} />

          {/* Officer Console (Protected) */}
          <Route
            path="officer"
            element={
              <OfficerRoute>
                <OfficerDashboard />
              </OfficerRoute>
            }
          />

          {/* District Admin Console */}
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* 4. Backward Compatibility Redirects */}
        <Route path="/officer/login" element={<Navigate to="/login?role=officer" replace />} />
        <Route path="/officer" element={<Navigate to="/app/officer" replace />} />

        {/* 5. Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
