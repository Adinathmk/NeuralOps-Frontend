import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Terminal, AlertCircle, Clock, Server, FileCode, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

import { logsApi, LogEventResponse, FilterOptionsResponse, LogSearchParams } from '@/features/dashboard/api/logsApi'
import { cn } from '@/utils/cn'
import { Select } from '@/components/common/Select'

const TIME_OPTIONS = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

export default function LogsExplorerPage() {
  const navigate = useNavigate()
  
  // State
  const [logs, setLogs] = useState<LogEventResponse[]>([])
  const [total, setTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null)

  // Filters State
  const [filters, setFilters] = useState<LogSearchParams>({
    time_window: '7d',
    page_size: 50,
  })

  // Fetch Filter Options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await logsApi.getFilterOptions(filters.time_window)
        setFilterOptions(options)
      } catch (error) {
        console.error('Failed to load filter options:', error)
      }
    }
    loadFilterOptions()
  }, [filters.time_window])

  // Fetch Logs
  const fetchLogs = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true)
      const currentParams = { ...filters }
      if (isLoadMore && nextCursor) {
        currentParams.cursor = nextCursor
      } else {
        // Reset cursor if new search
        delete currentParams.cursor
      }

      const response = await logsApi.searchLogs(currentParams)
      
      setLogs(prev => isLoadMore ? [...prev, ...response.results] : response.results)
      setTotal(response.total)
      setNextCursor(response.next_cursor)
    } catch (error) {
      console.error('Failed to search logs:', error)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [filters, nextCursor])

  // Re-fetch when filters change (debounced for search text could be added, but we'll use a simple approach for now)
  useEffect(() => {
    fetchLogs(false)
  }, [
    filters.severity, 
    filters.service_name, 
    filters.environment, 
    filters.error_type, 
    filters.status, 
    filters.time_window,
    // Note: If adding debounced text search for file_path, be careful not to trigger on every keystroke
  ])

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    fetchLogs(false)
  }

  const handleFilterChange = (key: keyof LogSearchParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/20 ring-1 ring-red-500/10'
      case 'ERROR':
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 ring-1 ring-orange-500/10'
      case 'WARNING':
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 ring-1 ring-yellow-500/10'
      case 'LOW':
      case 'INFO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 ring-1 ring-blue-500/10'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getSeverityDot = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500'
      case 'ERROR':
      case 'HIGH': return 'bg-orange-500'
      case 'WARNING':
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW':
      case 'INFO': return 'bg-blue-500'
      default: return 'bg-slate-500'
    }
  }

  // Show only the last 3 path segments to keep the column compact
  const shortenPath = (filePath: string) => {
    if (!filePath) return ''
    const parts = filePath.replace(/\\/g, '/').split('/')
    return parts.slice(-3).join('/')
  }

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log Explorer</h1>
            <p className="text-sm text-slate-500 font-medium">Search and analyze logs across all services</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
           <span className="flex items-center gap-2">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             Elasticsearch Connected
           </span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search by file path or error text..."
              className="block w-full pl-10 pr-3 py-2.5 bg-background text-foreground border border-input rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              value={filters.search_query || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value, file_path: undefined }))}
            />
          </div>
          <button 
            type="submit"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          >
            Search Logs
          </button>
        </form>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" /> Filters:
          </div>
          
          <Select 
            className="flex-1"
            value={filters.time_window || '7d'}
            onChange={(val) => handleFilterChange('time_window', val)}
            options={TIME_OPTIONS}
          />

          <Select 
            className="flex-1"
            value={filters.severity || 'all'}
            onChange={(val) => handleFilterChange('severity', val)}
            options={[
              { value: 'all', label: 'All Severities' },
              ...(filterOptions?.severities.map(s => ({ value: s, label: s })) || [])
            ]}
          />

          <Select 
            className="flex-1"
            value={filters.service_name || 'all'}
            onChange={(val) => handleFilterChange('service_name', val)}
            options={[
              { value: 'all', label: 'All Services' },
              ...(filterOptions?.service_names.map(s => ({ value: s, label: s })) || [])
            ]}
          />

          <Select 
            className="flex-1"
            value={filters.environment || 'all'}
            onChange={(val) => handleFilterChange('environment', val)}
            options={[
              { value: 'all', label: 'All Environments' },
              ...(filterOptions?.environments.map(e => ({ value: e, label: e })) || [])
            ]}
          />

          <Select 
            className="flex-1"
            value={filters.status || 'all'}
            onChange={(val) => handleFilterChange('status', val)}
            options={[
              { value: 'all', label: 'All Statuses' },
              ...(filterOptions?.statuses.map(s => ({ value: s, label: s })) || [])
            ]}
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Area */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Results
            </h2>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {total.toLocaleString()}
            </span>
          </div>
          {loading && !initialLoad && (
            <div className="text-xs font-medium text-primary flex items-center gap-2">
               <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Updating...
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {initialLoad && loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
               <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <p className="text-sm text-muted-foreground font-medium">Querying Elasticsearch...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold mb-1">No logs found</p>
              <p className="text-muted-foreground text-sm max-w-sm">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Column Headers */}
              <div className="grid grid-cols-[130px_1fr_160px_140px_130px] gap-0 border-b border-border bg-muted/30">
                {['Timestamp', 'Error / Location', 'Service', 'Environment', 'Severity'].map((col) => (
                  <div key={col} className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {col}
                  </div>
                ))}
              </div>
              {/* Rows */}
              <div className="divide-y divide-border/50">
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div
                      key={log.log_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => navigate(`/dashboard/incidents/${log.incident_id}`)}
                      className="grid grid-cols-[130px_1fr_160px_140px_130px] gap-0 items-center hover:bg-primary/[0.03] transition-colors group cursor-pointer relative"
                    >
                      {/* Left accent line on hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center rounded-r-full" />

                      {/* Timestamp */}
                      <div className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono tabular-nums">
                          <Clock className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>

                      {/* Error / Location */}
                      <div className="px-5 py-4 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', getSeverityDot(log.severity))} />
                          <span className="text-[13px] font-semibold text-foreground truncate">
                            {log.error_type}
                          </span>
                        </div>
                        {log.file_path && (
                          <div
                            title={`${log.file_path}:${log.line_number}`}
                            className="text-[11px] text-muted-foreground truncate font-mono flex items-center gap-1 ml-3.5"
                          >
                            <FileCode className="h-3 w-3 shrink-0" />
                            {shortenPath(log.file_path)}:{log.line_number}
                          </div>
                        )}
                      </div>

                      {/* Service */}
                      <div className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                          <Server className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {log.service_name}
                        </span>
                      </div>

                      {/* Environment */}
                      <div className="px-5 py-4">
                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
                          {log.environment}
                        </span>
                      </div>

                      {/* Severity */}
                      <div className="px-5 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide",
                          getSeverityColor(log.severity)
                        )}>
                          {log.severity?.toUpperCase() === 'CRITICAL' || log.severity?.toUpperCase() === 'ERROR'
                            ? <XCircle className="h-3 w-3" />
                            : <AlertCircle className="h-3 w-3" />}
                          {log.severity?.toLowerCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {nextCursor && !loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-center">
            <button
              onClick={() => fetchLogs(true)}
              className="px-6 py-2.5 bg-card border border-border text-foreground font-semibold text-sm rounded-xl hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm flex items-center gap-2"
            >
              Load More Results
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
