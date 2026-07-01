import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import { Plus, BookOpen, Trash2, Edit2, Code2, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Modal } from '@components/common/Modal'
import { Skeleton } from '@components/common/Skeleton'
import { useToast } from '@hooks/useProtectedRoute'
import { formatDate } from '@utils/cn'

import { useAppDispatch, useAppSelector } from '@store/index'
import {
  fetchPlaybooks,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
} from '@store/slices/playbooksSlice'

import type { Playbook } from '@/types'

const schema = z.object({
  error_pattern: z.string().min(1, 'Pattern required'),
  instructions:  z.string().min(10, 'Instructions required'),
})
type PlaybookForm = z.infer<typeof schema>

export interface TabHandle { openCreate: () => void }

const PlaybooksTab = forwardRef<TabHandle>((props, ref) => {
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  const { items: playbooks, isLoading } = useAppSelector(s => s.playbooks)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState<Playbook | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlaybookForm>({
    resolver: zodResolver(schema),
  })

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchPlaybooks())
  }, [dispatch])

  // ── Modal openers ───────────────────────────────────────────────────────────
  const openCreate = () => { setEditItem(null); reset(); setModalOpen(true) }
  useImperativeHandle(ref, () => ({ openCreate }))

  const openEdit   = (pb: Playbook) => {
    setEditItem(pb)
    setValue('error_pattern', pb.error_pattern)
    setValue('instructions',  pb.instructions)
    setModalOpen(true)
  }

  // ── Form submit ─────────────────────────────────────────────────────────────
  const onSubmit = async (data: PlaybookForm) => {
    setSubmitting(true)
    try {
      if (editItem) {
        await dispatch(updatePlaybook({
          id: editItem.id,
          error_pattern: data.error_pattern,
          instructions: data.instructions,
        })).unwrap()
        toast({ type: 'success', title: 'Playbook updated' })
      } else {
        await dispatch(createPlaybook({
          error_pattern: data.error_pattern,
          instructions: data.instructions,
        })).unwrap()
        toast({ type: 'success', title: 'Playbook created' })
      }
      setModalOpen(false)
      reset()
    } catch (err) {
      toast({ type: 'error', title: (err as string) || 'Something went wrong' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await dispatch(deletePlaybook(id)).unwrap()
      toast({ type: 'success', title: 'Playbook deleted' })
    } catch (err) {
      toast({ type: 'error', title: (err as string) || 'Failed to delete playbook' })
    }
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading && playbooks.length === 0) {
    return (
      <div className="w-full space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-72 mt-1" />
          </div>
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5">
      {/* Empty state */}
      {playbooks.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen size={32} className="mx-auto text-slate-900/15 mb-3" />
            <p className="text-sm text-slate-500">No playbooks configured yet.</p>
            <p className="text-xs text-slate-400 mt-1">Create your first playbook to guide the AI agent's analysis.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {playbooks.map((pb, i) => (
          <motion.div key={pb.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <BookOpen size={15} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 w-fit">
                      <Code2 size={11} className="text-slate-500" />
                      <code className="text-[11px] text-slate-600 font-mono">{pb.error_pattern}</code>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{pb.instructions}</p>
                    <p className="text-[11px] text-slate-400 mt-2">Created {formatDate(pb.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-700" onClick={() => openEdit(pb)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/50 hover:text-red-400" onClick={() => handleDelete(pb.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title={editItem ? 'Edit playbook' : 'Create playbook'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <Input
            label="Trigger pattern"
            className="font-mono text-sm"
            placeholder="e.g. (NullPointerException|NoneType)"
            hint="Playbook activates when an incident's error matches this pattern"
            error={errors.error_pattern?.message}
            leftIcon={<Code2 size={16} />}
            {...register('error_pattern')}
          />
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              AI Instructions
            </label>
            <textarea
              {...register('instructions')}
              rows={5}
              placeholder="Step-by-step instructions for the AI agent when this error type is detected…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white resize-none transition-all shadow-sm"
            />
            {errors.instructions && <p className="text-xs text-red-400">{errors.instructions.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>{editItem ? 'Save changes' : 'Create playbook'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
})

export default PlaybooksTab
