import { useEffect, useState } from 'react'
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
} from '@/types'

const ruleSchema = z.object({
  confidence_threshold: z
    .number()
    .min(0, 'Minimum is 0')
    .max(1, 'Maximum is 1'),

  recipients_raw: z.string().min(
    1,
    'At least one recipient ID'
  ),
})

type RuleForm = z.infer<typeof ruleSchema>

export default function AlertRulesTab() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  const { items: rules, isLoading } = useAppSelector(s => s.alertRules)

  const [modalOpen, setModalOpen] = useState(false)
  const [editRule, setEditRule] = useState<AlertRule | null>(null)
  const [severities, setSeverities] = useState<IncidentSeverity[]>(['critical'])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      confidence_threshold: 0.8,
      recipients_raw: '',
    },
  })

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAlertRules())
  }, [dispatch])

  // ── Modal openers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditRule(null)
    setSeverities(['critical'])
    reset({
      confidence_threshold: 0.8,
      recipients_raw: '',
    })
    setModalOpen(true)
  }

  const openEdit = (rule: AlertRule) => {
    setEditRule(rule)
    setSeverities(rule.severity_filter)
    setValue('confidence_threshold', rule.confidence_threshold)
    setValue('recipients_raw', rule.recipient_ids.join(', '))
    setModalOpen(true)
  }

  // ── Form submit ─────────────────────────────────────────────────────────────
  const onSubmit = async (data: RuleForm) => {
    const recipient_ids = data.recipients_raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    setSubmitting(true)

    try {
      if (editRule) {
        await dispatch(updateAlertRule({
          id: editRule.id,
          confidence_threshold: data.confidence_threshold,
          severity_filter: severities,
          recipient_ids,
        })).unwrap()

        toast({ type: 'success', title: 'Rule updated' })
      } else {
        await dispatch(createAlertRule({
          confidence_threshold: data.confidence_threshold,
          severity_filter: severities,
          recipient_ids,
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
      <div className="max-w-3xl space-y-5">
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
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-end">        <Button
          size="sm"
          className="gap-2"
          onClick={openCreate}
        >
          <Plus size={13} />
          New rule
        </Button>
      </div>

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
                              s as
                                | 'critical'
                                | 'warning'
                                | 'info'
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
                        {rule.recipient_ids.length} recipient(s)
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
        title={
          editRule
            ? 'Edit alert rule'
            : 'Create alert rule'
        }
        size="md"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mt-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Severity Filter
            </label>

            <div className="flex gap-2">
              {(
                [
                  'critical',
                  'warning',
                  'info',
                ] as IncidentSeverity[]
              ).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    toggleSeverity(s)
                  }
                  className={cn(
                    'flex-1 py-1.5 rounded-md text-xs font-medium border transition-all',

                    severities.includes(s)
                      ? s === 'critical'
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : s === 'warning'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                      : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-200'
                  )}
                >
                  {s.charAt(0).toUpperCase() +
                    s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Confidence Threshold (0–1)"
            type="number"
            step="0.05"
            min="0"
            max="1"
            placeholder="0.80"
            hint="Only notify when AI confidence exceeds this value"
            error={
              errors.confidence_threshold
                ?.message
            }
            {...register(
              'confidence_threshold',
              {
                valueAsNumber: true,
              }
            )}
          />

          <Input
            label="Recipient IDs"
            placeholder="uuid-1, uuid-2"
            hint="Comma-separated user UUIDs"
            error={
              errors.recipients_raw?.message
            }
            {...register('recipients_raw')}
          />

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1"
              isLoading={submitting}
            >
              {editRule
                ? 'Save changes'
                : 'Create rule'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setModalOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
