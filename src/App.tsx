// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@store/index'

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

// Settings pages
import SettingsPage       from '@pages/dashboard/settings/SettingsPage'
import AlertRulesPage     from '@pages/dashboard/settings/AlertRulesPage'
import PlaybooksPage      from '@pages/dashboard/settings/PlaybooksPage'
import TeamPage           from '@pages/dashboard/settings/TeamPage'

// Invitation pages
import AcceptInvitePage   from '@pages/invitations/AcceptInvitePage'

// Misc
import NotFoundPage       from '@pages/NotFoundPage'

// ── Route guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
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
          <Route path="/dashboard/notifications"           element={<NotificationsPage />} />
          <Route path="/dashboard/sessions"                element={<SessionsPage />} />
          <Route path="/dashboard/settings"                element={<SettingsPage />} />
          <Route path="/dashboard/settings/alert-rules"    element={<AlertRulesPage />} />
          <Route path="/dashboard/settings/playbooks"      element={<PlaybooksPage />} />
          <Route path="/dashboard/settings/team"           element={<TeamPage />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}