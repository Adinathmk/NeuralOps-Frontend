/**
 * dashboard.ts — re-exports from analytics.ts for backward compatibility.
 * DashboardPage imports from here; all types and functions now live in analytics.ts.
 */
export type {
  DashboardMetrics,
  CrashLocation,
  ActionableIncident,
  AIInsight,
} from './analytics'

export {
  getDashboardMetrics,
  getCrashLocations,
  getActionableIncidents,
  getAIInsights,
  getLogVolume,
} from './analytics'
