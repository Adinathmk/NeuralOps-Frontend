// src/App.tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@store/index'
import { setupWebPush } from '@lib/push'
import apiClient from '@lib/axios'

// Layouts
import { DashboardLayout } from '@components/layout/DashboardLayout'
import { AuthLayout }      from '@components/layout/AuthLayout'

// Auth pages
import LoginPage          from '@pages/auth/LoginPage'
import RegisterPage       from '@pages/auth/RegisterPage'
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from '@pages/auth/ResetPasswordPage'
import VerifyEmailPage    from '@pages/auth/VerifyEmailPage'
import OAuthCallbackPage  from '@pages/auth/OAuthCallbackPage'
import MFAVerifyPage      from '@/pages/auth/MFAVerifyPage'   // ← NEW
import RegisterSuccessPage from '@pages/auth/RegisterSuccessPage'

// Dashboard pages
import DashboardPage      from '@pages/dashboard/DashboardPage'
import IncidentsPage      from '@pages/dashboard/IncidentsPage'
import IncidentDetailPage from '@pages/dashboard/IncidentDetailPage'
import AnalyticsPage      from '@pages/dashboard/AnalyticsPage'
import NotificationsPage  from '@pages/dashboard/NotificationsPage'
import SessionsPage       from '@pages/dashboard/SessionsPage'
import ConfigurationPage  from '@pages/dashboard/configuration/ConfigurationPage'
import TeamPage           from '@pages/dashboard/TeamPage'
import LogsExplorerPage   from '@pages/dashboard/LogsExplorerPage'
import ProfilePage        from '@pages/dashboard/ProfilePage'

// Settings pages
import SettingsPage       from '@pages/dashboard/settings/SettingsPage'
import GitHubIntegrationPage from '@pages/dashboard/settings/GitHubIntegrationPage'
import ApiKeysPage          from '@pages/dashboard/settings/ApiKeysPage'
import BillingPage          from '@pages/dashboard/BillingPage'

// Invitation pages
import AcceptInvitePage   from '@pages/invitations/AcceptInvitePage'

// Misc
import NotFoundPage       from '@pages/NotFoundPage'

// ── Route guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      setupWebPush(apiClient).catch(console.error)
    }
  }, [isAuthenticated])

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

// Only accessible when there is a pending MFA challenge
function RequireMFA({ children }: { children: React.ReactNode }) {
  const mfaRequired = useAppSelector(s => s.auth.mfaRequired)
  const mfaToken    = useAppSelector(s => s.auth.mfaToken)
  if (!mfaRequired || !mfaToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Only accessible by specific roles
function RequireRole({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const user = useAppSelector(s => s.auth.user)
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Root redirect ── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ── Auth routes (guest only) ── */}
        <Route element={<RequireGuest><AuthLayout /></RequireGuest>}>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/register-success" element={<RegisterSuccessPage />} />

        </Route>

        {/* ── MFA challenge — public but only reachable if mfa_token exists ── */}
        <Route
          path="/mfa-verify"
          element={
            <RequireMFA>
              <MFAVerifyPage />
            </RequireMFA>
          }
        />

        {/* ── OAuth Callback ── */}
        <Route path="/auth/:provider/callback" element={<OAuthCallbackPage />} />

        {/* ── Invitation accept ── */}
        <Route path="/join" element={<AcceptInvitePage />} />

        {/* ── Protected dashboard ── */}
        <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route path="/dashboard"                         element={<DashboardPage />} />
          <Route path="/dashboard/incidents"               element={<IncidentsPage />} />
          <Route path="/dashboard/incidents/:id"           element={<IncidentDetailPage />} />
          <Route path="/dashboard/analytics"               element={<AnalyticsPage />} />
          <Route path="/dashboard/logs"                    element={<LogsExplorerPage />} />
          <Route path="/dashboard/notifications"           element={<NotificationsPage />} />
          <Route path="/dashboard/sessions"                element={<SessionsPage />} />
          <Route path="/dashboard/team"                    element={<TeamPage />} />
          <Route path="/dashboard/configuration"           element={<ConfigurationPage />} />
          <Route path="/dashboard/profile"                 element={<ProfilePage />} />
          <Route path="/dashboard/settings"                element={<SettingsPage />} />
          <Route path="/dashboard/settings/github"         element={<GitHubIntegrationPage />} />
          <Route path="/dashboard/settings/api-keys"       element={<ApiKeysPage />} />
          <Route path="/dashboard/billing"                 element={<RequireRole allowedRoles={['admin', 'engineer']}><BillingPage /></RequireRole>} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}