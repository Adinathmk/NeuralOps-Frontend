import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, Clock, Activity, 
  Server, Zap, FileCode, Flame, Cpu, ShieldAlert 
} from 'lucide-react'
import { useAppSelector } from '@store/index'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { formatRelative, cn } from '@utils/cn'
import { Link } from 'react-router-dom'
import {
  getDashboardMetrics,
  getCrashLocations,
  getActionableIncidents,
  getAIInsights,
  getLogVolume,
  DashboardMetrics,
  CrashLocation,
  ActionableIncident,
  AIInsight
} from '@api/dashboard'

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

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [logVolume, setLogVolume] = useState<number | null>(null)
  const [crashLocations, setCrashLocations] = useState<CrashLocation[]>([])
  const [incidents, setIncidents] = useState<ActionableIncident[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [m, l, c, i, ins] = await Promise.all([
          getDashboardMetrics(),
          getLogVolume(),
          getCrashLocations(),
          getActionableIncidents(),
          getAIInsights()
        ])
        setMetrics(m)
        setLogVolume(l)
        setCrashLocations(c)
        setIncidents(i)
        setInsights(ins)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = [
    { label: 'Active Criticals',  value: metrics?.active_criticals?.toString() || '0',     delta: '',    icon: Flame,         color: 'text-red-500',    bg: 'bg-red-500/10' },
    { label: 'Error Volume (24h)',value: logVolume ? (logVolume > 1000 ? `${(logVolume/1000).toFixed(1)}k` : logVolume.toString()) : '0',  delta: '',  icon: Activity,      color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'New Issues',        value: metrics?.new_issues?.toString() || '0',     delta: '',     icon: ShieldAlert,   color: 'text-amber-500',  bg: 'bg-amber-500/10' },
    { label: 'Avg MTTR',          value: metrics?.avg_mttr || '0m',  delta: '',  icon: Clock,         color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  ]

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6 max-w-[1400px] w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0] || 'Developer'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here is the current health of your microservices and recent production errors.</p>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {stats.map(stat => (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                    {stat.delta && (
                      <p className={cn('text-xs mt-2 font-medium flex items-center gap-1', 
                        stat.delta.startsWith('+') && stat.label === 'Active Criticals' ? 'text-red-500' :
                        stat.delta.startsWith('-') && stat.label === 'Avg MTTR' ? 'text-emerald-500' :
                        'text-slate-500'
                      )}>
                        {stat.delta} vs yesterday
                      </p>
                    )}
                  </div>
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', stat.bg)}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column - Active Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 space-y-6"
        >
          <Card className="shadow-sm border-slate-200/60 h-full">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  Actionable Incidents
                </CardTitle>
                <Link to="/dashboard/incidents" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  View all alerts &rarr;
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incidents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No active incidents! 🎉</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {incidents.map(incident => (
                    <Link key={incident.id} to={`/dashboard/incidents/${incident.id}`} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "inline-flex items-center justify-center h-5 w-5 rounded-md",
                            incident.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          )}>
                            <Flame size={12} strokeWidth={3} />
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{incident.error_type}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Server size={12} className="text-slate-400" /> {incident.service_name}</span>
                          <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"><FileCode size={12} /> {incident.file_path}</span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={10} /> {incident.created_at ? formatRelative(new Date(incident.created_at)) : ''}</span>
                      </div>
                    </Link>
                  ))}
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
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Top Crash Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {crashLocations.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">No crash locations found.</div>
              ) : (
                crashLocations.map(loc => (
                  <div key={loc.path} className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[13px] font-semibold text-slate-900 truncate">{loc.type}</span>
                      <span className="text-[11px] font-mono text-slate-500 truncate">{loc.path}</span>
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                      loc.count > 100 ? 'bg-red-50 text-red-600' :
                      loc.count > 50 ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'
                    )}>
                      {loc.count} err
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="shadow-sm border-slate-200/60 bg-gradient-to-b from-indigo-50/50 to-white">
            <CardHeader className="pb-3 border-b border-indigo-100/50">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-900">
                <Cpu className="w-4 h-4 text-indigo-500" />
                AI Root Cause Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {insights.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">No recent AI insights available.</div>
              ) : (
                insights.map((insight, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <div className="mt-0.5 shrink-0">
                      <Zap size={14} className={cn(
                        insight.type === 'performance' ? 'text-amber-500' : 'text-red-500'
                      )} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] leading-snug text-slate-700 font-medium group-hover:text-indigo-700 transition-colors">
                        {insight.description}
                      </p>
                      <p className="text-[10px] text-slate-400">{insight.title}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}