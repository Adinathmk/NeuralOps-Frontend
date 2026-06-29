// src/types/index.ts

// ─── Auth & User ─────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'engineer' | 'viewer'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  is_superadmin: boolean
  is_email_verified: boolean
  email_verified: boolean
  mfa_enabled?: boolean          // ← NEW
  avatar_url?: string
  tenant?: Tenant
  created_at: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan_tier: 'free' | 'pro' | 'max'
  status: 'active' | 'suspended'
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

// Actual backend response shape
export interface BackendResponse<T = unknown> {
  success:       boolean
  message:       string
  data?:         T
  access_token?: string
  refresh_token?: string
  // ── MFA-specific fields from login response ──
  mfa_token?:    string          // ← NEW — returned when MFA is required
  requires_mfa?: boolean         // ← NEW — flag that MFA step is needed
  code?: string
  errors?: Record<string, string[]>
}

export interface AuthState {
  user:            User | null
  tenant:          Tenant | null
  tokens:          AuthTokens | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null
  // ── MFA challenge state ──
  mfaRequired:     boolean       // ← NEW — show MFA page after login
  mfaToken:        string | null // ← NEW — temporary token to exchange
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  id: string
  device_name: string
  ip_address: string
  last_activity: string
  created_at: string
  expires_at: string
}

// ─── Invitation ───────────────────────────────────────────────────────────────

export type InvitationStatus = 'pending' | 'accepted' | 'cancelled' | 'expired'

export interface Invitation {
  id: string
  email: string
  role: UserRole
  status: InvitationStatus
  invited_by?: string
  tenant?: string
  created_at: string
  expires_at: string
  accepted_at?: string
}

export interface ValidatedInvitation {
  token: string
  email: string
  role: UserRole
  tenant: { id: string; name: string; slug: string }
  expires_at: string
}

export interface SendInvitationPayload {
  email: string
  role: UserRole
}

export interface JoinPayload {
  invite_token: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export type IncidentStatus   = 'open' | 'investigating' | 'resolved' | 'closed' | 'draft' | 'duplicate'
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface AnalysisDetail {
  id: string
  agent_version: string
  total_tokens_used?: number
  prompt_tokens?: number
  completion_tokens?: number
  total_latency_ms?: number
  node_results: Record<string, any>
  matched_playbook_id?: string
  created_at: string
}

export interface Incident {
  id: string
  tenant_id: string
  fingerprint: string
  status: IncidentStatus
  severity: IncidentSeverity
  error_type: string
  error_message?: string
  service_name: string
  environment: string
  crash_file?: string
  crash_line?: number
  crash_method?: string
  stack_frames: Array<{
    file: string
    line: number
    method: string
    module?: string
  }>
  root_cause?: string
  suggested_fix?: string
  confidence_score?: number
  occurrence_count: number
  occurrences: string[]
  is_draft: boolean
  assigned_user_ids: string[]
  source_log_id?: string
  first_seen_at: string
  last_seen_at: string
  resolved_at?: string
  created_at: string
  updated_at: string
  pr_url?: string
  pr_number?: number
  pr_status?: string
  pr_title?: string
  pr_error?: string
  analysis?: AnalysisDetail | null
}

// ─── Collaboration ────────────────────────────────────────────────────────────

export interface ThreadAuthor {
  id: string
  first_name: string
  last_name: string
  full_name: string
  avatar_colour: string
}

export interface ThreadMessage {
  id: string
  thread_id: string
  /** null for system-generated messages (status changes, assignments, AI events) */
  author: ThreadAuthor | null
  /** Returns 'This message was deleted.' for soft-deleted messages */
  content: string
  parent_id: string | null
  /** Direct replies to this message — only populated on top-level messages */
  replies?: ThreadMessage[]
  is_system_message: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface ThreadMeta {
  id: string
  incident_id: string
  message_count: number
  participant_count: number
  created_at: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'incident_created' | 'mention' | 'assignment' | 'status_change' | 'alert'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  incident_id?: string
  is_read: boolean
  created_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  total_incidents: number
  open_incidents: number
  resolved_incidents: number
  avg_mttr_minutes: number
  agent_accuracy_pct: number
  incidents_by_severity: Record<IncidentSeverity, number>
  incidents_by_day: Array<{ date: string; count: number }>
  top_error_types: Array<{ error_type: string; count: number }>
}

// ─── Alert Rules ──────────────────────────────────────────────────────────────

export type AlertDestination = 
  | { type: 'email'; address: string }
  | { type: 'in_app'; user_id: string }
  | { type: 'pagerduty'; integration_key?: string }
  | { type: 'slack'; webhook_url?: string }

export interface AlertRule {
  id: string
  tenant: string
  confidence_threshold: number
  severity_filter: IncidentSeverity[]
  destinations: AlertDestination[]
  enabled: boolean
  source_version: number
  created_at: string
  updated_at: string
}

// ─── Playbooks ────────────────────────────────────────────────────────────────

export interface Playbook {
  id: string
  tenant: string
  error_pattern: string
  instructions: string
  source_version: number
  created_at: string
  updated_at: string
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface UIState {
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  activeModal: string | null
  toasts: Toast[]
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
  tenant_name: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  token: string
  new_password: string
  new_password_confirm: string
}

export interface ChangePasswordFormData {
  current_password: string
  new_password: string
  new_password_confirm: string
}

// ─── GitHub Integration ───────────────────────────────────────────────────────

export interface GitHubIntegrationStatus {
  repo_url: string
  repo_owner: string
  repo_name: string
  indexing_status: 'pending' | 'indexing' | 'completed' | 'failed'
  last_indexed_commit?: string
  github_installation_id?: number
}

export interface GitHubIntegrationFormData {
  repo_url: string
  repo_owner: string
  repo_name: string
  github_installation_id: number
}