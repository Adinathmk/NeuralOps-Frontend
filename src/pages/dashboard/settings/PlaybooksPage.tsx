import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, BookOpen, Trash2, Edit2, Code2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Modal } from '@components/common/Modal'
import { useToast } from '@hooks/useProtectedRoute'
import { formatDate } from '@utils/cn'
import type { Playbook } from '@/types'

const MOCK_PLAYBOOKS: Playbook[] = [
  { id: '1', tenant_id: 't1', name: 'NullPointerException Handler', description: 'Handles null pointer / none type dereferences', pattern_regex: '(NullPointerException|NoneType.*NoneType)', instructions: 'Check all return values from external calls for None. Add null guards before attribute access. Review async context for race conditions.', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: '2', tenant_id: 't1', name: 'Database Connection Timeout',  description: 'Guides analysis of DB connection pool exhaustion', pattern_regex: '(ConnectionTimeout|pool.*timeout|db.*connection)', instructions: 'Check connection pool limits. Look for unclosed transactions. Verify database health. Consider adding connection retry logic with exponential backoff.', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: '3', tenant_id: 't1', name: 'Memory Leak Detection',        description: 'Pattern for OOM and high memory incidents', pattern_regex: '(OutOfMemoryError|MemoryError|heap.*space)', instructions: 'Profile memory allocation. Check for unclosed resources (file handles, network connections). Look for growing caches or event listener accumulation.', created_at: new Date(Date.now() - 86400000).toISOString() },
]

const schema = z.object({
  name:           z.string().min(2, 'Name required'),
  description:    z.string().min(5, 'Description required'),
  pattern_regex:  z.string().min(1, 'Pattern required'),
  instructions:   z.string().min(10, 'Instructions required'),
})
type PlaybookForm = z.infer<typeof schema>

export default function PlaybooksPage() {
  const { toast } = useToast()
  const [playbooks, setPlaybooks] = useState<Playbook[]>(MOCK_PLAYBOOKS)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState<Playbook | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlaybookForm>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditItem(null); reset(); setModalOpen(true) }
  const openEdit   = (pb: Playbook) => {
    setEditItem(pb)
    setValue('name',          pb.name)
    setValue('description',   pb.description)
    setValue('pattern_regex', pb.pattern_regex)
    setValue('instructions',  pb.instructions)
    setModalOpen(true)
  }

  const onSubmit = (data: PlaybookForm) => {
    if (editItem) {
      setPlaybooks(prev => prev.map(p => p.id === editItem.id ? { ...p, ...data } : p))
      toast({ type: 'success', title: 'Playbook updated' })
    } else {
      setPlaybooks(prev => [{
        id: crypto.randomUUID(), tenant_id: 't1',
        ...data,
        created_at: new Date().toISOString(),
      }, ...prev])
      toast({ type: 'success', title: 'Playbook created' })
    }
    setModalOpen(false); reset()
  }

  const deletePlaybook = (id: string) => {
    setPlaybooks(prev => prev.filter(p => p.id !== id))
    toast({ type: 'success', title: 'Playbook deleted' })
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Playbooks</h1>
          <p className="text-sm text-white/40 mt-0.5">Runbooks matched against errors to guide AI agent analysis.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus size={13} /> New playbook
        </Button>
      </div>

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
                    <p className="text-sm font-semibold text-white/90">{pb.name}</p>
                    <p className="text-xs text-white/50 mt-0.5">{pb.description}</p>
                    <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-surface-2 border border-white/8 w-fit">
                      <Code2 size={11} className="text-white/30" />
                      <code className="text-[11px] text-white/50 font-mono">{pb.pattern_regex}</code>
                    </div>
                    <p className="text-[11px] text-white/25 mt-2">Created {formatDate(pb.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white/70" onClick={() => openEdit(pb)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/50 hover:text-red-400" onClick={() => deletePlaybook(pb.id)}>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input label="Name" placeholder="e.g. Database Timeout Handler" error={errors.name?.message} {...register('name')} />
          <Input label="Description" placeholder="Short description of when this applies" error={errors.description?.message} {...register('description')} />
          <Input
            label="Error Pattern (Regex)"
            placeholder="e.g. (NullPointerException|NoneType)"
            hint="Matched against the error type to activate this playbook"
            error={errors.pattern_regex?.message}
            {...register('pattern_regex')}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Instructions for AI Agent</label>
            <textarea
              {...register('instructions')}
              rows={5}
              placeholder="Step-by-step instructions for the AI agent when this error type is detectedâ€¦"
              className="w-full rounded-md border border-white/10 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-neural-500 resize-none transition-colors"
            />
            {errors.instructions && <p className="text-xs text-red-400">{errors.instructions.message}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">{editItem ? 'Save changes' : 'Create playbook'}</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
