import apiClient from '@lib/axios'

export interface DashboardMetrics {
  active_criticals: number
  new_issues: number
  avg_mttr: string
}

export interface CrashLocation {
  path: string
  type: string
  count: number
}

export interface ActionableIncident {
  id: string
  error_type: string
  error_message: string
  severity: string
  service_name: string
  created_at: string
  file_path: string
}

export interface AIInsight {
  id: string
  title: string
  description: string
  type: 'performance' | 'error'
}

export interface LogVolume {
  volume_24h: int
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const { data } = await apiClient.get<DashboardMetrics>('/analytics/dashboard/metrics/')
  return data
}

export const getCrashLocations = async (): Promise<CrashLocation[]> => {
  const { data } = await apiClient.get<CrashLocation[]>('/analytics/dashboard/crash-locations/')
  return data
}

export const getActionableIncidents = async (): Promise<ActionableIncident[]> => {
  const { data } = await apiClient.get<ActionableIncident[]>('/analytics/dashboard/actionable-incidents/')
  return data
}

export const getAIInsights = async (): Promise<AIInsight[]> => {
  const { data } = await apiClient.get<AIInsight[]>('/analytics/dashboard/insights/')
  return data
}

export const getLogVolume = async (): Promise<number> => {
  const { data } = await apiClient.get<{ volume_24h: number }>('/dashboard/log-volume')
  return data.volume_24h
}
