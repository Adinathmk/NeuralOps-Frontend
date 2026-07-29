import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Users,
  Loader2,
  Bell,
  Activity,
  AlertTriangle,
  Zap,
  MessageSquare,
  Mail,
  Smartphone,
  PhoneCall,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  Card,
  CardContent,
} from '@components/common/Card'

import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Badge } from '@components/common/Badge'
import { Modal } from '@components/common/Modal'
import { Skeleton } from '@components/common/Skeleton'

import { useToast } from '@hooks/useProtectedRoute'
import { cn } from '@utils/cn'

import { useAppDispatch, useAppSelector } from '@store/index'
import {
  fetchAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from '@store/slices/alertRulesSlice'

import type {
  AlertRule,
  IncidentSeverity,
  User
} from '@/types'
import { teamApi } from '@features/team/api/teamApi'

const ruleSchema = z.object({
  confidence_threshold: z
    .number()
    .min(0, 'Minimum is 0')
    .max(1, 'Maximum is 1'),
})

export type RuleForm = z.infer<typeof ruleSchema>

export interface TabHandle { openCreate: () => void }

const AlertRulesTab = forwardRef<TabHandle>((props, ref) => {
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  const { items: rules, isLoading } = useAppSelector(s => s.alertRules)

  const [modalOpen, setModalOpen] = useState(false)
  const [editRule, setEditRule] = useState<AlertRule | null>(null)
  const [severities, setSeverities] = useState<IncidentSeverity[]>(['critical'])
  const [submitting, setSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [destinations, setDestinations] = useState<Record<string, any>[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      confidence_threshold: 0.8,
    },
  })

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAlertRules())
    teamApi.listMembers().then(res => {
      if (res.success && res.data) {
        setTeamMembers(res.data)
      }
    }).catch(err => console.error("Failed to load team members", err))
  }, [dispatch])

  // ── Modal openers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditRule(null)
    setSeverities(['critical'])
    setDestinations([])
    reset({ confidence_threshold: 0.8 })
    setModalOpen(true)
  }
  useImperativeHandle(ref, () => ({ openCreate }))

  const openEdit = (rule: AlertRule) => {
    setEditRule(rule)
    setSeverities(rule.severity_filter)
    setDestinations(rule.destinations || [])
    setValue('confidence_threshold', rule.confidence_threshold)
    setModalOpen(true)
  }

  // ── Form submit ─────────────────────────────────────────────────────────────
  const onSubmit = async (data: RuleForm) => {
    const validDestinations = destinations.filter(d => {
      if (d.type === 'in_app') return !!d.user_id
      if (d.type === 'email') return !!d.address
      if (d.type === 'pagerduty') return !!d.integration_key
      if (d.type === 'slack') return !!d.webhook_url
      return false
    })

    if (validDestinations.length === 0) {
      toast({ type: 'error', title: 'At least one valid destination is required' })
      return
    }

    setSubmitting(true)

    try {
      if (editRule) {
        await dispatch(updateAlertRule({
          id: editRule.id,
          confidence_threshold: data.confidence_threshold,
          severity_filter: severities,
          destinations: validDestinations as any,
        })).unwrap()

        toast({ type: 'success', title: 'Rule updated' })
      } else {
        await dispatch(createAlertRule({
          confidence_threshold: data.confidence_threshold,
          severity_filter: severities,
          destinations: validDestinations as any,
          enabled: true,
        })).unwrap()

        toast({ type: 'success', title: 'Rule created' })
      }

      setModalOpen(false)
      reset()
    } catch (err) {
      toast({ type: 'error', title: (err as string) || 'Something went wrong' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Toggle enabled ──────────────────────────────────────────────────────────
  const toggleRule = async (rule: AlertRule) => {
    try {
      await dispatch(updateAlertRule({
        id: rule.id,
        enabled: !rule.enabled,
      })).unwrap()
    } catch (err) {
      toast({ type: 'error', title: (err as string) || 'Failed to toggle rule' })
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteAlertRule(id)).unwrap()
      toast({ type: 'success', title: 'Rule deleted' })
    } catch (err) {
      toast({ type: 'error', title: (err as string) || 'Failed to delete rule' })
    }
  }

  // ── Severity toggle ─────────────────────────────────────────────────────────
  const toggleSeverity = (s: IncidentSeverity) => {
    setSeverities(prev =>
      prev.includes(s)
        ? prev.filter(x => x !== s)
        : [...prev, s]
    )
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading && rules.length === 0) {
    return (
      <div className="w-full space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5">
      {/* Empty state */}
      {rules.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield size={32} className="mx-auto text-slate-900/15 mb-3" />
            <p className="text-sm text-slate-500">No alert rules configured yet.</p>
            <p className="text-xs text-slate-400 mt-1">Create your first rule to get notified about incidents.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card
              className={cn(
                !rule.enabled && 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                      rule.enabled
                        ? 'bg-primary/10'
                        : 'bg-white/5'
                    )}
                  >
                    <Shield
                      size={15}
                      className={
                        rule.enabled
                          ? 'text-primary'
                          : 'text-slate-500'
                      }
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {rule.severity_filter.join(', ')} alerts
                      </p>

                      {!rule.enabled && (
                        <Badge variant="neutral">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                      <span>
                        Confidence ≥{' '}
                        {Math.round(
                          rule.confidence_threshold *
                            100
                        )}
                        %
                      </span>

                      <span className="flex items-center gap-1">
                        {rule.severity_filter.map(s => (
                          <Badge
                            key={s}
                            variant={
                              (s === 'critical' ? 'critical' :
                               ['high', 'medium'].includes(s) ? 'warning' :
                               'info') as 'critical' | 'warning' | 'info'
                            }
                            dot
                          >
                            {s}
                          </Badge>
                        ))}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Users
                        size={11}
                        className="text-slate-400"
                      />

                      <p className="text-xs text-slate-900/35 truncate">
                        {(rule.destinations || []).length} destination(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        toggleRule(rule)
                      }
                      className="text-slate-500 hover:text-slate-700 transition-colors p-1.5"
                    >
                      {rule.enabled ? (
                        <ToggleRight
                          size={18}
                          className="text-primary"
                        />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-500 hover:text-slate-700"
                      onClick={() =>
                        openEdit(rule)
                      }
                    >
                      <Edit2 size={12} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400/50 hover:text-red-400"
                      onClick={() =>
                        handleDelete(rule.id)
                      }
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          reset()
        }}
        title={editRule ? 'Edit alert rule' : 'Create alert rule'}
        description="Configure conditions and actions for automated incident alerts."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
          {/* SECTION 1: Conditions */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Trigger Conditions
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(['critical', 'high', 'medium', 'low'] as IncidentSeverity[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSeverity(s)}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 group',
                      severities.includes(s)
                        ? s === 'critical'
                          ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20'
                          : ['high', 'medium'].includes(s)
                          ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20'
                          : 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                        : 'bg-background border-border hover:border-border/80 hover:bg-muted/50'
                    )}
                  >
                    {s === 'critical' && <AlertTriangle size={20} className={cn("mb-1.5", severities.includes(s) ? "text-red-500" : "text-muted-foreground/70")} />}
                    {s === 'high' && <AlertTriangle size={20} className={cn("mb-1.5", severities.includes(s) ? "text-orange-500" : "text-muted-foreground/70")} />}
                    {s === 'medium' && <Bell size={20} className={cn("mb-1.5", severities.includes(s) ? "text-orange-500" : "text-muted-foreground/70")} />}
                    {s === 'low' && <Bell size={20} className={cn("mb-1.5", severities.includes(s) ? "text-blue-500" : "text-muted-foreground/70")} />}
                    
                    <span className={cn(
                      "text-xs font-semibold",
                      severities.includes(s) 
                        ? s === 'critical' ? 'text-red-500' : ['high','medium'].includes(s) ? 'text-orange-500' : 'text-blue-500'
                        : 'text-muted-foreground'
                    )}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Confidence Threshold
                </label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                  {Math.round((watch('confidence_threshold') || 0) * 100)}%
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3">Only trigger this alert if the AI analysis confidence score is above this value.</p>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                {...register('confidence_threshold', { valueAsNumber: true })}
              />
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground mt-2">
                <span>0% (All errors)</span>
                <span>100% (High Certainty)</span>
              </div>
              {errors.confidence_threshold?.message && (
                <p className="text-xs text-destructive mt-1">{errors.confidence_threshold.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 2: Destinations */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border pb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap size={16} className="text-orange-500" />
                Notification Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button" variant="outline" size="sm" className="h-8 text-xs bg-background hover:bg-muted shadow-sm border-border" 
                  onClick={() => setDestinations([...destinations, { type: 'in_app', user_id: '' }])}
                >
                  <Plus size={14} className="mr-1 text-primary" /> In-App
                </Button>
                <Button 
                  type="button" variant="outline" size="sm" className="h-8 text-xs bg-background hover:bg-muted shadow-sm border-border" 
                  onClick={() => setDestinations([...destinations, { type: 'email', address: '' }])}
                >
                  <Plus size={14} className="mr-1 text-blue-500" /> Email
                </Button>
                <Button 
                  type="button" variant="outline" size="sm" className="h-8 text-xs bg-background hover:bg-muted shadow-sm border-border" 
                  onClick={() => setDestinations([...destinations, { type: 'pagerduty', integration_key: '' }])}
                >
                  <Plus size={14} className="mr-1 text-emerald-500" /> PagerDuty
                </Button>
                <Button 
                  type="button" variant="outline" size="sm" className="h-8 text-xs bg-background hover:bg-muted shadow-sm border-border" 
                  onClick={() => setDestinations([...destinations, { type: 'slack', webhook_url: '' }])}
                >
                  <Plus size={14} className="mr-1 text-pink-500" /> Slack
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {destinations.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-border rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">No actions configured yet. Click above to add one.</p>
                </div>
              )}
              
              {destinations.map((dest, idx) => (
                <div key={idx} className="flex gap-3 items-center p-3 border border-border rounded-lg bg-background shadow-sm group hover:border-primary/40 transition-colors">
                  
                  <div className="w-32 shrink-0 flex items-center gap-2 pl-1">
                    {dest.type === 'in_app' && <><Smartphone size={16} className="text-primary" /><span className="text-sm font-medium text-foreground">In-App</span></>}
                    {dest.type === 'email' && <><Mail size={16} className="text-blue-500" /><span className="text-sm font-medium text-foreground">Email</span></>}
                    {dest.type === 'pagerduty' && <><PhoneCall size={16} className="text-emerald-500" /><span className="text-sm font-medium text-foreground">PagerDuty</span></>}
                    {dest.type === 'slack' && <><MessageSquare size={16} className="text-pink-500" /><span className="text-sm font-medium text-foreground">Slack</span></>}
                  </div>

                  <div className="flex-1 min-w-0">
                    {dest.type === 'in_app' && (
                      <select
                        value={dest.user_id || ''}
                        onChange={(e) => {
                          const newDests = [...destinations]
                          newDests[idx].user_id = e.target.value
                          setDestinations(newDests)
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select Team Member...</option>
                        {teamMembers.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                        ))}
                      </select>
                    )}

                    {dest.type === 'email' && (
                      <input 
                        type="email"
                        placeholder="engineer@example.com" 
                        value={dest.address || ''} 
                        onChange={e => {
                          const newDests = [...destinations]
                          newDests[idx].address = e.target.value
                          setDestinations(newDests)
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
                      />
                    )}

                    {dest.type === 'pagerduty' && (
                      <input 
                        type="text"
                        placeholder="Integration Key (e.g. 46558a5d...)" 
                        value={dest.integration_key || ''} 
                        onChange={e => {
                          const newDests = [...destinations]
                          newDests[idx].integration_key = e.target.value
                          setDestinations(newDests)
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
                      />
                    )}

                    {dest.type === 'slack' && (
                      <input 
                        type="text"
                        placeholder="Webhook URL (e.g. https://hooks.slack.com/...)" 
                        value={dest.webhook_url || ''} 
                        onChange={e => {
                          const newDests = [...destinations]
                          newDests[idx].webhook_url = e.target.value
                          setDestinations(newDests)
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
                      />
                    )}
                  </div>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" 
                    onClick={() => {
                      setDestinations(destinations.filter((_, i) => i !== idx))
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 font-medium bg-background hover:bg-muted border-border text-foreground"
              onClick={() => {
                setModalOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 font-medium shadow-md shadow-primary/20"
              isLoading={submitting}
            >
              {editRule ? 'Save Changes' : 'Create Alert Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
})

export default AlertRulesTab
