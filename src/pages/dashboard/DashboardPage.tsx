import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, Clock, Activity, 
  Server, Zap, FileCode, Flame, Cpu, ShieldAlert,
  AlertTriangle, Code
} from 'lucide-react'
import { useAppSelector } from '@store/index'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { Skeleton, SkeletonCard } from '@components/common/Skeleton'
import { formatRelative, cn } from '@utils/cn'
import { Link } from 'react-router-dom'
import {
  getAnalyticsSummary,
  getCrashLocations,
  getActionableIncidents,
  getLogVolume,
  getServiceBreakdown,
  getSeverityDistribution,
  getIncidentTrend,
  AnalyticsSummary,
  CrashLocation,
  ActionableIncident,
  ServiceBreakdownItem,
  SeverityDistributionItem,
  IncidentTrendPoint
} from '@api/dashboard'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default function DashboardPage() {
  const user = useAppSelector(s => s.auth.user)

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [logVolume, setLogVolume] = useState<number | null>(null)
  const [crashLocations, setCrashLocations] = useState<CrashLocation[]>([])
  const [incidents, setIncidents] = useState<ActionableIncident[]>([])
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdownItem[]>([])
  const [severityDist, setSeverityDist] = useState<SeverityDistributionItem[]>([])
  const [incidentTrend, setIncidentTrend] = useState<IncidentTrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [m, l, c, i, sb, sd, it] = await Promise.all([
          getAnalyticsSummary(7),
          getLogVolume(),
          getCrashLocations(),
          getActionableIncidents(),
          getServiceBreakdown(7),
          getSeverityDistribution(7),
          getIncidentTrend(7)
        ])
        setSummary(m)
        setLogVolume(l)
        setCrashLocations(c)
        setIncidents(i)
        setServiceBreakdown(sb)
        setSeverityDist(sd)
        setIncidentTrend(it)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = [
    { 
      label: 'Active Criticals',  
      value: summary?.critical_count?.toString() || '0', 
      delta: summary?.critical_delta_pct != null && summary.critical_delta_pct !== 0
        ? `${summary.critical_delta_pct > 0 ? '+' : ''}${summary.critical_delta_pct}% vs last period`
        : '',
      icon: Flame,         
      color: 'text-red-500',    
      bg: 'bg-red-500/10' 
    },
    { 
      label: 'Total Issues (7d)', 
      value: summary?.total_incidents?.toString() || '0',  
      delta: summary?.total_delta_pct != null && summary.total_delta_pct !== 0
        ? `${summary.total_delta_pct > 0 ? '+' : ''}${summary.total_delta_pct}% vs last period`
        : '',  
      icon: Activity,      
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Resolution Rate (7d)',
      value: summary ? `${summary.resolution_rate}%` : '0%',     
      delta: summary?.resolution_rate_delta_pct != null && summary.resolution_rate_delta_pct !== 0
        ? `${summary.resolution_rate_delta_pct > 0 ? '+' : ''}${summary.resolution_rate_delta_pct}% vs last period`
        : '',     
      icon: ShieldAlert,   
      color: 'text-amber-500',  
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'Avg MTTR (7d)',          
      value: summary ? `${summary.avg_mttr_minutes}m` : '0m',  
      delta: summary?.mttr_delta_pct != null && summary.mttr_delta_pct !== 0
        ? `${summary.mttr_delta_pct > 0 ? '+' : ''}${summary.mttr_delta_pct}% vs last period`
        : '',  
      icon: Clock,         
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10' 
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] w-full pb-10">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const maxCrashCount = Math.max(...crashLocations.map(l => l.count), 1)
  const SEVERITY_COLORS: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    low: 'bg-blue-400'
  }
  const totalSeverity = severityDist.reduce((acc, curr) => acc + curr.count, 0) || 1
  const trendData = incidentTrend.map(t => ({ val: t.open + t.investigating }))
  const hasTrend = trendData.length > 1 && trendData.some(d => d.val > 0)

  return (
    <div className="space-y-6 max-w-[1400px] w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0] || 'Developer'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here is the current health of your microservices and recent production errors.</p>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {stats.map(stat => {
          const isVolume = stat.label === 'Total Issues (7d)'
          return (
            <motion.div key={stat.label} variants={item}>
              <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-[13px] font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                      {stat.delta && (
                        <p className={cn('text-xs mt-2 font-medium flex items-center gap-1', 
                          stat.delta.startsWith('+') ? 'text-red-500' : 'text-emerald-500'
                        )}>
                          {stat.delta}
                        </p>
                      )}
                    </div>
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                  </div>
                  
                  {isVolume && hasTrend && (
                    <div className="h-[40px] mt-4 -mx-2 -mb-2 relative z-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="val" 
                            stroke="#6366f1" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorVal)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column - Active Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 space-y-6"
        >
          <Card className="shadow-sm border-border overflow-hidden h-full">
            <CardHeader className="pb-4 border-b border-border bg-background/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  Actionable Incidents
                </CardTitle>
                <Link to="/dashboard/incidents" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  View all alerts &rarr;
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incidents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No active incidents! 🎉</div>
              ) : (
                <div className="flex flex-col">
                  {incidents.map(incident => {
                    let cleanPath = incident.file_path?.replace(/\\/g, '/') || 'unknown'
                    const parts = cleanPath.split('/')
                    if (parts.length > 2) {
                      cleanPath = parts.slice(-2).join('/')
                    }
                    return (
                      <Link key={incident.id} to={`/dashboard/incidents/${incident.id}`} className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 pl-6 hover:bg-muted/50 transition-colors group bg-card border-b border-border last:border-b-0">
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-[4px]",
                          incident.severity === 'critical' ? 'bg-red-500' : 
                          ['high', 'medium'].includes(incident.severity) ? 'bg-orange-500' : 'bg-blue-400'
                        )} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{incident.error_type}</h4>
                            <Badge variant={incident.severity === 'critical' ? 'critical' : ['high', 'medium'].includes(incident.severity) ? 'warning' : 'info'} dot className="scale-90 origin-left">
                              {incident.severity || 'unknown'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[12px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1 text-foreground bg-muted px-2 py-0.5 rounded border border-border"><Server size={12} className="text-primary" /> {incident.service_name}</span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground"><FileCode size={12} className="text-muted-foreground/70" /> {cleanPath}</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 text-right">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {incident.created_at ? formatRelative(incident.created_at) : ''}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Top Crash Locations */}
          <Card className="shadow-sm border-border h-full">
            <CardHeader className="pb-3 border-b border-border bg-background/50">
              <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                <Flame className="w-4 h-4 text-orange-500" />
                Top Crash Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {crashLocations.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-4">No crash locations found.</div>
              ) : (
                crashLocations.map(loc => {
                  const pct = (loc.count / maxCrashCount) * 100
                  let cleanPath = loc.path.replace(/\\/g, '/')
                  const parts = cleanPath.split('/')
                  if (parts.length > 2) {
                    cleanPath = parts.slice(-2).join('/')
                  }
                  return (
                    <div key={loc.path} className="relative overflow-hidden rounded-lg border border-border bg-card p-3 group hover:bg-muted/50 transition-colors">
                      <div 
                        className="absolute left-0 bottom-0 h-[3px] bg-red-500/50 transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex flex-col min-w-0 pr-4">
                          <span className="text-[13px] font-bold text-foreground truncate flex items-center gap-1.5">
                            {loc.type === 'MemoryError' ? <Cpu size={12} className="text-red-500"/> : 
                             loc.type === 'OperationalError' ? <Server size={12} className="text-orange-500"/> : 
                             <Code size={12} className="text-primary"/>}
                            {loc.type}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">{cleanPath}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground bg-background px-2 py-0.5 rounded shadow-sm shrink-0 border border-border">
                          {loc.count}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: 2 Column Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Service Health */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3 border-b border-border bg-background/50">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Activity className="w-4 h-4 text-primary" />
              Service Health (7d)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {serviceBreakdown.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-8">No services affected.</div>
            ) : (
              <div className="divide-y divide-border">
                {serviceBreakdown.slice(0, 4).map(svc => (
                  <div key={svc.service_name} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        svc.top_severity === 'critical' ? 'bg-red-500 animate-pulse' : 
                        svc.top_severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'
                      )} />
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{svc.service_name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{svc.count} open issues</p>
                      </div>
                    </div>
                    {svc.avg_confidence !== undefined && svc.avg_confidence > 0 && (
                      <Badge variant="neutral" className="text-[10px] bg-muted text-muted-foreground border border-border">
                        AI ~{Math.round(svc.avg_confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3 border-b border-border bg-background/50">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Severity Distribution (7d)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {severityDist.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-4">No active incidents.</div>
            ) : (
              <div className="space-y-4">
                <div className="h-2.5 w-full bg-muted rounded-full flex overflow-hidden">
                  {severityDist.map(s => (
                    <div 
                      key={s.severity} 
                      className={SEVERITY_COLORS[s.severity] || 'bg-slate-400'} 
                      style={{ width: `${(s.count / totalSeverity) * 100}%` }}
                      title={`${s.severity}: ${s.count}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 pt-1">
                  {severityDist.map(s => (
                    <div key={s.severity} className="flex items-center justify-between text-xs bg-background px-2.5 py-1.5 rounded-md border border-border">
                      <div className="flex items-center gap-1.5 capitalize text-muted-foreground font-medium">
                        <span className={cn("w-1.5 h-1.5 rounded-full", SEVERITY_COLORS[s.severity] || 'bg-slate-400')} />
                        {s.severity || 'Unknown'}
                      </div>
                      <span className="font-bold text-foreground">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}