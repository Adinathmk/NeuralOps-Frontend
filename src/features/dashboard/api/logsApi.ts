import apiClient from '@lib/axios'

export interface LogEventResponse {
  log_id: string
  incident_id: string
  service_name: string
  environment: string
  severity: string
  error_type: string
  file_path: string | null
  line_number: number | null
  timestamp: string
  status: string
  s3_key: string
}

export interface LogSearchResponse {
  results: LogEventResponse[]
  total: number
  next_cursor: string | null
  took_ms: number
}

export interface FilterOptionsResponse {
  service_names: string[]
  severities: string[]
  error_types: string[]
  environments: string[]
  statuses: string[]
}

export interface LogSearchParams {
  severity?: string
  service_name?: string
  environment?: string
  error_type?: string
  file_path?: string
  status?: string
  time_window?: string
  time_from?: string
  time_to?: string
  page_size?: number
  cursor?: string
}

export const logsApi = {
  // GET /api/v1/logs/search
  searchLogs: async (params: LogSearchParams = {}) => {
    // Axios serializes params nicely, but we need to pass cursor correctly
    const response = await apiClient.get<LogSearchResponse>('/logs/search', { params })
    return response.data
  },

  // GET /api/v1/logs/search/filters
  getFilterOptions: async (time_window: string = '7d') => {
    const response = await apiClient.get<FilterOptionsResponse>('/logs/search/filters', {
      params: { time_window }
    })
    return response.data
  }
}
