import apiClient from '@lib/axios'

// ── Shared Types ──────────────────────────────────────────────────────────────

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

// ── Analytics Types ───────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  period_days: number
  total_incidents: number
  total_delta_pct: number | null
  resolved_count: number
  resolution_rate: number
  resolution_rate_delta_pct: number | null
  critical_count: number
  critical_delta_pct: number | null
  avg_mttr_minutes: number
  mttr_delta_pct: number | null
}

export interface IncidentTrendPoint {
  date: string
  created: number
  resolved: number
}

export interface SeverityDistributionItem {
  severity: string
  count: number
}

export interface StatusDistributionItem {
  status: string
  count: number
}

export interface ServiceBreakdownItem {
  service_name: string
  count: number
  avg_confidence: number
  top_severity: string
}

export interface ErrorTypeBreakdownItem {
  error_type: string
  incident_count: number
  total_occurrences: number
}

export interface MttrTrendPoint {
  date: string
  avg_minutes: number
}

export interface FunnelStage {
  stage: string
  count: number
}

export interface EnvironmentBreakdownItem {
  environment: string
  count: number
}

export interface HeatmapCell {
  day: number   // 1=Sunday, 7=Saturday
  hour: number  // 0–23
  count: number
}

// ── Original Dashboard API (used by DashboardPage) ────────────────────────────

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

// ── Analytics API ─────────────────────────────────────────────────────────────

export const getAnalyticsSummary = async (days = 30): Promise<AnalyticsSummary> => {
  const { data } = await apiClient.get<AnalyticsSummary>('/analytics/dashboard/summary/', { params: { days } })
  return data
}

export const getIncidentTrend = async (days = 30): Promise<IncidentTrendPoint[]> => {
  const { data } = await apiClient.get<IncidentTrendPoint[]>('/analytics/dashboard/incident-trend/', { params: { days } })
  return data
}

export const getSeverityDistribution = async (days = 30): Promise<SeverityDistributionItem[]> => {
  const { data } = await apiClient.get<SeverityDistributionItem[]>('/analytics/dashboard/severity-distribution/', { params: { days } })
  return data
}

export const getStatusDistribution = async (days = 30): Promise<StatusDistributionItem[]> => {
  const { data } = await apiClient.get<StatusDistributionItem[]>('/analytics/dashboard/status-distribution/', { params: { days } })
  return data
}

export const getServiceBreakdown = async (days = 30): Promise<ServiceBreakdownItem[]> => {
  const { data } = await apiClient.get<ServiceBreakdownItem[]>('/analytics/dashboard/service-breakdown/', { params: { days } })
  return data
}

export const getErrorTypeBreakdown = async (days = 30): Promise<ErrorTypeBreakdownItem[]> => {
  const { data } = await apiClient.get<ErrorTypeBreakdownItem[]>('/analytics/dashboard/error-type-breakdown/', { params: { days } })
  return data
}

export const getMttrTrend = async (days = 14): Promise<MttrTrendPoint[]> => {
  const { data } = await apiClient.get<MttrTrendPoint[]>('/analytics/dashboard/mttr-trend/', { params: { days } })
  return data
}

export const getResolutionFunnel = async (days = 30): Promise<FunnelStage[]> => {
  const { data } = await apiClient.get<FunnelStage[]>('/analytics/dashboard/resolution-funnel/', { params: { days } })
  return data
}

export const getEnvironmentBreakdown = async (days = 30): Promise<EnvironmentBreakdownItem[]> => {
  const { data } = await apiClient.get<EnvironmentBreakdownItem[]>('/analytics/dashboard/environment-breakdown/', { params: { days } })
  return data
}

export const getHeatmapData = async (days = 30): Promise<HeatmapCell[]> => {
  const { data } = await apiClient.get<HeatmapCell[]>('/analytics/dashboard/heatmap/', { params: { days } })
  return data
}
