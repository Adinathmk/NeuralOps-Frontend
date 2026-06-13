import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, AlertTriangle, Clock, User, Code2,
  Sparkles, MessageSquare, ChevronRight, CheckCircle,
  Copy, Send, AtSign,
} from 'lucide-react'
import { Badge } from '@components/common/Badge'
import { Button } from '@components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Skeleton } from '@components/common/Skeleton'
import { formatDate, formatRelative, cn } from '@utils/cn'
import type { Incident, ThreadMessage } from '@/types'
import { useAppSelector, useAppDispatch } from '@store/index'
import { fetchIncidentThunk } from '@store/slices/incidentsSlice'

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockMessages: ThreadMessage[] = [
  {
    id: 'm1', thread_id: 'th1',
    author: { id: 'u2', email: 'alice@co.com', first_name: 'Alice', last_name: 'Chen', full_name: 'Alice Chen', role: 'engineer', is_superadmin: false, is_email_verified: true, email_verified: true, created_at: '' },
    content: 'I can reproduce this in staging. The webhook fires before the DB commit because of async timing.',
    mentions: [], created_at: new Date(Date.now() - 18 * 60000).toISOString(), updated_at: '',
  },
  {
    id: 'm2', thread_id: 'th1',
    author: { id: 'u3', email: 'bob@co.com', first_name: 'Bob', last_name: 'Torres', full_name: 'Bob Torres', role: 'admin', is_superadmin: false, is_email_verified: true, email_verified: true, created_at: '' },
    content: "The AI fix looks right. I'll add a retry with backoff on the webhook handler side too. @Alice can you verify the fix in staging?",
    mentions: [], created_at: new Date(Date.now() - 10 * 60000).toISOString(), updated_at: '',
  },
]

const statusFlow: Array<Incident['status']> = ['open', 'investigating', 'resolved', 'closed']

// ── Component ─────────────────────────────────────────────────────────────────
export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  
  const incident = useAppSelector(s => s.incidents.selected)
  const loading = useAppSelector(s => s.incidents.isLoading)
  
  const [messages, setMessages] = useState<ThreadMessage[]>(mockMessages)
  const [message, setMessage]   = useState('')
  const [copied, setCopied]     = useState(false)
  const user = useAppSelector(s => s.auth.user)

  useEffect(() => {
    if (id) {
      dispatch(fetchIncidentThunk(id))
    }
  }, [id, dispatch])

  const handleCopy = () => {
    if (incident?.suggested_fix) {
      navigator.clipboard.writeText(incident.suggested_fix)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSend = () => {
    if (!message.trim() || !user) return
    const msg: ThreadMessage = {
      id: crypto.randomUUID(), thread_id: 'th1',
      author: user,
      content: message.trim(),
      mentions: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    setMessage('')
  }

  if (loading && !incident) return <DetailSkeleton />
  if (!incident) return <div className="text-white/40 text-sm p-6">Incident not found.</div>

  const severityVariant = { critical: 'critical', warning: 'warning', info: 'info' }[incident.severity] as 'critical' | 'warning' | 'info'
  const statusVariant   = { open: 'critical', investigating: 'warning', resolved: 'success', closed: 'neutral' }[incident.status] as 'critical' | 'warning' | 'success' | 'neutral'

  return (
    <div className="max-w-7xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40">
        <Link to="/dashboard/incidents" className="flex items-center gap-1 hover:text-white/70 transition-colors">
          <ArrowLeft size={13} /> Incidents
        </Link>
        <ChevronRight size={13} />
        <span className="text-white/70 truncate max-w-xs">{incident.error_type}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severityVariant} dot>{incident.severity}</Badge>
            <Badge variant={statusVariant}>{incident.status}</Badge>
            <span className="text-xs text-white/30">{incident.environment}</span>
          </div>
          <h1 className="text-xl font-bold text-white">{incident.error_type}</h1>
          <p className="text-sm text-white/40 font-mono">
            {incident.crash_file}:{incident.crash_line} · {incident.service_name}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/30">{formatRelative(incident.created_at)}</span>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {statusFlow.map((s, i) => {
          const currentIdx = statusFlow.indexOf(incident.status)
          const isDone    = i <= currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={s} className="flex items-center">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                isCurrent ? 'bg-neural-500/15 text-neural-400 ring-1 ring-neural-500/30' :
                isDone    ? 'text-white/50' : 'text-white/20'
              )}>
                {isDone && !isCurrent && <CheckCircle size={10} />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < statusFlow.length - 1 && (
                <div className={cn('h-px w-8', i < currentIdx ? 'bg-neural-500/30' : 'bg-white/8')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left col — analysis */}
        <div className="xl:col-span-2 space-y-4">

          {/* Root cause */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-neural-400" />
                  <CardTitle>AI Root Cause Analysis</CardTitle>
                  {incident.confidence_score && (
                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full bg-neural-500" style={{ width: `${incident.confidence_score * 100}%` }} />
                      </div>
                      <span className="text-xs text-neural-400 font-medium">{Math.round(incident.confidence_score * 100)}% confidence</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {incident.root_cause ? (
                  <p className="text-sm text-white/70 leading-relaxed">{incident.root_cause}</p>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <div className="h-2 w-2 rounded-full bg-neural-500 animate-pulse" />
                    Agent is analysing this incident…
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Suggested fix */}
          {incident.suggested_fix && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 size={14} className="text-amber-400" />
                      <CardTitle>Suggested Fix</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
                      <Copy size={12} />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-white/70 bg-surface-2 rounded-lg p-4 overflow-x-auto border border-white/8 font-mono leading-relaxed whitespace-pre-wrap">
                    {incident.suggested_fix}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Metadata */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader><CardTitle>Incident Details</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: 'Service',     value: incident.service_name },
                    { label: 'Environment', value: incident.environment },
                    { label: 'File',        value: `${incident.crash_file}:${incident.crash_line}` },
                    { label: 'Error Type',  value: incident.error_type },
                    { label: 'Created',     value: formatDate(incident.created_at) },
                    { label: 'Updated',     value: formatDate(incident.updated_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs text-white/30 mb-0.5">{label}</dt>
                      <dd className="text-xs text-white/70 font-mono truncate">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right col — thread */}
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="flex flex-col h-full min-h-[520px]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-white/50" />
                <CardTitle>Discussion Thread</CardTitle>
                <span className="ml-auto text-xs text-white/30">{messages.length} messages</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-0 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                {messages.map(msg => (
                  <div key={msg.id} className="flex gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-neural-500/20 border border-neural-500/20 flex items-center justify-center text-[10px] font-bold text-neural-400 shrink-0 mt-0.5">
                      {msg.author.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-white/80">{msg.author.full_name}</span>
                        <span className="text-[10px] text-white/30">{formatRelative(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="border-t border-white/8 pt-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Add a comment… (Enter to send)"
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-neural-500 resize-none transition-colors"
                    />
                    <button className="absolute right-2 bottom-2 text-white/20 hover:text-white/50 transition-colors">
                      <AtSign size={12} />
                    </button>
                  </div>
                  <Button size="icon" className="self-end h-8 w-8 shrink-0" onClick={handleSend} disabled={!message.trim()}>
                    <Send size={13} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl space-y-5">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    </div>
  )
}