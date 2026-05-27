import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Users,
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

import { useToast } from '@hooks/useProtectedRoute'
import { cn } from '@utils/cn'

import type {
  AlertRule,
  IncidentSeverity,
} from '@/types'

const MOCK_RULES: AlertRule[] = [
  {
    id: '1',
    tenant_id: 't1',
    name: 'Critical Incidents',
    confidence_threshold: 0.85,
    severity_filter: ['critical'],
    recipients: ['team@co.com', 'oncall@co.com'],
    is_enabled: true,
    created_at: '',
  },
  {
    id: '2',
    tenant_id: 't1',
    name: 'All High Severity',
    confidence_threshold: 0.75,
    severity_filter: ['critical', 'warning'],
    recipients: ['eng@co.com'],
    is_enabled: true,
    created_at: '',
  },
  {
    id: '3',
    tenant_id: 't1',
    name: 'Low Confidence Draft',
    confidence_threshold: 0.5,
    severity_filter: ['info'],
    recipients: ['alice@co.com'],
    is_enabled: false,
    created_at: '',
  },
]

const ruleSchema = z.object({
  name: z.string().min(2, 'Name required'),

  confidence_threshold: z
    .number()
    .min(0, 'Minimum is 0')
    .max(1, 'Maximum is 1'),

  recipients_raw: z.string().min(
    1,
    'At least one recipient email'
  ),
})

type RuleForm = z.infer<typeof ruleSchema>

export default function AlertRulesPage() {
  const { toast } = useToast()

  const [rules, setRules] =
    useState<AlertRule[]>(MOCK_RULES)

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editRule, setEditRule] =
    useState<AlertRule | null>(null)

  const [severities, setSeverities] =
    useState<IncidentSeverity[]>(['critical'])

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
      name: '',
      recipients_raw: '',
    },
  })

  const openCreate = () => {
    setEditRule(null)

    setSeverities(['critical'])

    reset({
      confidence_threshold: 0.8,
      name: '',
      recipients_raw: '',
    })

    setModalOpen(true)
  }

  const openEdit = (rule: AlertRule) => {
    setEditRule(rule)

    setSeverities(rule.severity_filter)

    setValue('name', rule.name)

    setValue(
      'confidence_threshold',
      rule.confidence_threshold
    )

    setValue(
      'recipients_raw',
      rule.recipients.join(', ')
    )

    setModalOpen(true)
  }

  const onSubmit = (data: RuleForm) => {
    const recipients = data.recipients_raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (editRule) {
      setRules(prev =>
        prev.map(r =>
          r.id === editRule.id
            ? {
                ...r,
                ...data,
                severity_filter: severities,
                recipients,
              }
            : r
        )
      )

      toast({
        type: 'success',
        title: 'Rule updated',
      })
    } else {
      const newRule: AlertRule = {
        id: crypto.randomUUID(),
        tenant_id: 't1',
        name: data.name,
        confidence_threshold:
          data.confidence_threshold,
        severity_filter: severities,
        recipients,
        is_enabled: true,
        created_at: new Date().toISOString(),
      }

      setRules(prev => [newRule, ...prev])

      toast({
        type: 'success',
        title: 'Rule created',
      })
    }

    setModalOpen(false)

    reset()
  }

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              is_enabled: !r.is_enabled,
            }
          : r
      )
    )
  }

  const deleteRule = (id: string) => {
    setRules(prev =>
      prev.filter(r => r.id !== id)
    )

    toast({
      type: 'success',
      title: 'Rule deleted',
    })
  }

  const toggleSeverity = (
    s: IncidentSeverity
  ) => {
    setSeverities(prev =>
      prev.includes(s)
        ? prev.filter(x => x !== s)
        : [...prev, s]
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Alert Rules
          </h1>

          <p className="text-sm text-white/40 mt-0.5">
            Control when and who gets notified
            about incidents.
          </p>
        </div>

        <Button
          size="sm"
          className="gap-2"
          onClick={openCreate}
        >
          <Plus size={13} />
          New rule
        </Button>
      </div>

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
                !rule.is_enabled && 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                      rule.is_enabled
                        ? 'bg-neural-500/10'
                        : 'bg-white/5'
                    )}
                  >
                    <Shield
                      size={15}
                      className={
                        rule.is_enabled
                          ? 'text-neural-400'
                          : 'text-white/30'
                      }
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white/90">
                        {rule.name}
                      </p>

                      {!rule.is_enabled && (
                        <Badge variant="neutral">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-xs text-white/40">
                      <span>
                        Confidence â‰¥{' '}
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
                        className="text-white/25"
                      />

                      <p className="text-xs text-white/35 truncate">
                        {rule.recipients.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        toggleRule(rule.id)
                      }
                      className="text-white/30 hover:text-white/70 transition-colors p-1.5"
                    >
                      {rule.is_enabled ? (
                        <ToggleRight
                          size={18}
                          className="text-neural-400"
                        />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/40 hover:text-white/70"
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
                        deleteRule(rule.id)
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
          <Input
            label="Rule Name"
            placeholder="e.g. Critical Incidents"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
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
                      : 'bg-transparent border-white/10 text-white/30 hover:border-white/20'
                  )}
                >
                  {s.charAt(0).toUpperCase() +
                    s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Confidence Threshold (0â€“1)"
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
            label="Recipient Emails"
            placeholder="oncall@co.com, team@co.com"
            hint="Comma-separated email addresses"
            error={
              errors.recipients_raw?.message
            }
            {...register('recipients_raw')}
          />

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1"
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
