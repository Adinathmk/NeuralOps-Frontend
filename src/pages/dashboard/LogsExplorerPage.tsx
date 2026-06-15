import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Terminal, AlertCircle, Clock, Server, FileCode, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

import { logsApi, LogEventResponse, FilterOptionsResponse, LogSearchParams } from '@/features/dashboard/api/logsApi'
import { cn } from '@/utils/cn'

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
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200'
      case 'ERROR': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'INFO': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Terminal className="h-5 w-5 text-indigo-600" />
          </div>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by file path or error text..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              value={filters.file_path || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, file_path: e.target.value }))}
            />
          </div>
          <button 
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
          >
            Search Logs
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 shrink-0">
            <Filter className="h-4 w-4 text-slate-400" /> Filters:
          </div>
          
          <select 
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={filters.time_window || '7d'}
            onChange={(e) => handleFilterChange('time_window', e.target.value)}
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <select 
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={filters.severity || 'all'}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="all">All Severities</option>
            {filterOptions?.severities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={filters.service_name || 'all'}
            onChange={(e) => handleFilterChange('service_name', e.target.value)}
          >
            <option value="all">All Services</option>
            {filterOptions?.service_names.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={filters.environment || 'all'}
            onChange={(e) => handleFilterChange('environment', e.target.value)}
          >
            <option value="all">All Environments</option>
            {filterOptions?.environments.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select 
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            {filterOptions?.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Area */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">
            Results <span className="text-slate-400 font-normal ml-1">({total.toLocaleString()})</span>
          </h2>
          {loading && !initialLoad && (
            <div className="text-xs font-medium text-indigo-600 flex items-center gap-2">
               <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
               <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <p className="text-sm text-slate-500 font-medium">Querying Elasticsearch...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-900 font-semibold mb-1">No logs found</p>
              <p className="text-slate-500 text-sm max-w-sm">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="min-w-max w-full">
              <div className="grid grid-cols-[160px_1fr_180px_160px_100px_100px] gap-4 px-6 py-3 border-b border-slate-100 bg-white text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                <div>Timestamp</div>
                <div>Error / Location</div>
                <div>Service</div>
                <div>Environment</div>
                <div>Severity</div>
                <div className="text-right">Action</div>
              </div>
              <div className="divide-y divide-slate-100">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      key={log.log_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-[160px_1fr_180px_160px_100px_100px] gap-4 px-6 py-3.5 items-center hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="text-sm text-slate-600 font-medium font-mono">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {log.error_type}
                        </div>
                        {log.file_path && (
                          <div className="text-xs text-slate-500 truncate mt-0.5 font-mono flex items-center gap-1">
                            <FileCode className="h-3 w-3" />
                            {log.file_path}:{log.line_number}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Server className="h-3.5 w-3.5 text-slate-400" />
                          {log.service_name}
                        </span>
                      </div>
                      
                      <div>
                        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {log.environment}
                        </span>
                      </div>
                      
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md border",
                          getSeverityColor(log.severity)
                        )}>
                          {log.severity?.toUpperCase() === 'CRITICAL' || log.severity?.toUpperCase() === 'ERROR' 
                            ? <XCircle className="h-3 w-3" /> 
                            : <AlertCircle className="h-3 w-3" />}
                          {log.severity}
                        </span>
                      </div>

                      <div className="text-right">
                        <button
                          onClick={() => navigate(`/dashboard/incidents/${log.incident_id}`)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View Incident &rarr;
                        </button>
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
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-center">
            <button
              onClick={() => fetchLogs(true)}
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm flex items-center gap-2"
            >
              Load More Results
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
