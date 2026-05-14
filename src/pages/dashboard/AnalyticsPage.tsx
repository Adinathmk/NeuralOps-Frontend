import { motion } from 'framer-motion'
import { TrendingUp, Clock, Target, Zap, BarChart2, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Badge } from '@components/common/Badge'
import { cn } from '@utils/cn'

// ── Mock analytics data ───────────────────────────────────────────────────────
const weeklyData = [
  { day: 'Mon', incidents: 12, resolved: 10 },
  { day: 'Tue', incidents: 8,  resolved: 8  },
  { day: 'Wed', incidents: 19, resolved: 15 },
  { day: 'Thu', incidents: 7,  resolved: 7  },
  { day: 'Fri', incidents: 14, resolved: 11 },
  { day: 'Sat', incidents: 4,  resolved: 4  },
  { day: 'Sun', incidents: 6,  resolved: 5  },
]

const errorTypes = [
  { type: 'NullPointerException', count: 34, pct: 28 },
  { type: 'ConnectionTimeout',    count: 27, pct: 22 },
  { type: 'OutOfMemoryError',     count: 21, pct: 17 },
  { type: 'KeyError',             count: 19, pct: 16 },
  { type: 'TypeError',            count: 14, pct: 11 },
  { type: 'Other',                count:  8, pct:  6 },
]

const serviceBreakdown = [
  { service: 'payment-service', incidents: 38, severity: 'critical' as const },
  { service: 'api-gateway',     incidents: 29, severity: 'warning' as const  },
  { service: 'worker',          incidents: 22, severity: 'warning' as const  },
  { service: 'user-service',    incidents: 15, severity: 'info' as const     },
  { service: 'cache-service',   incidents: 11, severity: 'info' as const     },
]

const kpiCards = [
  { label: 'Total Incidents',   value: '122',  delta: '+8%',  positive: false, icon: BarChart2,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { label: 'Avg MTTR',          value: '1.8m', delta: '-23%', positive: true,  icon: Clock,      color: 'text-neural-400', bg: 'bg-neural-500/10' },
  { label: 'Agent Accuracy',    value: '94%',  delta: '+2%',  positive: true,  icon: Target,     color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { label: 'Auto-Resolved',     value: '78%',  delta: '+5%',  positive: true,  icon: Zap,        color: 'text-purple-400', bg: 'bg-purple-500/10' },
]

const maxIncidents = Math.max(...weeklyData.map(d => d.incidents))

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-white/40 mt-0.5">Last 7 days · Production</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={13} /> Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, delta, positive, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className={cn('text-xs mt-1 font-medium', positive ? 'text-neural-400' : 'text-red-400')}>
                      {delta} this week
                    </p>
                  </div>
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', bg)}>
                    <Icon size={16} className={color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Incident volume chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Incident Volume</CardTitle>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Total</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-neural-400" />Resolved</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bar chart */}
              <div className="flex items-end gap-3 h-44 pt-4">
                {weeklyData.map(({ day, incidents, resolved }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="relative w-full flex items-end gap-1" style={{ height: 140 }}>
                      {/* Total bar */}
                      <div
                        className="flex-1 rounded-t-sm bg-red-500/30 border border-red-500/20 transition-all duration-500"
                        style={{ height: `${(incidents / maxIncidents) * 100}%` }}
                      />
                      {/* Resolved bar */}
                      <div
                        className="flex-1 rounded-t-sm bg-neural-500/50 border border-neural-500/30 transition-all duration-500"
                        style={{ height: `${(resolved / maxIncidents) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/30">{day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Severity breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader><CardTitle>By Severity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Critical', count: 38, pct: 31, color: 'bg-red-500',   bar: 'bg-red-500/20' },
                { label: 'Warning',  count: 51, pct: 42, color: 'bg-amber-500', bar: 'bg-amber-500/20' },
                { label: 'Info',     count: 33, pct: 27, color: 'bg-blue-500',  bar: 'bg-blue-500/20' },
              ].map(({ label, count, pct, color, bar }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-white/70">
                      <span className={cn('h-1.5 w-1.5 rounded-full', color)} /> {label}
                    </span>
                    <span className="text-white/40">{count} <span className="text-white/25">({pct}%)</span></span>
                  </div>
                  <div className={cn('h-1.5 w-full rounded-full', bar)}>
                    <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-white/8 space-y-2">
                <p className="text-xs text-white/40 font-medium">MTTR by severity</p>
                {[
                  { label: 'Critical', mttr: '0.9m' },
                  { label: 'Warning',  mttr: '1.8m' },
                  { label: 'Info',     mttr: '3.2m' },
                ].map(({ label, mttr }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-white/50">{label}</span>
                    <span className="text-neural-400 font-mono font-medium">{mttr}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top error types */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader><CardTitle>Top Error Types</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {errorTypes.map(({ type, count, pct }, i) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-white/20 w-4 font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70 truncate font-mono">{type}</span>
                      <span className="text-xs text-white/40 shrink-0 ml-2">{count}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-neural-500/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Service breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader><CardTitle>By Service</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {serviceBreakdown.map(({ service, incidents, severity }) => {
                const variant = { critical: 'critical', warning: 'warning', info: 'info' }[severity] as 'critical' | 'warning' | 'info'
                return (
                  <div key={service} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/4 transition-colors">
                    <div className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      severity === 'critical' ? 'bg-red-400' :
                      severity === 'warning'  ? 'bg-amber-400' : 'bg-blue-400'
                    )} />
                    <span className="text-xs text-white/70 flex-1 font-mono truncate">{service}</span>
                    <Badge variant={variant}>{incidents} incidents</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}