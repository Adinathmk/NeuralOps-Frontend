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
import { Select } from '@components/common/Select'
import { formatRelative, cn } from '@utils/cn'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/types'

const SEVERITY_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All',      value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High',     value: 'high' },
  { label: 'Medium',   value: 'medium' },
  { label: 'Low',      value: 'low' },
]

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All',           value: 'all' },
  { label: 'Open',          value: 'open' },
  { label: 'Investigating', value: 'investigating' },
  { label: 'Resolved',      value: 'resolved' },
  { label: 'Closed',        value: 'closed' },
  { label: 'Draft',         value: 'draft' },
]

const CATEGORY_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'Code Bug', value: 'code_bug' },
  { label: 'Database', value: 'database' },
  { label: 'Infra/Config', value: 'infra_config' },
  { label: 'External Dependency', value: 'external_dependency' },
  { label: 'Security', value: 'security' },
  { label: 'Unknown', value: 'unknown' },
]


export default function IncidentsPage() {
  const dispatch = useAppDispatch()
  const { items, filters, isLoading, error } = useAppSelector(s => s.incidents)
  const user = useAppSelector(s => s.auth.user)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchIncidentsThunk({
      status: filters.status !== 'all' ? filters.status : undefined,
      severity: filters.severity !== 'all' ? filters.severity : undefined,
      error_category: filters.category !== 'all' ? filters.category : undefined,
      assigned_user_id: filters.assignedToMe && user?.id ? user.id : undefined,
      search: filters.search || undefined,
      page: filters.page,
      is_draft: true,
    }))
  }, [dispatch, filters.status, filters.severity, filters.category, filters.search, filters.page, filters.assignedToMe, user?.id])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => dispatch(setFilter({ search })), 300)
    return () => clearTimeout(t)
  }, [search, dispatch])

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} incidents found</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => dispatch(fetchIncidentsThunk({
          status: filters.status !== 'all' ? filters.status : undefined,
          severity: filters.severity !== 'all' ? filters.severity : undefined,
          error_category: filters.category !== 'all' ? filters.category : undefined,
          assigned_user_id: filters.assignedToMe && user?.id ? user.id : undefined,
          search: filters.search || undefined,
          page: filters.page,
          is_draft: true,
        }))} isLoading={isLoading}>
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-border mt-2 mb-4">
        <button 
          onClick={() => dispatch(setFilter({ assignedToMe: false }))}
          className={cn("px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px", !filters.assignedToMe ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
        >
          All Incidents
        </button>
        <button 
          onClick={() => dispatch(setFilter({ assignedToMe: true }))}
          className={cn("px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px", filters.assignedToMe ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
        >
          My Incidents
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-5 flex flex-wrap gap-4 items-center bg-card rounded-2xl">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by error type or file…"
              className="block w-full pl-10 pr-3 py-2.5 bg-background text-foreground border border-input rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
          </div>

          <FilterGroup
            label="Severity"
            options={SEVERITY_FILTERS}
            active={filters.severity}
            onChange={v => dispatch(setFilter({ severity: v }))}
          />
          <FilterGroup
            label="Category"
            options={CATEGORY_FILTERS}
            active={filters.category}
            onChange={v => dispatch(setFilter({ category: v }))}
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
            <AlertTriangle size={32} className="text-muted-foreground/80 mb-3" />
            <p className="text-sm text-muted-foreground">No incidents match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  const severityVariant = { critical: 'critical', high: 'warning', medium: 'warning', low: 'info', unknown: 'neutral' }[incident.severity] as 'critical' | 'warning' | 'info' | 'neutral'
  const statusVariant = { open: 'critical', investigating: 'warning', resolved: 'success', closed: 'neutral', draft: 'neutral' }[incident.status] as 'critical' | 'warning' | 'success' | 'neutral'

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all cursor-pointer group',
      incident.severity === 'critical' ? 'border-red-500/15 hover:border-red-500/25' :
      ['high', 'medium'].includes(incident.severity) ? 'border-amber-500/15 hover:border-amber-500/25' :
      'border-border hover:border-border/80'
    )}>
      {/* Severity indicator */}
      <div className={cn(
        'h-10 w-1 rounded-full shrink-0',
        incident.severity === 'critical' ? 'bg-red-500' :
        ['high', 'medium'].includes(incident.severity) ? 'bg-amber-500' : 'bg-blue-500'
      )} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-foreground truncate">{incident.error_type}</p>
          <Badge variant={severityVariant} dot>{incident.severity}</Badge>
          <Badge variant={statusVariant}>{incident.status}</Badge>
          {incident.error_category && (
            <Badge variant="neutral" className="bg-muted text-muted-foreground font-medium">
              {incident.error_category}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {incident.crash_file}:{incident.crash_line}
        </p>
        {incident.root_cause && (
          <p className="text-xs text-muted-foreground truncate mt-1">{incident.root_cause}</p>
        )}
      </div>

      {/* Meta */}
      <div className="text-right shrink-0 space-y-1">
        <p className="text-xs text-muted-foreground font-medium">{incident.service_name}</p>
        {incident.confidence_score !== undefined && incident.confidence_score !== null && (
          <div className="flex items-center justify-end gap-1.5">
            <div className="h-1 w-16 rounded-full bg-card/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${incident.confidence_score * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{Math.round(incident.confidence_score * 100)}%</span>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">{formatRelative(incident.created_at)}</p>
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
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground shrink-0">{label}:</span>
      <Select
        value={active}
        onChange={onChange}
        options={options}
        className="w-40"
      />
    </div>
  )
}