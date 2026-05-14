import apiClient from '@lib/axios'
import type {
  BackendResponse, Invitation, ValidatedInvitation,
  SendInvitationPayload, JoinPayload,
} from '@/types'

const unwrap = <T>(res: { data: BackendResponse<T> }) => res.data

export const invitationsApi = {
  // GET /api/invitations?status=pending
  list: (status = 'pending') =>
    apiClient.get<BackendResponse<Invitation[]>>('/invitations/', { params: { status } }).then(unwrap),

  // POST /api/invitations/send
  send: (data: SendInvitationPayload) =>
    apiClient.post<BackendResponse<Invitation>>('/invitations/send', data).then(unwrap),

  // GET /api/invitations/validate?token=...
  validate: (token: string) =>
    apiClient.get<BackendResponse<ValidatedInvitation>>('/invitations/validate', { params: { token } }).then(unwrap),

  // POST /api/invitations/join
  join: (data: JoinPayload) =>
    apiClient.post<BackendResponse>('/invitations/join', data).then(unwrap),

  // POST /api/invitations/<id>/cancel
  cancel: (invitationId: string) =>
    apiClient.post<BackendResponse>(`/invitations/${invitationId}/cancel`).then(unwrap),

  // POST /api/invitations/<id>/resend
  resend: (invitationId: string) =>
    apiClient.post<BackendResponse>(`/invitations/${invitationId}/resend`).then(unwrap),
}
