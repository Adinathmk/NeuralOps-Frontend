import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown,
  ShieldAlert, Clock, CheckCircle2, Flame,
  Server, Bug, RefreshCw, BarChart2,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@utils/cn'
import {
  getAnalyticsSummary,
  getIncidentTrend,
  getSeverityDistribution,
  getServiceBreakdown,
  getErrorTypeBreakdown,
  getActionableIncidents,
  type AnalyticsSummary,
  type IncidentTrendPoint,
  type SeverityDistributionItem,
  type ServiceBreakdownItem,
  type ErrorTypeBreakdownItem,
  type ActionableIncident,
} from '@api/analytics'

// ── Design System ────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF4757',
  high:     '#FF7F11',
  medium:   '#3B82F6',
  low:      '#8B5CF6',
  info:     '#10B981',
  unknown:  '#64748B',
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
}

// ── Components ───────────────────────────────────────────────────────────────

function PremiumTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-xl px-4 py-3 shadow-xl">
      {label && <p className="text-slate-500 mb-2 font-medium text-xs uppercase tracking-wider">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-3 mb-1.5 last:mb-0">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600 text-sm font-medium">{entry.name}:</span>
          <span className="font-bold text-slate-900 text-sm ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({ title, value, delta, inverse, icon: Icon, color }: any) {
  const positive = inverse ? delta < 0 : delta > 0
  const neutral = delta === 0 || delta === null

  return (
    <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex justify-between group hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300">
      <div className="flex flex-col justify-between">
        <h3 className="text-slate-500 font-medium text-sm mb-4">{title}</h3>
        <div>
          <div className="text-[32px] leading-none font-bold text-slate-800 mb-3">{value}</div>
          <div className="flex items-center gap-2 text-xs">
            {neutral ? null : (
              <span className={cn("flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md", positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(delta)}%
              </span>
            )}
            <span className="text-slate-400 font-medium">{neutral ? 'No change' : 'vs last period'}</span>
          </div>
        </div>
      </div>
      <div 
        className="h-[52px] w-[52px] rounded-full flex items-center justify-center shrink-0" 
        style={{ backgroundColor: `${color}10`, color }}
      >
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  )
}

function SectionCard({ title, children, headerRight, className }: any) {
  return (
    <div className={cn("bg-white rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col", className)}>
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
        {headerRight}
      </div>
      <div className="p-6 flex-1 flex flex-col">{children}</div>
    </div>
  )
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-slate-100', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <style>{`@keyframes shimmer { 100% { transform: translateX(200%); } }`}</style>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<number>(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trend, setTrend] = useState<IncidentTrendPoint[]>([])
  const [severity, setSeverity] = useState<SeverityDistributionItem[]>([])
  const [services, setServices] = useState<ServiceBreakdownItem[]>([])
  const [errorTypes, setErrorTypes] = useState<ErrorTypeBreakdownItem[]>([])
  const [incidents, setIncidents] = useState<ActionableIncident[]>([])

  const fetchAll = useCallback(async (days: number, initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    try {
      const [s, t, sev, svc, err, inc] = await Promise.allSettled([
        getAnalyticsSummary(days),
        getIncidentTrend(days),
        getSeverityDistribution(days),
        getServiceBreakdown(days),
        getErrorTypeBreakdown(days),
        getActionableIncidents(),
      ])
      if (s.status === 'fulfilled') setSummary(s.value)
      if (t.status === 'fulfilled') setTrend(t.value)
      if (sev.status === 'fulfilled') setSeverity(sev.value)
      if (svc.status === 'fulfilled') setServices(svc.value)
      if (err.status === 'fulfilled') setErrorTypes(err.value)
      if (inc.status === 'fulfilled') setIncidents(inc.value)
    } catch (e) {
      console.error('Analytics fetch error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll(range, true) }, [range, fetchAll])

  // Data mapping
  const severityData = severity.map(s => ({
    name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    value: s.count,
    color: SEVERITY_COLORS[s.severity] || '#94A3B8'
  }))

  // Pad trend data if there's only 1 point so AreaChart can draw a curve with real dates
  const displayTrend = trend.length === 1 
    ? (() => {
        const current = new Date(trend[0].date)
        const prev = new Date(current)
        prev.setDate(prev.getDate() - 1)
        const next = new Date(current)
        next.setDate(next.getDate() + 1)
        
        const formatStr = (d: Date) => d.toISOString().split('T')[0]
        
        return [
          { date: formatStr(prev), open: 0, investigating: 0, resolved: 0, closed: 0 },
          trend[0],
          { date: formatStr(next), open: 0, investigating: 0, resolved: 0, closed: 0 }
        ]
      })()
    : trend

  return (
    <div className="max-w-[1440px] mx-auto pb-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-0.5">Performance & Intelligence metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 shrink-0 w-max">
          {[7, 14, 30].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                range === r ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {r} Days
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={() => fetchAll(range)}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 mr-1"
          >
            <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-[140px] rounded-[20px]" />)}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <motion.div variants={fadeUp}>
              <KpiCard
                title="Total Incidents"
                value={summary?.total_incidents.toLocaleString() || '0'}
                delta={summary?.total_delta_pct}
                icon={ShieldAlert}
                color="#6366F1"
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <KpiCard
                title="Resolution Rate"
                value={`${summary?.resolution_rate || 0}%`}
                delta={summary?.resolution_rate_delta_pct}
                inverse={true}
                icon={CheckCircle2}
                color="#10B981"
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <KpiCard
                title="Critical Issues"
                value={summary?.critical_count.toLocaleString() || '0'}
                delta={summary?.critical_delta_pct}
                inverse={true}
                icon={Flame}
                color="#FF4757"
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <KpiCard
                title="Avg Resolution Time"
                value={(summary?.avg_mttr_minutes || 0) >= 60 ? `${((summary?.avg_mttr_minutes || 0)/60).toFixed(1)}h` : `${summary?.avg_mttr_minutes || 0}m`}
                delta={summary?.mttr_delta_pct}
                inverse={true}
                icon={Clock}
                color="#F59E0B"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Trend Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <SectionCard 
            title="Incident Analytics" 
            headerRight={
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs text-slate-500 font-medium">Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-slate-500 font-medium">Investigating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-500 font-medium">Resolved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-xs text-slate-500 font-medium">Closed</span>
                </div>
              </div>
            }
          >
            {loading ? <Shimmer className="h-[280px]" /> : (
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvestigating" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#64748B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={v => v.slice(5)} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                    />
                    <Tooltip content={<PremiumTooltip />} />
                    <Area type="natural" dataKey="open" name="Open" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorOpen)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="natural" dataKey="investigating" name="Investigating" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorInvestigating)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="natural" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="natural" dataKey="closed" name="Closed" stroke="#64748B" strokeWidth={3} fillOpacity={1} fill="url(#colorClosed)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Donut Chart */}
        <motion.div variants={fadeUp}>
          <SectionCard title="Severity Breakdown">
            {loading ? <Shimmer className="h-[280px]" /> : (
              <div className="h-[280px] w-full flex flex-col items-center justify-center relative">
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%" cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PremiumTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Center text */}
                <div className="absolute top-[37%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <div className="text-[28px] font-black text-slate-800 leading-none">
                    {severity.reduce((a, b) => a + b.count, 0)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">Total</div>
                </div>
                {/* Custom Legend */}
                <div className="w-full grid grid-cols-2 gap-x-2 gap-y-3 mt-auto pt-2">
                  {severityData.slice(0,4).map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-600 font-medium flex-1 truncate">{d.name}</span>
                      <span className="text-xs font-bold text-slate-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={fadeUp}>
          <SectionCard title="Service Performance">
            {loading ? <Shimmer className="h-[260px]" /> : (
              <div className="h-[260px] w-full mt-2">
                  <div className="h-[260px] w-full mt-2 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {services.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">No service data available</div>
                    ) : (
                      services.slice(0, 6).map((svc, i) => {
                        const maxCount = Math.max(...services.map(s => s.count), 1)
                        const pct = Math.round((svc.count / maxCount) * 100)
                        const color = SEVERITY_COLORS[svc.top_severity] || '#8B5CF6'
                        
                        return (
                          <div key={svc.service_name} className="flex flex-col gap-1.5 group">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700 truncate">{svc.service_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `${color}15`, color }}>{svc.top_severity}</span>
                                <span className="text-xs font-black text-slate-800">{svc.count}</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Bar Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <SectionCard title="Top Error Types">
            {loading ? <Shimmer className="h-[260px]" /> : (
              <div className="h-[260px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={errorTypes.slice(0, 6)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="error_type" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 11 }} 
                      dy={10}
                      tickFormatter={(val) => val.length > 15 ? val.slice(0, 15) + '...' : val}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                    />
                    <Tooltip content={<PremiumTooltip />} />
                    <Bar dataKey="total_occurrences" name="Occurrences" fill="#38BDF8" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>

      {/* Table Section */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <SectionCard title="Actionable Incidents" className="p-0" headerRight={<button className="text-xs text-indigo-600 font-medium hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">View All</button>}>
          {loading ? (
            <div className="p-6"><Shimmer className="h-40" /></div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No actionable incidents right now.</div>
          ) : (
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">ID</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Error Type</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Service</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Severity</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 5).map((inc) => (
                    <tr key={inc.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">#{inc.id.slice(0,6)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{inc.error_type}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[250px]">{inc.error_message}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{inc.service_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold capitalize" style={{ backgroundColor: `${SEVERITY_COLORS[inc.severity] || '#94A3B8'}15`, color: SEVERITY_COLORS[inc.severity] || '#94A3B8' }}>
                          <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: SEVERITY_COLORS[inc.severity] || '#94A3B8' }} />
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </motion.div>

    </div>
  )
}