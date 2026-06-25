import apiClient from '@lib/axios'
import type { Incident, AnalysisDetail, IncidentStatus } from '@/types'

interface PaginatedIncidentsResponse {
  success: boolean
  message: string
  data: Incident[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

interface SingleIncidentResponse {
  success: boolean
  message: string
  data: {
    incident: Incident
    analysis: AnalysisDetail | null
  }
}

export const incidentsApi = {
  // GET /api/v1/incidents
  list: (params: Record<string, unknown> = {}) =>
    apiClient.get<PaginatedIncidentsResponse>('/incidents', { params }),

  // GET /api/v1/incidents/:id
  getById: (id: string) =>
    apiClient.get<SingleIncidentResponse>(`/incidents/${id}`),

  // PATCH /api/v1/incidents/:id
  update: (id: string, data: { status?: IncidentStatus; assigned_user_ids?: string[] | null; actor_id?: string; note?: string }) =>
    apiClient.patch(`/incidents/${id}`, data),

  // GET /api/v1/incidents/:id/context-logs
  getContextLogs: (id: string) =>
    apiClient.get(`/incidents/${id}/context-logs`),
}
