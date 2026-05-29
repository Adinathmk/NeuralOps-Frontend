import apiClient from '@lib/axios'
import type { Playbook } from '@/types'

interface PlaybooksListResponse {
  success: boolean
  message: string
  data: Playbook[]
}

interface PlaybookSingleResponse {
  success: boolean
  message: string
  data: Playbook
}

export const playbooksApi = {
  /** GET /api/playbooks/playbooks/ */
  list: () =>
    apiClient.get<PlaybooksListResponse>('/playbooks/playbooks/'),

  /** POST /api/playbooks/playbooks/ */
  create: (data: {
    error_pattern: string
    instructions: string
  }) =>
    apiClient.post<PlaybookSingleResponse>('/playbooks/playbooks/', data),

  /** PATCH /api/playbooks/playbooks/:id/ */
  update: (id: string, data: Partial<{
    error_pattern: string
    instructions: string
  }>) =>
    apiClient.patch<PlaybookSingleResponse>(`/playbooks/playbooks/${id}/`, data),

  /** DELETE /api/playbooks/playbooks/:id/ */
  delete: (id: string) =>
    apiClient.delete(`/playbooks/playbooks/${id}/`),
}
