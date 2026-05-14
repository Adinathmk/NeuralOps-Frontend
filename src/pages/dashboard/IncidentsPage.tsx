import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { fetchIncidentsThunk, setFilter } from '@store/slices/incidentsSlice'
import { Card, CardContent } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { Button } from '@components/common/Button'
import { Skeleton } from '@components/common/Skeleton'
import { formatRelative, cn } from '@utils/cn'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/types'

// Use mock data since we don't have a real backend connected
const mockIncidents: Incident[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  tenant_id: 't1',
  error_type: ['NullPointerException', 'ConnectionTimeout', 'OutOfMemoryError', 'KeyError', 'TypeError'][i % 5],
  file_path: ['services/payment/processor.py', 'lib/db/pool.ts', 'workers/job_queue.go', 'api/routes/users.py', 'core/cache.ts'][i % 5],
  line_number: 100 + i * 17,
  service_name: ['payment-service', 'api-gateway', 'worker', 'user-service', 'cache-service'][i % 5],
  environment: 'production',
  status: (['open', 'investigating', 'resolved', 'closed'] as IncidentStatus[])[i % 4],
  severity: (['critical', 'warning', 'info'] as IncidentSeverity[])[i % 3],
  root_cause: i % 2 === 0 ? 'Unhandled exception in async context' : undefined,
  confidence_score: 0.7 + (i % 3) * 0.1,
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
  updated_at: new Date().toISOString(),
}))

const SEVERITY_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All',      value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning',  value: 'warning' },
  { label: 'Info',     value: 'info' },
]

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All',           value: 'all' },
  { label: 'Open',          value: 'open' },
  { label: 'Investigating', value: 'investigating' },
  { label: 'Resolved',      value: 'resolved' },
  { label: 'Closed',        value: 'closed' },
]

export default function IncidentsPage() {
  const dispatch = useAppDispatch()
  const { filters } = useAppSelector(s => s.incidents)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = mockIncidents.filter(i => {
    if (filters.severity !== 'all' && i.severity !== filters.severity) return false
    if (filters.status   !== 'all' && i.status   !== filters.status)   return false
    if (search && !i.error_type.toLowerCase().includes(search.toLowerCase()) &&
        !i.file_path.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Incidents</h1>
          <p className="text-sm text-white/40 mt-0.5">{filtered.length} incidents found</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by error type or file…"
              className="w-full h-8 pl-8 pr-3 rounded-md border border-white/10 bg-surface-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neural-500 transition-colors"
            />
          </div>

          <FilterGroup
            label="Severity"
            options={SEVERITY_FILTERS}
            active={filters.severity}
            onChange={v => dispatch(setFilter({ severity: v }))}
          />
          <FilterGroup
            label="Status"
            options={STATUS_FILTERS}
            active={filters.status}
            onChange={v => dispatch(setFilter({ status: v as IncidentStatus | 'all' }))}
          />
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((incident, idx) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
          >
            <Link to={`/dashboard/incidents/${incident.id}`}>
              <IncidentCard incident={incident} />
            </Link>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle size={32} className="text-white/20 mb-3" />
            <p className="text-sm text-white/40">No incidents match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  const severityVariant = { critical: 'critical', warning: 'warning', info: 'info' }[incident.severity] as 'critical' | 'warning' | 'info'
  const statusVariant = { open: 'critical', investigating: 'warning', resolved: 'success', closed: 'neutral' }[incident.status] as 'critical' | 'warning' | 'success' | 'neutral'

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border bg-surface-1 hover:bg-surface-2 transition-all cursor-pointer group',
      incident.severity === 'critical' ? 'border-red-500/15 hover:border-red-500/25' :
      incident.severity === 'warning'  ? 'border-amber-500/15 hover:border-amber-500/25' :
                                         'border-white/8 hover:border-white/15'
    )}>
      {/* Severity indicator */}
      <div className={cn(
        'h-10 w-1 rounded-full shrink-0',
        incident.severity === 'critical' ? 'bg-red-500'   :
        incident.severity === 'warning'  ? 'bg-amber-500' : 'bg-blue-500'
      )} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-white/90 truncate">{incident.error_type}</p>
          <Badge variant={severityVariant} dot>{incident.severity}</Badge>
          <Badge variant={statusVariant}>{incident.status}</Badge>
        </div>
        <p className="text-xs text-white/40 truncate font-mono">
          {incident.file_path}:{incident.line_number}
        </p>
        {incident.root_cause && (
          <p className="text-xs text-white/50 truncate mt-1">{incident.root_cause}</p>
        )}
      </div>

      {/* Meta */}
      <div className="text-right shrink-0 space-y-1">
        <p className="text-xs text-white/60 font-medium">{incident.service_name}</p>
        {incident.confidence_score && (
          <div className="flex items-center justify-end gap-1.5">
            <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-neural-500"
                style={{ width: `${incident.confidence_score * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/30">{Math.round(incident.confidence_score * 100)}%</span>
          </div>
        )}
        <p className="text-[11px] text-white/30">{formatRelative(incident.created_at)}</p>
      </div>
    </div>
  )
}

function FilterGroup({ label, options, active, onChange }: {
  label: string
  options: Array<{ label: string; value: string }>
  active: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-white/40 shrink-0">{label}:</span>
      <div className="flex items-center gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              active === opt.value
                ? 'bg-neural-500/15 text-neural-400 ring-1 ring-neural-500/20'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}