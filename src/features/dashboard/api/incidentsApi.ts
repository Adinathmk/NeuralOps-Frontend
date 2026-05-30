import apiClient from '@lib/axios'
import type { Incident } from '@/types'

export const incidentsApi = {
  // GET /api/v1/incidents
  list: (params: Record<string, unknown> = {}) =>
    apiClient.get<{ results: Incident[]; count: number }>('/incidents', { params }),

  // GET /api/v1/incidents/:id
  getById: (id: string) =>
    apiClient.get<Incident>(`/incidents/${id}`),
}
