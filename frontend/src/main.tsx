import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './styles/design-system.css'

// Layouts
import { PublicLayout } from './layouts/PublicLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { BackendStatusIndicator } from './components/shared/BackendStatusIndicator'

// Public Landing Pages
const Home = lazy(() => import('./pages/landing/Home'))
const HowItWorksPage = lazy(() => import('./pages/landing/HowItWorks'))
const FarmersPage = lazy(() => import('./pages/landing/Farmers'))
const OfficersPage = lazy(() => import('./pages/landing/Officers'))

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/Login'))
const SignupPage = lazy(() => import('./pages/auth/Signup'))
const VerifyOTPPage = lazy(() => import('./pages/auth/VerifyOTP'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'))

// Authenticated Application Pages
const FarmerHome = lazy(() => import('./pages/app/farmer/Home'))
const FarmerForecastPage = lazy(() => import('./pages/app/farmer/Forecast'))
const FarmerMyCropsPage = lazy(() => import('./pages/app/farmer/MyCrops'))
const FarmerAdvisoryListPage = lazy(() => import('./pages/app/farmer/AdvisoryList'))
const FarmerAskPage = lazy(() => import('./pages/app/farmer/Ask'))
const OfficerDashboard = lazy(() => import('./pages/app/officer/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/app/admin/Admin'))
const MLShowcasePage = lazy(() => import('./pages/app/ml/MLShowcase'))

function RouteLoading() {
  return <div className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center text-sm font-medium text-slate-600">Loading MausamSetu…</div>
}

// Officer Auth Guard
function OfficerRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('mausamsetu_token')
  const role = localStorage.getItem('mausamsetu_role')
  // Allow access if token or role is officer or admin (supports full JWT and demo session)
  if (!token && role !== 'officer' && role !== 'admin') {
    return <Navigate to="/login?role=officer" replace />
  }
  return <>{children}</>
}

// Admin Auth Guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const role = localStorage.getItem('mausamsetu_role')
  if (role !== 'admin') {
    return <Navigate to="/login?role=admin" replace />
  }
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
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
          {/* Farmer PWA & 5-tab Workflow */}
          <Route path="farmer" element={<FarmerHome />} />
          <Route path="farmer/forecast" element={<FarmerForecastPage />} />
          <Route path="farmer/crops" element={<FarmerMyCropsPage />} />
          <Route path="farmer/advisories" element={<FarmerAdvisoryListPage />} />
          <Route path="farmer/ask" element={<FarmerAskPage />} />

          {/* Officer Console (Protected) */}
          <Route
            path="officer"
            element={
              <OfficerRoute>
                <OfficerDashboard />
              </OfficerRoute>
            }
          />

          {/* District Admin Console (Protected) */}
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* ML Model Lab — Admin Only */}
          <Route
            path="ml-showcase"
            element={
              <AdminRoute>
                <MLShowcasePage />
              </AdminRoute>
            }
          />
          <Route
            path="ml-lab"
            element={
              <AdminRoute>
                <MLShowcasePage />
              </AdminRoute>
            }
          />
        </Route>

        {/* 4. Backward Compatibility Redirects */}
        <Route path="/officer/login" element={<Navigate to="/login?role=admin" replace />} />
        <Route path="/officer" element={<Navigate to="/app/officer" replace />} />
        <Route path="/admin" element={<Navigate to="/app/admin" replace />} />

        {/* 5. Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BackendStatusIndicator />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
)

// Register PWA Service Worker for offline capability & mobile installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('MausamSetu PWA Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.warn('MausamSetu PWA Service Worker registration failed:', error)
      })
  })
}
