import apiClient from '@lib/axios'
import type { AlertRule } from '@/types'

interface AlertRulesListResponse {
  success: boolean
  message: string
  data: AlertRule[]
}

interface AlertRuleSingleResponse {
  success: boolean
  message: string
  data: AlertRule
}

export const alertRulesApi = {
  /** GET /api/alerts/alert-rules/ */
  list: () =>
    apiClient.get<AlertRulesListResponse>('/alerts/alert-rules/'),

  /** POST /api/alerts/alert-rules/ */
  create: (data: {
    confidence_threshold: number
    severity_filter: string[]
    destinations: import('@/types').AlertDestination[]
    enabled?: boolean
  }) =>
    apiClient.post<AlertRuleSingleResponse>('/alerts/alert-rules/', data),

  /** PATCH /api/alerts/alert-rules/:id/ */
  update: (id: string, data: Partial<{
    confidence_threshold: number
    severity_filter: string[]
    destinations: import('@/types').AlertDestination[]
    enabled: boolean
  }>) =>
    apiClient.patch<AlertRuleSingleResponse>(`/alerts/alert-rules/${id}/`, data),

  /** DELETE /api/alerts/alert-rules/:id/ */
  delete: (id: string) =>
    apiClient.delete(`/alerts/alert-rules/${id}/`),
}
