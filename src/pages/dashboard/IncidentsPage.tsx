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
  const { items, filters, isLoading, error } = useAppSelector(s => s.incidents)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchIncidentsThunk({
      status: filters.status !== 'all' ? filters.status : undefined,
      severity: filters.severity !== 'all' ? filters.severity : undefined,
      search: filters.search || undefined,
      page: filters.page,
    }))
  }, [dispatch, filters.status, filters.severity, filters.search, filters.page])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => dispatch(setFilter({ search })), 300)
    return () => clearTimeout(t)
  }, [search, dispatch])

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Incidents</h1>
          <p className="text-sm text-white/40 mt-0.5">{items.length} incidents found</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => dispatch(fetchIncidentsThunk({
          status: filters.status !== 'all' ? filters.status : undefined,
          severity: filters.severity !== 'all' ? filters.severity : undefined,
          search: filters.search || undefined,
          page: filters.page,
        }))} isLoading={isLoading}>
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
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading && items.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : (
          items.map((incident, idx) => (
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
          ))
        )}

        {!isLoading && items.length === 0 && !error && (
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