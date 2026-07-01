import apiClient from '@lib/axios'
import type {
  BackendResponse, User, AuthTokens,
  LoginFormData, RegisterFormData,
  ForgotPasswordFormData, ResetPasswordFormData, ChangePasswordFormData,
  Session,
} from '@/types'

// Helper: extract data from BackendResponse wrapper
const unwrap = <T>(res: { data: BackendResponse<T> }) => res.data

export const authApi = {
  // POST /api/auth/register
  register: (data: RegisterFormData) =>
    apiClient.post<BackendResponse<User>>('/auth/register', data).then(unwrap),

  // POST /api/auth/login
  login: (data: LoginFormData) =>
    apiClient.post<BackendResponse<User>>('/auth/login', data).then(unwrap),

  // POST /api/auth/logout
  logout: () =>
    apiClient.post<BackendResponse>('/auth/logout').then(unwrap),

  // POST /api/auth/refresh-token
  refreshToken: (refresh_token: string) =>
    apiClient.post<BackendResponse>('/auth/refresh-token', { refresh_token }).then(unwrap),

  // GET /api/auth/me
  me: () =>
    apiClient.get<BackendResponse<User>>('/auth/me').then(unwrap),

  // POST /api/auth/verify-email
  verifyEmail: (token: string) =>
    apiClient.post<BackendResponse<User>>('/auth/verify-email', { token }).then(unwrap),

  resendVerification: (email: string) =>
    apiClient.post<BackendResponse>('/auth/resend-verification', { email }).then(unwrap),

  // POST /api/auth/forgot-password
  forgotPassword: (data: ForgotPasswordFormData) =>
    apiClient.post<BackendResponse>('/auth/forgot-password', data).then(unwrap),

  // POST /api/auth/reset-password
  resetPassword: (data: ResetPasswordFormData) =>
    apiClient.post<BackendResponse>('/auth/reset-password', data).then(unwrap),

  // POST /api/auth/change-password
  changePassword: (data: ChangePasswordFormData) =>
    apiClient.post<BackendResponse>('/auth/change-password', data).then(unwrap),

  // GET /api/auth/sessions
  getSessions: () =>
    apiClient.get<BackendResponse<Session[]>>('/auth/sessions').then(unwrap),

  // POST /api/auth/sessions/<id>/revoke
  revokeSession: (sessionId: string) =>
    apiClient.post<BackendResponse>(`/auth/sessions/${sessionId}/revoke`).then(unwrap),

  // POST /api/auth/google/callback
  googleCallback: (code: string, invite_token?: string) =>
    apiClient.post<BackendResponse<User>>('/auth/google/callback', {
      code,
      ...(invite_token ? { invite_token } : {}),
    }).then(unwrap),

  // POST /api/auth/github/callback
  githubCallback: (code: string, invite_token?: string) =>
    apiClient.post<BackendResponse<User>>('/auth/github/callback', {
      code,
      ...(invite_token ? { invite_token } : {}),
    }).then(unwrap),

  // POST /api/auth/me/profile-picture/presigned-url
  getProfilePicturePresignedUrl: (filename: string, content_type: string) =>
    apiClient.post<BackendResponse<{ url: string; object_key: string }>>('/auth/me/profile-picture/presigned-url', {
      filename,
      content_type,
    }).then(unwrap),

  // POST /api/auth/me/profile-picture/confirm
  confirmProfilePictureUpload: (object_key: string) =>
    apiClient.post<BackendResponse<User>>('/auth/me/profile-picture/confirm', {
      object_key,
    }).then(unwrap),

  // DELETE /api/auth/me/profile-picture
  deleteProfilePicture: () =>
    apiClient.delete<BackendResponse<User>>('/auth/me/profile-picture').then(unwrap),
}
