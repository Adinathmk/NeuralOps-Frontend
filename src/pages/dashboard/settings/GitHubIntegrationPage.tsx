import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { GitBranch, Save, CheckCircle, Clock, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { fetchGitHubIntegrationThunk, saveGitHubIntegrationThunk, deleteGitHubIntegrationThunk, clearError } from '@store/slices/integrationsSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Modal } from '@components/common/Modal'
import { Badge } from '@components/common/Badge'
import { useToast } from '@hooks/useProtectedRoute'
import type { GitHubIntegrationFormData } from '@/types'

const schema = z.object({
  repo_url:       z.string().url('Must be a valid URL'),
  repo_owner:     z.string().min(1, 'Required'),
  repo_name:      z.string().min(1, 'Required'),
  pat:            z.string().optional(),
  webhook_secret: z.string().optional(),
})

export default function GitHubIntegrationPage() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { github, isLoading, error } = useAppSelector(s => s.integrations)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GitHubIntegrationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      repo_url: '',
      repo_owner: '',
      repo_name: '',
      pat: '',
      webhook_secret: '',
    }
  })

  useEffect(() => {
    dispatch(fetchGitHubIntegrationThunk())
  }, [dispatch])

  useEffect(() => {
    if (github) {
      reset({
        repo_url: github.repo_url,
        repo_owner: github.repo_owner,
        repo_name: github.repo_name,
        pat: '',
        webhook_secret: '',
      })
    }
  }, [github, reset])

  useEffect(() => {
    if (error) {
      toast({ type: 'error', title: error })
      dispatch(clearError())
    }
  }, [error, toast, dispatch])

  const onSubmit = async (data: GitHubIntegrationFormData) => {
    const res = await dispatch(saveGitHubIntegrationThunk(data))
    if (saveGitHubIntegrationThunk.fulfilled.match(res)) {
      toast({ type: 'success', title: 'Integration saved successfully' })
    }
  }

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
    setDeleteConfirmText('')
  }

  const confirmDelete = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'delete') return
    const res = await dispatch(deleteGitHubIntegrationThunk())
    if (deleteGitHubIntegrationThunk.fulfilled.match(res)) {
      setIsDeleteModalOpen(false)
      toast({ type: 'success', title: 'Integration deleted successfully' })
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'indexed':   return <Badge variant="success" dot>Completed</Badge>
      case 'indexing':  return <Badge variant="warning" dot>Indexing</Badge>
      case 'failed':    return <Badge variant="critical" dot>Failed</Badge>
      case 'pending':   return <Badge variant="neutral" dot>Pending</Badge>
      default:          return <Badge variant="neutral">Not Connected</Badge>
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'indexed':   return <CheckCircle size={14} className="text-primary" />
      case 'indexing':  return <RefreshCw size={14} className="text-amber-400 animate-spin" />
      case 'failed':    return <AlertTriangle size={14} className="text-red-400" />
      case 'pending':   return <Clock size={14} className="text-slate-500" />
      default:          return null
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">GitHub Integration</h1>
        <p className="text-sm text-slate-500 mt-0.5">Connect your repository to enable AST-driven code retrieval.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-slate-700" />
                <CardTitle>Repository Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {github ? (
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <GitBranch size={20} className="text-slate-900" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Connected Repository</p>
                        <p className="text-xs text-slate-600">{github.repo_owner}/{github.repo_name}</p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDelete} isLoading={isLoading} className="gap-2">
                      <Trash2 size={14} />
                      Delete Integration
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Repository URL"
                    placeholder="https://github.com/owner/repo"
                    error={errors.repo_url?.message}
                    {...register('repo_url')}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Repository Owner"
                      placeholder="e.g. acme-corp"
                      error={errors.repo_owner?.message}
                      {...register('repo_owner')}
                    />
                    <Input
                      label="Repository Name"
                      placeholder="e.g. backend-api"
                      error={errors.repo_name?.message}
                      {...register('repo_name')}
                    />
                  </div>
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <p className="text-xs text-slate-600">
                      Provide a Personal Access Token (PAT) and Webhook Secret to enable sync.
                      These fields are write-only and encrypted at rest. Leave blank to keep existing credentials.
                    </p>
                    <Input
                      label="Personal Access Token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      error={errors.pat?.message}
                      {...register('pat')}
                    />
                    <Input
                      label="Webhook Secret"
                      type="password"
                      placeholder="••••••••••••"
                      error={errors.webhook_secret?.message}
                      {...register('webhook_secret')}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" isLoading={isLoading} className="gap-2">
                      <Save size={14} />
                      Save Integration
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Indexing Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(github?.indexing_status)}
                  {getStatusBadge(github?.indexing_status)}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Indexed Commit</p>
                <p className="text-sm text-slate-700 font-mono">
                  {github?.last_indexed_commit ? github.last_indexed_commit.slice(0, 7) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Connected Repo</p>
                <p className="text-sm text-slate-700">
                  {github ? `${github.repo_owner}/${github.repo_name}` : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Integration?"
        description="This action cannot be undone. All AST indexing will stop and your credentials will be removed."
        size="sm"
      >
        <div className="mt-4 space-y-4">
          <Input
            label="Type 'delete' to confirm"
            placeholder="delete"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              isLoading={isLoading}
              disabled={deleteConfirmText.trim().toLowerCase() !== 'delete'}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
