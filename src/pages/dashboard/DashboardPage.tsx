import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, Activity } from 'lucide-react'
import { useAppSelector } from '@store/index'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { Skeleton, SkeletonCard } from '@components/common/Skeleton'
import { formatRelative } from '@utils/cn'
import { cn } from '@utils/cn'
import type { Incident } from '@/types'

const mockStats = [
  { label: 'Open Incidents',    value: '12',  delta: '+3',   icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10' },
  { label: 'Resolved Today',   value: '8',   delta: '+2',   icon: CheckCircle,  color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Avg MTTR',         value: '1.8m', delta: '-12%', icon: Clock,        color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { label: 'Agent Accuracy',   value: '94%', delta: '+2%',  icon: TrendingUp,   color: 'text-amber-400',  bg: 'bg-amber-500/10' },
]

const mockIncidents = [
  {
    id: '1', tenant_id: 't1', error_type: 'NullPointerException', crash_file: 'services/payment/processor.py',
    crash_line: 142, service_name: 'payment-service', environment: 'production',
    status: 'open', severity: 'critical', root_cause: 'Unhandled None value in transaction dict',
    confidence_score: 0.91, created_at: new Date(Date.now() - 4 * 60000).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '2', tenant_id: 't1', error_type: 'ConnectionTimeout', crash_file: 'lib/db/pool.ts',
    crash_line: 87, service_name: 'api-gateway', environment: 'production',
    status: 'investigating', severity: 'warning', confidence_score: 0.76,
    created_at: new Date(Date.now() - 28 * 60000).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '3', tenant_id: 't1', error_type: 'OutOfMemoryError', crash_file: 'workers/job_queue.go',
    crash_line: 312, service_name: 'worker', environment: 'production',
    status: 'resolved', severity: 'critical', root_cause: 'Unclosed file descriptors causing memory leak',
    confidence_score: 0.88, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), updated_at: new Date().toISOString(),
  },
] as Incident[]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function DashboardPage() {
  const user = useAppSelector(s => s.auth.user)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening across your production systems.</p>
      </div>

      {/* Stats grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {mockStats.map(stat => (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className={cn('text-xs mt-1 font-medium', stat.color)}>{stat.delta} vs yesterday</p>
                  </div>
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', stat.bg)}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent incidents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Incidents</CardTitle>
                <a href="/dashboard/incidents" className="text-xs text-primary hover:text-primary transition-colors">
                  View all →
                </a>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {mockIncidents.map(incident => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Agent status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>AI Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="text-xs font-medium text-slate-700">LangGraph Agent</p>
                  <p className="text-[11px] text-primary">Running · 3 active tasks</p>
                </div>
              </div>

              {[
                { label: 'Celery Workers', status: 'Healthy', count: '12/20', ok: true },
                { label: 'Kafka Lag',      status: 'Normal',  count: '42ms',  ok: true },
                { label: 'pgvector',       status: 'Indexed', count: '14.2k chunks', ok: true },
                { label: 'GPT-4 API',      status: 'Nominal', count: '99.8%', ok: true },
              ].map(({ label, status, count, ok }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-primary' : 'bg-red-500')} />
                    <span className="text-xs text-slate-600">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">{count}</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Last 24h analysis</span>
                  <span className="text-xs font-medium text-slate-700">47 incidents</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[78%] rounded-full bg-primary" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">78% resolved automatically</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function IncidentRow({ incident }: { incident: Incident }) {
  const severityVariant = {
    critical: 'critical',
    warning:  'warning',
    info:     'info',
  }[incident.severity] as 'critical' | 'warning' | 'info'

  const statusVariant = {
    open:         'critical',
    investigating: 'warning',
    resolved:     'success',
    closed:       'neutral',
    draft:        'neutral',
  }[incident.status] as 'critical' | 'warning' | 'success' | 'neutral'

  return (
    <a href={`/dashboard/incidents/${incident.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all group">
      <div className={cn(
        'mt-0.5 h-2 w-2 rounded-full shrink-0',
        incident.severity === 'critical' ? 'bg-red-400' :
        incident.severity === 'warning'  ? 'bg-amber-400' : 'bg-blue-400'
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{incident.error_type}</p>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">{incident.crash_file}:{incident.crash_line}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant={severityVariant} dot>{incident.severity}</Badge>
          <Badge variant={statusVariant}>{incident.status}</Badge>
          {incident.confidence_score !== undefined && incident.confidence_score !== null && (
            <span className="text-[10px] text-slate-500">
              {Math.round(incident.confidence_score * 100)}% confidence
            </span>
          )}
        </div>
      </div>
      <span className="text-[11px] text-slate-500 shrink-0 mt-0.5">{formatRelative(incident.created_at)}</span>
    </a>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}