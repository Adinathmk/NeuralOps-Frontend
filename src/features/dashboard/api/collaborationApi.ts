// src/features/dashboard/api/collaborationApi.ts
// REST client for the collaboration feature (incident discussion threads).
// All endpoints map to the Django collaboration app: /api/v1/collaboration/...

import apiClient from '@/lib/axios'
import type { BackendResponse, ThreadMessage, ThreadMeta } from '@/types'

export interface MessagesResponse {
  data: ThreadMessage[]
  thread: ThreadMeta
  message: string
  success: boolean
}

export interface PostMessagePayload {
  content: string
  parent_id?: string | null
}

export const collaborationApi = {
  /**
   * GET /api/v1/collaboration/incidents/:incidentId/messages/
   * Fetch all messages for the incident thread (oldest → newest).
   * Auto-creates the thread on first call.
   */
  getMessages: (incidentId: string): Promise<{ data: MessagesResponse }> =>
    apiClient.get(`/collaboration/incidents/${incidentId}/messages/`),

  /**
   * POST /api/v1/collaboration/incidents/:incidentId/messages/
   * Post a new message (or reply) to the incident thread.
   */
  postMessage: (
    incidentId: string,
    payload: PostMessagePayload
  ): Promise<{ data: BackendResponse<ThreadMessage> }> =>
    apiClient.post(`/collaboration/incidents/${incidentId}/messages/`, payload),

  /**
   * DELETE /api/v1/collaboration/incidents/:incidentId/messages/:messageId/
   * Soft-delete a message. Only the author or admin/owner may delete.
   */
  deleteMessage: (
    incidentId: string,
    messageId: string
  ): Promise<{ data: BackendResponse<ThreadMessage> }> =>
    apiClient.delete(
      `/collaboration/incidents/${incidentId}/messages/${messageId}/`
    ),

  /**
   * GET /api/v1/collaboration/incidents/:incidentId/status-history/
   * Fetch the status history for the incident.
   */
  fetchStatusHistory: (
    incidentId: string
  ): Promise<{ data: BackendResponse<any[]> }> =>
    apiClient.get(`/collaboration/incidents/${incidentId}/status_transitions/`),

  /**
   * GET /api/v1/team/members
   * Fetch all team members for assigning incidents.
   */
  fetchTeamMembers: (): Promise<{ data: BackendResponse<any[]> }> =>
    apiClient.get(`/team/members`),
}
