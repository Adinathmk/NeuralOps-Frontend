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

// â”€â”€ Private route wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* â”€â”€ Root redirect â”€â”€ */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* â”€â”€ Auth routes (guest only) â”€â”€ */}
        <Route element={<RequireGuest><AuthLayout /></RequireGuest>}>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
        </Route>

        {/* â”€â”€ Public invitation accept (no auth required) â”€â”€ */}
        <Route path="/invitations/accept" element={<AcceptInvitePage />} />

        {/* â”€â”€ Protected dashboard routes â”€â”€ */}
        <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route path="/dashboard"                         element={<DashboardPage />} />
          <Route path="/dashboard/incidents"               element={<IncidentsPage />} />
          <Route path="/dashboard/incidents/:id"           element={<IncidentDetailPage />} />
          <Route path="/dashboard/analytics"               element={<AnalyticsPage />} />
          <Route path="/dashboard/notifications"           element={<NotificationsPage />} />
          <Route path="/dashboard/sessions"                element={<SessionsPage />} />

          {/* Settings sub-routes */}
          { <Route path="/dashboard/settings"                element={<SettingsPage />} />}
          <Route path="/dashboard/settings/alert-rules"   element={<AlertRulesPage />} />
          <Route path="/dashboard/settings/playbooks"      element={<PlaybooksPage />} />
          <Route path="/dashboard/settings/team"           element={<TeamPage />} /> 
        </Route>

        {/* â”€â”€ 404 â”€â”€ */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
