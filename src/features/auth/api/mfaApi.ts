// src/features/auth/api/mfaApi.ts
import apiClient from '@lib/axios'
import type { BackendResponse } from '@/types'

const unwrap = <T>(res: { data: BackendResponse<T> }) => res.data

// ── Response shapes ────────────────────────────────────────────────────────

export interface MFASetupData {
  secret:    string
  qr_code:   string   // data:image/png;base64,...
  setup_url: string
  message:   string
}

export interface MFAConfirmData {
  message:      string
  backup_codes: string[]
  warning:      string
}

export interface MFAStatusData {
  mfa_enabled: boolean
}

// ── API calls ──────────────────────────────────────────────────────────────

export const mfaApi = {
  // GET /api/auth/mfa/setup  — generates secret + QR code
  setup: () =>
    apiClient
      .get<BackendResponse<MFASetupData>>('/auth/mfa/setup')
      .then(unwrap),

  // POST /api/auth/mfa/confirm  — verify first TOTP code to activate MFA
  confirm: (code: string) =>
    apiClient
      .post<BackendResponse<MFAConfirmData>>('/auth/mfa/confirm', { code })
      .then(unwrap),

  // POST /api/auth/mfa/verify  — exchange mfa_token + code for access tokens
  verify: (mfa_token: string, code: string) =>
    apiClient
      .post<BackendResponse>('/auth/mfa/verify', { mfa_token, code })
      .then(unwrap),

  // POST /api/auth/mfa/disable  — disable MFA, needs password + TOTP code
  disable: (password: string, code: string) =>
    apiClient
      .post<BackendResponse>('/auth/mfa/disable', { password, code })
      .then(unwrap),
}