import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus,
  ShieldAlert, Clock, CheckCircle2, Flame,
  Server, Bug, Globe, Calendar, RefreshCw,
  Activity, Zap, BarChart2,
} from 'lucide-react'
import { cn } from '@utils/cn'
import {
  getAnalyticsSummary,
  getIncidentTrend,
  getSeverityDistribution,
  getServiceBreakdown,
  getErrorTypeBreakdown,
  getMttrTrend,
  getResolutionFunnel,
  getEnvironmentBreakdown,
  getHeatmapData,
  type AnalyticsSummary,
  type IncidentTrendPoint,
  type SeverityDistributionItem,
  type ServiceBreakdownItem,
  type ErrorTypeBreakdownItem,
  type MttrTrendPoint,
  type FunnelStage,
  type EnvironmentBreakdownItem,
  type HeatmapCell,
} from '@api/analytics'

// ── Design system ──────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF4757',
  high:     '#FF7F11',
  medium:   '#3B82F6',
  low:      '#8B5CF6',
  info:     '#10B981',
  unknown:  '#64748B',
}

const SEVERITY_GLOW: Record<string, string> = {
  critical: 'rgba(255,71,87,0.25)',
  high:     'rgba(255,127,17,0.25)',
  medium:   'rgba(59,130,246,0.25)',
  low:      'rgba(139,92,246,0.25)',
  info:     'rgba(16,185,129,0.25)',
  unknown:  'rgba(100,116,139,0.15)',
}

const ENV_PALETTE = [
  { color: '#6366F1', glow: 'rgba(99,102,241,0.3)' },
  { color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
  { color: '#10B981', glow: 'rgba(16,185,129,0.3)' },
  { color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  { color: '#94A3B8', glow: 'rgba(148,163,184,0.2)' },
]

const FUNNEL_PALETTE = [
  { from: '#FF4757', to: '#FF6B81' },
  { from: '#FF7F11', to: '#FFA040' },
  { from: '#3B82F6', to: '#60A5FA' },
  { from: '#10B981', to: '#34D399' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Animation variants ────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
}

// ── Premium Tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number | string; color: string }>
  label?: string
}

function PremiumTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-xs shadow-2xl"
      style={{
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {label && (
        <p className="text-slate-400 mb-2 font-medium tracking-wide">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span
            className="h-1.5 w-3 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-bold text-white ml-auto pl-3">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Empty & skeleton ──────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 gap-3">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Activity size={20} className="text-slate-300" />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-slate-100', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function Delta({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <span className="text-xs text-slate-400 font-medium">–</span>
  const positive = inverse ? value < 0 : value > 0
  const neutral = value === 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md',
        neutral
          ? 'bg-slate-100 text-slate-500'
          : positive
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-red-50 text-red-500'
      )}
    >
      {neutral ? <Minus size={10} /> : positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(value)}%
    </span>
  )
}

// ── Range selector ────────────────────────────────────────────────────────────

type Range = 7 | 14 | 30
const RANGES: Range[] = [7, 14, 30]

function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: 'rgba(0,0,0,0.06)' }}
    >
      {RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            'relative px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200',
            value === r
              ? 'text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {value === r && (
            <motion.span
              layoutId="range-pill"
              className="absolute inset-0 rounded-md"
              style={{ background: 'linear-gradient(135deg,#6366F1,#3B82F6)' }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{r}d</span>
        </button>
      ))}
    </div>
  )
}

// ── Glowing KPI Card ──────────────────────────────────────────────────────────

interface KpiConfig {
  label: string
  value: string
  delta: number | null
  inverse: boolean
  icon: React.ElementType
  accent: string       // hex
  accentBg: string     // tailwind class
  sub: string
}

function KpiCard({ card, delay }: { card: KpiConfig; delay: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay}>
      <div
        className="relative overflow-hidden rounded-2xl p-5 h-full group cursor-default"
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = `0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px ${card.accent}22`
          el.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Glow orb background */}
        <div
          className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-20 transition-opacity duration-300 group-hover:opacity-40"
          style={{ background: `radial-gradient(circle, ${card.accent}, transparent 70%)` }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
              {card.label}
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
              {card.value}
            </p>
            <div className="flex items-center gap-1.5">
              <Delta value={card.delta} inverse={card.inverse} />
              <span className="text-[11px] text-slate-400">vs prev period</span>
            </div>
          </div>
          <div
            className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', card.accentBg)}
            style={{ boxShadow: `0 4px 14px ${card.accent}40` }}
          >
            <card.icon size={19} style={{ color: card.accent }} />
          </div>
        </div>

        <p className="relative text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
          {card.sub}
        </p>
      </div>
    </motion.div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  headerRight,
  className,
}: {
  title: string
  subtitle?: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
  headerRight?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('rounded-2xl overflow-hidden', className)}
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: `${iconColor}15` }}
          >
            <Icon size={15} style={{ color: iconColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function IncidentHeatmap({ data }: { data: HeatmapCell[] }) {
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  let maxCount = 1
  data.forEach(({ day, hour, count }) => {
    const di = ((day - 1) + 7) % 7
    matrix[di][hour] = count
    if (count > maxCount) maxCount = count
  })

  const getCellStyle = (count: number): React.CSSProperties => {
    if (count === 0) return { background: '#F1F5F9', opacity: 1 }
    const t = count / maxCount
    if (t > 0.85) return { background: 'linear-gradient(135deg,#FF4757,#FF6B81)', boxShadow: '0 0 6px rgba(255,71,87,0.5)' }
    if (t > 0.65) return { background: 'linear-gradient(135deg,#FF7F11,#FFA040)', boxShadow: '0 0 5px rgba(255,127,17,0.4)' }
    if (t > 0.45) return { background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', boxShadow: '0 0 4px rgba(245,158,11,0.3)' }
    if (t > 0.25) return { background: 'linear-gradient(135deg,#6366F1,#818CF8)', boxShadow: '0 0 3px rgba(99,102,241,0.3)' }
    return { background: '#C7D2FE', opacity: 0.7 }
  }

  const hourLabels = [0, 4, 8, 12, 16, 20]

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex pl-10 mb-1.5">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center">
              {hourLabels.includes(h) && (
                <span className="text-[9px] font-medium text-slate-400">{h}h</span>
              )}
            </div>
          ))}
        </div>
        {/* Rows */}
        {DAY_LABELS.map((day, di) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 w-9 text-right shrink-0">{day}</span>
            {matrix[di].map((count, h) => (
              <div
                key={h}
                title={`${day} ${h}:00 — ${count} incidents`}
                className="flex-1 h-5 rounded cursor-default transition-transform hover:scale-110 hover:z-10"
                style={{ ...getCellStyle(count), borderRadius: '4px' }}
              />
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pl-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-400">None</span>
            {[
              { bg: '#C7D2FE' },
              { bg: 'linear-gradient(135deg,#6366F1,#818CF8)' },
              { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)' },
              { bg: 'linear-gradient(135deg,#FF7F11,#FFA040)' },
              { bg: 'linear-gradient(135deg,#FF4757,#FF6B81)' },
            ].map((s, i) => (
              <div key={i} className="h-3.5 w-6 rounded" style={{ background: s.bg }} />
            ))}
            <span className="text-[10px] font-medium text-slate-400">Peak</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Donut center label ────────────────────────────────────────────────────────

function DonutLabel({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" fontSize={22} fontWeight={800} fill="#0F172A">{total}</tspan>
      <tspan x="50%" dy={18} fontSize={10} fontWeight={600} fill="#94A3B8">incidents</tspan>
    </text>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange]       = useState<Range>(30)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [summary, setSummary]           = useState<AnalyticsSummary | null>(null)
  const [trend, setTrend]               = useState<IncidentTrendPoint[]>([])
  const [severity, setSeverity]         = useState<SeverityDistributionItem[]>([])
  const [services, setServices]         = useState<ServiceBreakdownItem[]>([])
  const [errorTypes, setErrorTypes]     = useState<ErrorTypeBreakdownItem[]>([])
  const [mttrTrend, setMttrTrend]       = useState<MttrTrendPoint[]>([])
  const [funnel, setFunnel]             = useState<FunnelStage[]>([])
  const [envBreakdown, setEnvBreakdown] = useState<EnvironmentBreakdownItem[]>([])
  const [heatmap, setHeatmap]           = useState<HeatmapCell[]>([])

  const fetchAll = useCallback(async (days: number, initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    try {
      const [s, t, sev, svc, err, mttr, fn, env, hm] = await Promise.allSettled([
        getAnalyticsSummary(days),
        getIncidentTrend(days),
        getSeverityDistribution(days),
        getServiceBreakdown(days),
        getErrorTypeBreakdown(days),
        getMttrTrend(Math.min(days, 14)),
        getResolutionFunnel(days),
        getEnvironmentBreakdown(days),
        getHeatmapData(days),
      ])
      if (s.status === 'fulfilled') setSummary(s.value)
      if (t.status === 'fulfilled') setTrend(t.value)
      if (sev.status === 'fulfilled') setSeverity(sev.value)
      if (svc.status === 'fulfilled') setServices(svc.value)
      if (err.status === 'fulfilled') setErrorTypes(err.value)
      if (mttr.status === 'fulfilled') setMttrTrend(mttr.value)
      if (fn.status === 'fulfilled') setFunnel(fn.value)
      if (env.status === 'fulfilled') setEnvBreakdown(env.value)
      if (hm.status === 'fulfilled') setHeatmap(hm.value)
    } catch (e) {
      console.error('Analytics fetch error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll(range, true) }, [range, fetchAll])

  // ── KPI config ───────────────────────────────────────────────────────────────
  const kpis: KpiConfig[] = summary ? [
    {
      label:    'Total Incidents',
      value:    summary.total_incidents.toLocaleString(),
      delta:    summary.total_delta_pct,
      inverse:  false,
      icon:     ShieldAlert,
      accent:   '#6366F1',
      accentBg: 'bg-indigo-50',
      sub:      `Over the last ${summary.period_days} days`,
    },
    {
      label:    'Resolution Rate',
      value:    `${summary.resolution_rate}%`,
      delta:    summary.resolution_rate_delta_pct,
      inverse:  true,
      icon:     CheckCircle2,
      accent:   '#10B981',
      accentBg: 'bg-emerald-50',
      sub:      `${summary.resolved_count.toLocaleString()} incidents resolved`,
    },
    {
      label:    'Avg MTTR',
      value:    summary.avg_mttr_minutes >= 60
                  ? `${(summary.avg_mttr_minutes / 60).toFixed(1)}h`
                  : `${summary.avg_mttr_minutes}m`,
      delta:    summary.mttr_delta_pct,
      inverse:  false,
      icon:     Clock,
      accent:   '#F59E0B',
      accentBg: 'bg-amber-50',
      sub:      'Mean time to resolution',
    },
    {
      label:    'Critical Incidents',
      value:    summary.critical_count.toLocaleString(),
      delta:    summary.critical_delta_pct,
      inverse:  false,
      icon:     Flame,
      accent:   '#FF4757',
      accentBg: 'bg-red-50',
      sub:      'Severity: critical only',
    },
  ] : []

  // ── derived chart data ────────────────────────────────────────────────────────
  const radialData = severity.map(s => ({
    name:  s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    value: s.count,
    fill:  SEVERITY_COLORS[s.severity] || '#64748B',
  }))

  const maxErrorOccurrences = Math.max(...errorTypes.map(e => e.total_occurrences), 1)
  const envTotal = envBreakdown.reduce((s, e) => s + e.count, 0)

  // Axis tick style
  const axisTick = { fontSize: 10, fill: '#94A3B8', fontWeight: 500 }

  return (
    <div className="space-y-6 max-w-[1400px] w-full pb-12">

      {/* ── shimmer keyframe ──*/}
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(200%); } }
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line { stroke-opacity: 0.5; }
      `}</style>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366F1,#3B82F6)' }}
            >
              <BarChart2 size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Analytics</h1>
          </div>
          <p className="text-sm text-slate-400 ml-9">
            Incident intelligence dashboard · {range}-day window
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RangeSelector value={range} onChange={r => setRange(r)} />
          <button
            onClick={() => fetchAll(range)}
            disabled={refreshing}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(0,0,0,0.09)', background: '#fff' }}
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-32" />)}
          </div>
        ) : (
          <motion.div
            key="kpis"
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {kpis.map((card, i) => <KpiCard key={card.label} card={card} delay={i * 0.07} />)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Incident Trend (full width) ────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <SectionCard
          title="Incident Volume Trend"
          subtitle={`Daily created vs resolved — last ${range} days`}
          icon={TrendingUp}
          iconColor="#6366F1"
          headerRight={
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-full" style={{ background: 'linear-gradient(90deg,#FF4757,#FF6B81)' }} />
                Created
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-full" style={{ background: 'linear-gradient(90deg,#10B981,#34D399)' }} />
                Resolved
              </span>
            </div>
          }
        >
          {loading ? (
            <Shimmer className="h-52" />
          ) : trend.length === 0 ? (
            <EmptyState label="No trend data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#FF4757" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#FF4757" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10B981" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow-red">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-green">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => d.slice(5)}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip content={<PremiumTooltip />} />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#FF4757"
                  strokeWidth={2.5}
                  fill="url(#gCreated)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#FF4757', strokeWidth: 2, stroke: '#fff' }}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,71,87,0.5))' }}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#gResolved)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </motion.div>

      {/* ── Row 2: Severity | Funnel | MTTR ───────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Severity Radial Rings */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="By Severity"
            subtitle="Incident distribution"
            icon={ShieldAlert}
            iconColor="#FF7F11"
          >
            {loading ? (
              <Shimmer className="h-56" />
            ) : severity.length === 0 ? (
              <EmptyState label="No severity data" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="18%"
                    outerRadius="92%"
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <defs>
                      {radialData.map((d, i) => (
                        <radialGradient key={i} id={`rg-${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={d.fill} stopOpacity={1} />
                          <stop offset="100%" stopColor={d.fill} stopOpacity={0.6} />
                        </radialGradient>
                      ))}
                    </defs>
                    <RadialBar
                      dataKey="value"
                      cornerRadius={6}
                      background={{ fill: '#F8FAFC' }}
                    >
                      {radialData.map((_, i) => (
                        <Cell key={i} fill={`url(#rg-${i})`} />
                      ))}
                    </RadialBar>
                    <Tooltip content={<PremiumTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {radialData.map(d => {
                    const total = radialData.reduce((s, x) => s + x.value, 0)
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                    return (
                      <div key={d.name} className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.fill, boxShadow: `0 0 5px ${d.fill}80` }}
                        />
                        <span className="text-xs text-slate-600 flex-1">{d.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: d.fill }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 w-8 text-right">{d.value}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </motion.div>

        {/* Resolution Funnel */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="Resolution Funnel"
            subtitle="Lifecycle stage distribution"
            icon={CheckCircle2}
            iconColor="#10B981"
          >
            {loading ? (
              <Shimmer className="h-56" />
            ) : funnel.every(f => f.count === 0) ? (
              <EmptyState label="No funnel data" />
            ) : (
              <div className="space-y-2.5 pt-2">
                {funnel.map((f, i) => {
                  const maxFunnel = Math.max(...funnel.map(x => x.count), 1)
                  const pct = Math.round((f.count / maxFunnel) * 100)
                  const palette = FUNNEL_PALETTE[i] || FUNNEL_PALETTE[0]
                  return (
                    <div key={f.stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: palette.from, boxShadow: `0 0 5px ${palette.from}80` }}
                          />
                          <span className="text-xs font-semibold text-slate-700">{f.stage}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">{f.count.toLocaleString()}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${palette.from}, ${palette.to})`, boxShadow: `0 0 8px ${palette.from}60` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 mt-2 border-t border-slate-100">
                  {(() => {
                    const open = funnel.find(f => f.stage === 'Open')?.count ?? 0
                    const resolved = funnel.find(f => f.stage === 'Resolved')?.count ?? 0
                    const total = funnel.reduce((s, f) => s + f.count, 0)
                    const rate = total > 0 ? Math.round(((resolved) / total) * 100) : 0
                    return (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Overall resolution rate</span>
                        <span
                          className="font-black text-lg"
                          style={{ background: 'linear-gradient(90deg,#10B981,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        >
                          {rate}%
                        </span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* MTTR Trend */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="MTTR Trend"
            subtitle="Avg resolution time per day (min)"
            icon={Clock}
            iconColor="#3B82F6"
          >
            {loading ? (
              <Shimmer className="h-56" />
            ) : mttrTrend.length === 0 ? (
              <EmptyState label="No resolved incidents yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mttrTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="mttrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => d.slice(5)}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip content={<PremiumTooltip />} />
                  {/* Glow area under line */}
                  <Area
                    type="monotone"
                    dataKey="avg_minutes"
                    stroke="transparent"
                    fill="url(#mttrGrad)"
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_minutes"
                    name="Avg MTTR (min)"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.6))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>

      {/* ── Row 3: Services | Error Types ────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Top Services */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="Top Services by Incidents"
            subtitle="Color indicates worst severity"
            icon={Server}
            iconColor="#6366F1"
          >
            {loading ? (
              <Shimmer className="h-56" />
            ) : services.length === 0 ? (
              <EmptyState label="No service data" />
            ) : (
              <div className="space-y-3">
                {services.slice(0, 7).map((svc, i) => {
                  const maxCount = Math.max(...services.map(s => s.count), 1)
                  const pct = Math.round((svc.count / maxCount) * 100)
                  const color = SEVERITY_COLORS[svc.top_severity] || '#64748B'
                  const glow = SEVERITY_GLOW[svc.top_severity] || 'transparent'
                  return (
                    <div key={svc.service_name} className="flex items-center gap-3 group">
                      <span className="text-[11px] font-bold text-slate-300 w-4 shrink-0 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-700 truncate font-mono">
                            {svc.service_name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md capitalize"
                              style={{ background: `${color}18`, color }}
                            >
                              {svc.top_severity}
                            </span>
                            <span className="text-xs font-black text-slate-800">{svc.count}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${color}cc, ${color})`,
                              boxShadow: `0 0 8px ${glow}`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Top Error Types */}
        <motion.div variants={fadeUp}>
          <SectionCard
            title="Top Error Types"
            subtitle="Ranked by total occurrence count"
            icon={Bug}
            iconColor="#FF4757"
          >
            {loading ? (
              <Shimmer className="h-56" />
            ) : errorTypes.length === 0 ? (
              <EmptyState label="No error type data" />
            ) : (
              <div className="space-y-3">
                {errorTypes.slice(0, 7).map((e, i) => {
                  const pct = Math.round((e.total_occurrences / maxErrorOccurrences) * 100)
                  const hue = [231, 262, 200, 180, 150, 30, 0][i] ?? 231
                  const barColor = `hsl(${hue}, 80%, 56%)`
                  return (
                    <div key={e.error_type} className="flex items-center gap-3">
                      <span
                        className="text-[11px] font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: `${barColor}18`, color: barColor }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono text-slate-700 truncate max-w-[180px]">
                            {e.error_type}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] text-slate-400">{e.incident_count} inc</span>
                            <span className="text-xs font-black text-slate-800">
                              {e.total_occurrences >= 1000
                                ? `${(e.total_occurrences / 1000).toFixed(1)}k`
                                : e.total_occurrences}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${barColor}99, ${barColor})` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>

      {/* ── Row 4: Environment Donut | Heatmap ───────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-5 gap-5"
      >
        {/* Environment donut */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <SectionCard
            title="By Environment"
            subtitle="Incident share per deployment env"
            icon={Globe}
            iconColor="#8B5CF6"
          >
            {loading ? (
              <Shimmer className="h-64" />
            ) : envBreakdown.length === 0 ? (
              <EmptyState label="No environment data" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <defs>
                      {envBreakdown.map((_, i) => (
                        <radialGradient key={i} id={`eg-${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={ENV_PALETTE[i % ENV_PALETTE.length].color} stopOpacity={1} />
                          <stop offset="100%" stopColor={ENV_PALETTE[i % ENV_PALETTE.length].color} stopOpacity={0.7} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={envBreakdown}
                      dataKey="count"
                      nameKey="environment"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {envBreakdown.map((_, i) => (
                        <Cell key={i} fill={`url(#eg-${i})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<PremiumTooltip />} />
                    {envTotal > 0 && <DonutLabel total={envTotal} />}
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-1">
                  {envBreakdown.map((env, i) => {
                    const pct = envTotal > 0 ? Math.round((env.count / envTotal) * 100) : 0
                    const palette = ENV_PALETTE[i % ENV_PALETTE.length]
                    return (
                      <div key={env.environment} className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: palette.color, boxShadow: `0 0 5px ${palette.glow}` }}
                        />
                        <span className="text-xs text-slate-600 flex-1 capitalize font-mono">
                          {env.environment}
                        </span>
                        <span className="text-xs font-black text-slate-800">{env.count}</span>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </motion.div>

        {/* Heatmap */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <SectionCard
            title="Incident Heatmap"
            subtitle="Peak hours by day of week — when do things break?"
            icon={Calendar}
            iconColor="#F59E0B"
          >
            {loading ? (
              <Shimmer className="h-64" />
            ) : heatmap.length === 0 ? (
              <EmptyState label="No heatmap data for this period" />
            ) : (
              <IncidentHeatmap data={heatmap} />
            )}
          </SectionCard>
        </motion.div>
      </motion.div>

    </div>
  )
}