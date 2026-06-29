import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, AlertTriangle, Clock, User, Code2,
  Sparkles, ChevronRight, CheckCircle,
  Copy, Terminal, MessageSquare, X, UserPlus, UserMinus,
  GitPullRequest, XCircle, ExternalLink
} from 'lucide-react'
import { Badge } from '@components/common/Badge'
import { Button } from '@components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Skeleton } from '@components/common/Skeleton'
import { Input } from '@components/common/Input'
import { formatDate, formatRelative, cn } from '@utils/cn'
import type { Incident } from '@/types'
import { useAppSelector, useAppDispatch } from '@store/index'
import { fetchIncidentThunk, updateIncidentThunk } from '@store/slices/incidentsSlice'
import { incidentsApi } from '@features/dashboard/api/incidentsApi'
import { collaborationApi } from '@features/dashboard/api/collaborationApi'
import { ThreadPanel } from '@features/collaboration/components/ThreadPanel'

const statusFlow: Array<Incident['status']> = ['open', 'investigating', 'resolved', 'closed']

import { ErrorBoundary } from '@/components/ErrorBoundary'

const getDisplayName = (u: any) => {
  if (u.full_name) return u.full_name.trim()
  if (u.first_name || u.last_name) return `${u.first_name || ''} ${u.last_name || ''}`.trim()
  return u.email
}

const getInitials = (u: any) => {
  const name = getDisplayName(u)
  if (name === u.email) return name.substring(0, 2).toUpperCase()
  const parts = name.split(' ')
  if (parts.length > 1) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()

  const incident = useAppSelector(s => s.incidents.selected)
  const loading = useAppSelector(s => s.incidents.isLoading)
  const user = useAppSelector(s => s.auth.user)
  const canEditStatus = ['admin', 'owner', 'engineer'].includes(user?.role?.toLowerCase() || '')

  const [copied, setCopied]     = useState(false)

  const [contextLogs, setContextLogs] = useState<string | null>(null)
  const [contextLoading, setContextLoading] = useState(false)

  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)
  
  const [popoverState, setPopoverState] = useState<{ status: Incident['status']; x: number; y: number } | null>(null)
  const [transitionNote, setTransitionNote] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const logsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logsContainerRef.current) {
      setTimeout(() => {
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
        }
      }, 50)
    }
  }, [contextLogs])

  useEffect(() => {
    if (id) {
      dispatch(fetchIncidentThunk(id))

      setContextLoading(true)
      incidentsApi.getContextLogs(id)
        .then(res => {
          const downloadUrl = res.data.data?.download_url
          if (downloadUrl) {
            return fetch(downloadUrl).then(r => r.text())
          }
          return null
        })
        .then(text => {
          if (text) setContextLogs(text)
        })
        .catch(err => console.error("Failed to load context logs", err))
        .finally(() => setContextLoading(false))
    }
  }, [id, dispatch])

  useEffect(() => {
    collaborationApi.fetchTeamMembers()
      .then(res => setTeamMembers(res.data.data || []))
      .catch(err => console.error("Failed to load team members", err))
  }, [])

  useEffect(() => {
    if (id) {
      collaborationApi.fetchStatusHistory(id)
        .then(res => setStatusHistory(res.data.data || []))
        .catch(err => console.error("Failed to load status history", err))
    }
  }, [id, incident?.status])

  const handleCopy = () => {
    if (incident?.suggested_fix) {
      navigator.clipboard.writeText(incident.suggested_fix)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStatusClick = (e: React.MouseEvent, clickedStatus: Incident['status']) => {
    if (!canEditStatus || !incident) return
    if (clickedStatus === incident.status) return
    
    // Prevent invalid transitions
    if (incident.status === 'draft') return
    if (incident.status === clickedStatus) return
    
    const isAllowed = (() => {
      if (incident.status === 'open') return clickedStatus === 'investigating';
      if (incident.status === 'investigating') return clickedStatus === 'resolved';
      if (incident.status === 'resolved') return clickedStatus === 'closed';
      if (incident.status === 'closed') return true;
      return false;
    })();
    
    if (!isAllowed) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const popoverWidth = 288 // w-72 = 288px
    let x = rect.left
    
    if (x + popoverWidth > window.innerWidth - 16) {
      x = rect.right - popoverWidth
    }

    setPopoverState({
      status: clickedStatus,
      x: x,
      y: rect.bottom + 8
    })
    setTransitionNote('')
  }

  const confirmStatusTransition = async () => {
    if (!popoverState || !incident || !id || !user) return
    setIsUpdatingStatus(true)
    try {
      await dispatch(updateIncidentThunk({
        id,
        status: popoverState.status,
        actor_id: user.id,
        note: transitionNote.trim() || undefined
      })).unwrap()
      setPopoverState(null)
    } catch (err) {
      console.error("Status transition failed:", err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleAssigneeSelect = async (userId: string) => {
    if (!incident || !id || !user) return
    
    let newAssignees = [...(incident.assigned_user_ids || [])];
    
    if (userId === 'unassigned') {
      newAssignees = [];
    } else if (userId === 'unassign_me') {
      if (newAssignees.length <= 1) {
        alert("You cannot unassign yourself unless there is at least one other assigned engineer.");
        return;
      }
      newAssignees = newAssignees.filter(u => u !== user.id);
    } else {
      if (newAssignees.includes(userId)) {
        if (userId === user.id && newAssignees.length <= 1) {
           alert("You cannot unassign yourself unless there is at least one other assigned engineer.");
           return;
        }
        newAssignees = newAssignees.filter(u => u !== userId);
      } else {
        newAssignees.push(userId);
      }
    }

    setIsUpdatingStatus(true)
    try {
      await dispatch(updateIncidentThunk({
        id,
        assigned_user_ids: newAssignees,
        actor_id: user.id
      })).unwrap()
    } catch (err) {
      console.error("Failed to assign user", err)
    } finally {
      setIsUpdatingStatus(false)
      // Keep dropdown open for multiple selections
    }
  }

  const assignedUsers = teamMembers.filter(m => incident?.assigned_user_ids?.includes(m.id))

  if (loading && !incident) return <DetailSkeleton />
  if (!incident) return <div className="text-slate-500 text-sm p-6">Incident not found.</div>

  const severityVariant = { critical: 'critical', high: 'warning', medium: 'warning', low: 'info' }[incident.severity] as 'critical' | 'warning' | 'info' | 'neutral'
  const statusVariant   = { open: 'critical', investigating: 'warning', resolved: 'success', closed: 'neutral', draft: 'neutral', duplicate: 'neutral' }[incident.status] as 'critical' | 'warning' | 'success' | 'neutral'

  return (
    <ErrorBoundary>
    <div className="max-w-7xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/dashboard/incidents" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={13} /> Incidents
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-700 truncate max-w-xs">{incident.error_type}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severityVariant} dot>{incident.severity}</Badge>
            <Badge variant={statusVariant}>{incident.status}</Badge>
            <span className="text-xs text-slate-500">{incident.environment}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{incident.error_type}</h1>
          <p className="text-sm text-slate-500 font-mono">
            {incident.crash_file}:{incident.crash_line} · {incident.service_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-4">

            <span className="text-xs text-slate-500">{formatRelative(incident.created_at)}</span>
          </div>
          
          {/* Explicit Primary Action Buttons */}
          <div className="flex items-center gap-2 mt-1">
            {canEditStatus && incident.status === 'open' && (
              <Button size="sm" onClick={(e) => handleStatusClick(e, 'investigating')}>
                Acknowledge
              </Button>
            )}
            {canEditStatus && incident.status === 'investigating' && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent gap-1.5" onClick={(e) => handleStatusClick(e, 'resolved')}>
                <CheckCircle size={14} /> Mark Resolved
              </Button>
            )}
            {canEditStatus && incident.status === 'resolved' && (
              <Button size="sm" variant="outline" onClick={(e) => handleStatusClick(e, 'closed')}>
                Close Incident
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Responders Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mt-2 mb-2">
        <div className="flex flex-col gap-0.5 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responders</span>
          <span className="text-2xl font-light text-slate-800 leading-none">{assignedUsers.length}</span>
        </div>
        
        <div className="flex-1 flex flex-wrap items-center gap-2 border-l border-slate-100 pl-4 md:pl-6">
          {assignedUsers.length === 0 ? (
            <span className="text-sm text-slate-500 italic">
              No one is currently investigating this incident.
            </span>
          ) : (
            assignedUsers.map(u => {
              const isMe = u.id === user?.id;
              return (
                <div key={u.id} className={cn("flex items-center gap-2 border rounded-full pl-1.5 pr-3 py-1.5 shadow-sm transition-colors", isMe ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200 hover:bg-slate-50")}>
                  <div className={cn("h-6 w-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm", isMe ? "bg-indigo-600" : "bg-slate-700")}>
                    {getInitials(u)}
                  </div>
                  <span className={cn("text-sm font-medium", isMe ? "text-indigo-900" : "text-slate-700")}>{getDisplayName(u)}</span>
                  {isMe && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 font-semibold">(You)</span>}
                </div>
              );
            })
          )}
        </div>

        {canEditStatus && (
          <div className="relative shrink-0 ml-auto pl-4">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("gap-2 shadow-sm transition-colors", assignedUsers.length === 0 ? "border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100" : "border-slate-200 hover:bg-slate-50")}
              onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
            >
              <UserPlus size={15} /> 
              {assignedUsers.length === 0 ? "Assign Someone" : "Manage Responders"}
            </Button>
            
            {assigneeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAssigneeDropdownOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-[32rem] overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 origin-top-right flex flex-col">
                  
                  {/* Quick Action */}
                  <div className="px-3 pb-3 pt-1 border-b border-slate-100">
                    {!(incident.assigned_user_ids?.includes(user?.id || '')) ? (
                      <button 
                        onClick={() => handleAssigneeSelect(user!.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg text-sm font-medium transition-colors border border-indigo-100 shadow-sm"
                      >
                        <UserPlus size={16} />
                        Assign to Me
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAssigneeSelect('unassign_me')}
                        disabled={assignedUsers.length <= 1}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-60 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors border border-red-100 shadow-sm"
                        title={assignedUsers.length <= 1 ? "You cannot unassign yourself unless someone else is assigned." : ""}
                      >
                        <UserMinus size={16} />
                        Unassign Me
                      </button>
                    )}
                  </div>

                  {/* Team List */}
                  <div className="flex-1 overflow-y-auto pt-2 pb-1">
                    <div className="px-4 pb-1 mb-1">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Members</h3>
                    </div>
                    
                    <div className="space-y-0.5 px-1">
                      {teamMembers.map(m => {
                        const isSelected = incident.assigned_user_ids?.includes(m.id)
                        const isMe = m.id === user?.id
                        const isLastAssignee = isMe && isSelected && assignedUsers.length <= 1
                        const isOtherAssigned = !isMe && isSelected
                        const isDisabled = isLastAssignee || isOtherAssigned
                        
                        return (
                          <button 
                            key={m.id} 
                            onClick={() => isMe && isSelected ? handleAssigneeSelect('unassign_me') : handleAssigneeSelect(m.id)} 
                            disabled={isDisabled}
                            title={isOtherAssigned ? "You cannot unassign other responders." : isLastAssignee ? "You cannot unassign yourself unless someone else is assigned." : ""}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors rounded-md group",
                              isDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50 text-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-sm", 
                                isSelected ? "bg-indigo-600 text-white ring-2 ring-indigo-100" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-700"
                              )}>
                                {getInitials(m)}
                              </div>
                              <div className="flex flex-col truncate">
                                <span className={cn(
                                  "truncate transition-colors text-[13px]", 
                                  isSelected ? "font-semibold text-indigo-900" : "font-medium group-hover:text-indigo-700"
                                )}>
                                  {getDisplayName(m)} {isMe && <span className="text-xs text-slate-400 font-normal ml-1">(You)</span>}
                                </span>
                              </div>
                            </div>
                            <div className="w-6 flex justify-end shrink-0">
                              {isSelected && <CheckCircle size={18} className="text-indigo-600" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress steps */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-4 shadow-sm ring-1 ring-primary/10 w-full mb-6">
        {canEditStatus && (
          <div className="flex items-center gap-1.5 border-r border-primary/20 pr-4 shrink-0">
            <span className="text-xs text-primary font-semibold tracking-wide uppercase">Update Status:</span>
          </div>
        )}
        <div className="flex items-center w-full">
          {statusFlow.map((s, i) => {
            const currentIdx = statusFlow.indexOf(incident.status)
            const isDone    = i <= currentIdx
            const isCurrent = i === currentIdx
            const isValidTarget = (() => {
              if (!canEditStatus || incident.status === 'draft') return false;
              if (incident.status === s) return false;
              if (incident.status === 'open') return s === 'investigating';
              if (incident.status === 'investigating') return s === 'resolved';
              if (incident.status === 'resolved') return s === 'closed';
              if (incident.status === 'closed') return true;
              return false;
            })();
            return (
              <div key={s} className={cn("flex items-center", i < statusFlow.length - 1 ? "flex-1" : "shrink-0")}>
                <div 
                  onClick={(e) => handleStatusClick(e, s)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none relative group shrink-0 min-w-[100px]',
                    isValidTarget && !isCurrent ? 'cursor-pointer border border-dashed border-slate-300 bg-white hover:border-primary/50 hover:bg-primary/10 hover:text-primary text-slate-500 shadow-sm' : 'border border-transparent',
                    isCurrent ? 'bg-primary text-white shadow-md cursor-default ring-2 ring-primary/30 ring-offset-2' :
                    isDone && !isCurrent ? 'text-slate-600 bg-white shadow-sm' : (!isValidTarget && !isCurrent ? 'text-slate-400 opacity-70' : '')
                  )}
                >
                  {isDone && !isCurrent && <CheckCircle size={14} />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  
                  {/* UX Tooltip */}
                  {isValidTarget && !isCurrent && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm z-10">
                      Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  )}
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={cn('h-px flex-1 mx-3', i < currentIdx ? 'bg-primary' : 'bg-slate-300')} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {popoverState && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopoverState(null)} />
          <div 
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 animate-in fade-in slide-in-from-top-2"
            style={{ top: popoverState.y, left: popoverState.x }}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Move to {popoverState.status.charAt(0).toUpperCase() + popoverState.status.slice(1)}
              </h4>
              <button onClick={() => setPopoverState(null)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
            
            {incident.status === 'resolved' && popoverState.status === 'investigating' && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-3 border border-amber-100">
                A note is required to re-open a resolved incident.
              </div>
            )}
            
            <div className="space-y-3">
              <Input
                placeholder="Add an optional note..."
                value={transitionNote}
                onChange={e => setTransitionNote(e.target.value)}
                autoFocus
                className="text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPopoverState(null)}>Cancel</Button>
                <Button 
                  size="sm" 
                  onClick={confirmStatusTransition}
                  disabled={isUpdatingStatus || (incident.status === 'resolved' && popoverState.status === 'investigating' && !transitionNote.trim())}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left col — analysis */}
        <div className="xl:col-span-2 space-y-4">

          {/* Pull Request Status Banner */}
          {(incident.pr_status || incident.pr_url) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
              {incident.pr_status === 'open' || incident.pr_status === 'merged' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0">
                      <GitPullRequest size={20} />
                    </div>
                    <div>
                      <h3 className="text-emerald-800 font-semibold text-sm">Automated Pull Request Created</h3>
                      <p className="text-emerald-600/90 text-xs mt-0.5 max-w-xl">
                        {incident.pr_title || `A patch has been generated and a PR (#${incident.pr_number}) was opened successfully.`}
                      </p>
                    </div>
                  </div>
                  {incident.pr_url && (
                    <a 
                      href={incident.pr_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      View Pull Request <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : incident.pr_status ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <div className="bg-rose-100 p-2 rounded-lg text-rose-600 shrink-0">
                      <XCircle size={20} />
                    </div>
                    <div>
                      <h3 className="text-rose-800 font-semibold text-sm">Automated Patch Failed</h3>
                      <p className="text-rose-600/90 text-xs mt-0.5 max-w-xl">
                        {incident.pr_error || "NeuralOps agent encountered an issue while generating or creating the pull request."}
                      </p>
                    </div>
                  </div>
                  <Badge variant="critical" className="bg-white">Status: {incident.pr_status}</Badge>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Root cause */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  <CardTitle>AI Root Cause Analysis</CardTitle>
                  {incident.confidence_score !== undefined && incident.confidence_score !== null && (
                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${incident.confidence_score * 100}%` }} />
                      </div>
                      <span className="text-xs text-primary font-medium">{Math.round(incident.confidence_score * 100)}% confidence</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {incident.root_cause ? (
                  <p className="text-sm text-slate-700 leading-relaxed">{incident.root_cause}</p>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
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
                  <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-4 overflow-x-auto border border-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                    {incident.suggested_fix}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Context Logs Viewer */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-blue-500" />
                  <CardTitle>Context Logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {contextLoading ? (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Loading context logs…
                  </div>
                ) : contextLogs ? (
                  <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                    <div ref={logsContainerRef} className="p-4 text-[13px] font-mono text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed tracking-wide">
                      {(() => {
                        try {
                          const logs = JSON.parse(contextLogs)
                          if (!Array.isArray(logs)) throw new Error('Not an array')
                          
                          return logs.map((log: any, idx: number) => {
                            const lvl = (log.level || '').toLowerCase()
                            const isError = lvl === 'error' || lvl === 'fatal' || lvl === 'critical'
                            const isWarn = lvl === 'warn' || lvl === 'warning'
                            const levelColor = isError ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-blue-400'
                            
                            const d = new Date(log.timestamp)
                            const dateStr = !isNaN(d.getTime()) 
                                ? d.toISOString().replace('T', ' ').substring(0, 23).replace('.', ',')
                                : log.timestamp
                            
                            let trace = '';
                            if (log.stack_trace) {
                               if (Array.isArray(log.stack_trace)) {
                                 const isPy = log.stack_trace[0]?.file?.endsWith('.py');
                                 const lines = log.stack_trace.map((f: any) => {
                                   if (isPy) return `  File "${f.file}", line ${f.line}, in ${f.method || '?'}`;
                                   return `  at ${f.module && f.module !== '?' ? f.module + '.' : ''}${f.method || '?'} (${f.file || '?'}:${f.line || '?'})`;
                                 });
                                 if (isPy) lines.unshift('Traceback (most recent call last):');
                                 trace = '\n' + lines.join('\n');
                               } else if (typeof log.stack_trace === 'string') {
                                 trace = '\n' + log.stack_trace;
                               } else {
                                 trace = '\n' + JSON.stringify(log.stack_trace, null, 2);
                               }
                            }
                            
                            return (
                              <div key={idx} className="hover:bg-white/5 px-2 py-0.5 -mx-2 rounded">
                                <span className={`font-semibold ${levelColor}`}>[{log.level.toUpperCase()}]</span>
                                <span className="text-slate-500 ml-2">{dateStr}</span>
                                <span className={`ml-2 ${isError ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-200'}`}>{log.message}</span>
                                {trace && <div className="text-slate-400 mt-0.5">{trace}</div>}
                              </div>
                            )
                          })
                        } catch (e) {
                          return contextLogs
                        }
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No context logs available.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

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
                      <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
                      <dd className="text-xs text-slate-700 font-mono truncate">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <CardTitle>Status History</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map(transition => (
                      <div key={transition.id} className="flex gap-3 text-sm">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white font-medium text-xs mt-1"
                          style={{ backgroundColor: transition.actor?.avatar_colour || '#94A3B8' }}
                        >
                          {transition.actor ? transition.actor.full_name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-700">
                              {transition.actor?.full_name || 'System'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatRelative(transition.created_at)}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            Moved from <span className="font-medium text-slate-800">{transition.from_status}</span> to <span className="font-medium text-slate-800">{transition.to_status}</span>
                          </div>
                          {transition.note && (
                            <div className="mt-2 text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                              "{transition.note}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right col — live discussion thread */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-120px)] min-h-[520px] sticky top-6">
            {incident?.id && <ThreadPanel incidentId={incident.id} />}
          </div>
        </motion.div>
      </div>
    </div>
    </ErrorBoundary>
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