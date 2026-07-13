/**
 * dashboard.ts — re-exports from analytics.ts for backward compatibility.
 * DashboardPage imports from here; all types and functions now live in analytics.ts.
 */
export type {
  DashboardMetrics,
  CrashLocation,
  ActionableIncident,
  AIInsight,
  ServiceBreakdownItem,
  SeverityDistributionItem,
  IncidentTrendPoint,
  AnalyticsSummary,
} from './analytics'

export {
  getDashboardMetrics,
  getCrashLocations,
  getActionableIncidents,
  getAIInsights,
  getLogVolume,
  getServiceBreakdown,
  getSeverityDistribution,
  getIncidentTrend,
  getAnalyticsSummary,
} from './analytics'
