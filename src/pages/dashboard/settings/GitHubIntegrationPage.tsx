import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Save, CheckCircle2, Clock, AlertCircle, RefreshCw, Trash2, ChevronDown, ChevronRight, Unplug, Check, ShieldAlert } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { fetchGitHubIntegrationThunk, saveGitHubIntegrationThunk, deleteGitHubIntegrationThunk, clearError } from '@store/slices/integrationsSlice'
import { Card, CardContent } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Modal } from '@components/common/Modal'
import { Badge } from '@components/common/Badge'
import { useToast } from '@hooks/useProtectedRoute'
import type { GitHubIntegrationFormData } from '@/types'
import { integrationsApi } from '@features/integrations/api/integrationsApi'
import { cn } from '@utils/cn'

const schema = z.object({
  repo_url:               z.string().url('Must be a valid URL'),
  repo_owner:             z.string().min(1, 'Required'),
  repo_name:              z.string().min(1, 'Required'),
  github_installation_id: z.number().int().positive('Required'),
})

export default function GitHubIntegrationPage() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { github, isLoading, error } = useAppSelector(s => s.integrations)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [availableRepos, setAvailableRepos] = useState<any[]>([])
  const [isFetchingRepos, setIsFetchingRepos] = useState(false)
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('')
  const [showManualFallback, setShowManualFallback] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<GitHubIntegrationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      repo_url: '',
      repo_owner: '',
      repo_name: '',
      github_installation_id: undefined as any,
    }
  })

  const installationIdValue = useWatch({
    control,
    name: 'github_installation_id',
  })

  const handleFetchRepos = useCallback((id: number) => {
    setIsFetchingRepos(true)
    integrationsApi.getAvailableRepos(id)
      .then(res => {
        const repos = res?.data?.repositories || []
        setAvailableRepos(repos)
        if (repos.length === 0) {
          toast({ type: 'error', title: 'No repositories found for this installation ID' })
        }
      })
      .catch(err => {
        toast({ type: 'error', title: 'Failed to fetch repositories. Check the Installation ID.' })
      })
      .finally(() => {
        setIsFetchingRepos(false)
      })
  }, [toast])

  useEffect(() => {
    dispatch(fetchGitHubIntegrationThunk())
  }, [dispatch])

  useEffect(() => {
    if (github) {
      reset({
        repo_url: github.repo_url,
        repo_owner: github.repo_owner,
        repo_name: github.repo_name,
        github_installation_id: github.github_installation_id || undefined,
      })
    }
  }, [github, reset])

  useEffect(() => {
    const installationId = searchParams.get('installation_id')
    if (installationId) {
      const parsedId = parseInt(installationId, 10)
      setValue('github_installation_id', parsedId)
      
      handleFetchRepos(parsedId)

      // Clean up URL parameters after capturing the installation ID
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('installation_id')
      newParams.delete('setup_action')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams, setValue, handleFetchRepos])

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
    if (deleteConfirmText.trim().toLowerCase() !== 'disconnect') return
    const res = await dispatch(deleteGitHubIntegrationThunk())
    if (deleteGitHubIntegrationThunk.fulfilled.match(res)) {
      setIsDeleteModalOpen(false)
      setAvailableRepos([]) // Reset available repos when disconnecting
      setSelectedRepoFullName('')
      toast({ type: 'success', title: 'Integration disconnected successfully' })
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
      case 'indexed':   return <CheckCircle2 size={16} className="text-emerald-500" />
      case 'indexing':  return <RefreshCw size={16} className="text-amber-500 animate-spin" />
      case 'failed':    return <AlertCircle size={16} className="text-rose-500" />
      case 'pending':   return <Clock size={16} className="text-slate-400" />
      default:          return <Unplug size={16} className="text-slate-400" />
    }
  }

  const isStep1Complete = !!installationIdValue && availableRepos.length > 0;

  return (
    <div className="w-full space-y-10 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <GitBranch className="text-slate-700" size={24} />
            GitHub Integration
          </h1>
          <p className="text-sm text-slate-500 mt-1">Connect your repository to enable state-of-the-art AST-driven code retrieval.</p>
        </div>
        {github && (
          <div className="hidden sm:block">
            {getStatusBadge(github.indexing_status)}
          </div>
        )}
      </div>

      {github ? (
        // ── CONNECTED STATE ────────────────────────────────────────────────────────
        <div className="space-y-12">
          
          {/* Sync Status Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <RefreshCw size={16} className="text-slate-400" /> Connection Status
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                NeuralOps is actively listening to your repository for changes to keep the AST index up to date.
              </p>
            </div>
            <div className="lg:col-span-2 max-w-2xl">
              <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Repository</p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <GitBranch size={16} className="text-slate-500" />
                        {github.repo_owner}/{github.repo_name}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indexing Status</p>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        {getStatusIcon(github.indexing_status)}
                        <span className="capitalize">{github.indexing_status || 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Sync Commit</p>
                      <p className="text-sm font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                        {github.last_indexed_commit ? github.last_indexed_commit.slice(0, 7) : 'Pending...'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Installation ID</p>
                      <p className="text-sm font-medium text-slate-600">
                        {github.github_installation_id}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <hr className="border-slate-100" />

          {/* Danger Zone Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-base font-semibold text-rose-600 flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-500" /> Danger Zone
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Disconnecting will instantly halt all AST indexing and webhook listening.
              </p>
            </div>
            <div className="lg:col-span-2 max-w-2xl">
              <Card className="shadow-sm border-rose-200 bg-rose-50/30">
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-rose-900">Disconnect Integration</h4>
                    <p className="text-sm text-rose-700/80 mt-1">This action does not delete existing indexed data, but pauses all future updates.</p>
                  </div>
                  <Button variant="destructive" className="shrink-0 shadow-sm" onClick={handleDelete} isLoading={isLoading}>
                    <Trash2 size={14} className="mr-2" />
                    Disconnect
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>

        </div>
      ) : (
        // ── SETUP FLOW STATE ───────────────────────────────────────────────────────
        <div className="space-y-12">
          
          {/* Step 1: Install App */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-3">
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white", isStep1Complete ? "bg-emerald-500" : "bg-indigo-600")}>
                  {isStep1Complete ? <Check size={12} strokeWidth={3} /> : '1'}
                </span>
                Authorize Application
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Install the NeuralOps GitHub App on your account or organization to grant us secure access to your codebase.
              </p>
            </div>
            <div className="lg:col-span-2 max-w-2xl">
              <Card className={cn("shadow-sm border-slate-200/60 transition-colors", isStep1Complete && "border-emerald-200 bg-emerald-50/30")}>
                <CardContent className="p-6">
                  {isStep1Complete ? (
                    <div className="flex items-center gap-3 text-emerald-700 font-medium">
                      <CheckCircle2 size={20} className="text-emerald-500" />
                      App Authorized Successfully
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-sm text-slate-600">
                        You will be redirected to GitHub to complete the installation.
                      </div>
                      <a href="https://github.com/apps/neuralops-app/installations/new" target="_blank" rel="noreferrer">
                        <Button type="button" className="gap-2 bg-[#24292e] hover:bg-[#1b1f23] text-white border-0 shadow-sm w-full sm:w-auto">
                          <GitBranch size={16} />
                          Install on GitHub
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <hr className="border-slate-100" />

          {/* Step 2: Select Repository */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-300", !isStep1Complete && "opacity-40 pointer-events-none")}>
            <div className="lg:col-span-1">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-3">
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white", !isStep1Complete ? "bg-slate-400" : "bg-indigo-600")}>
                  2
                </span>
                Select Repository
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Choose the specific repository you want NeuralOps to sync and index.
              </p>
            </div>
            <div className="lg:col-span-2 max-w-2xl">
              <Card className="shadow-sm border-slate-200/60">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-6 space-y-2">
                      <select
                        className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-10"
                        value={selectedRepoFullName}
                        onChange={(e) => {
                          const repo = availableRepos.find(r => r.full_name === e.target.value)
                          if (repo) {
                            setSelectedRepoFullName(repo.full_name)
                            setValue('repo_owner', repo.owner)
                            setValue('repo_name', repo.name)
                            setValue('repo_url', repo.html_url)
                          }
                        }}
                        disabled={!isStep1Complete}
                      >
                        <option value="" disabled>Choose a repository...</option>
                        {availableRepos.map(repo => (
                          <option key={repo.id} value={repo.full_name}>
                            {repo.full_name}
                          </option>
                        ))}
                      </select>
                      <input type="hidden" {...register('repo_url')} />
                      <input type="hidden" {...register('repo_owner')} />
                      <input type="hidden" {...register('repo_name')} />
                    </div>
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end rounded-b-xl">
                      <Button 
                        type="submit" 
                        isLoading={isLoading} 
                        disabled={!selectedRepoFullName}
                        className="gap-2 shadow-sm"
                      >
                        <Save size={16} />
                        Save Connection
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Manual Fallback (Collapsible) */}
          {!isStep1Complete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center justify-center pt-8">
              <button 
                type="button"
                onClick={() => setShowManualFallback(!showManualFallback)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                {showManualFallback ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Having trouble? Enter Installation ID manually
              </button>
              
              <AnimatePresence>
                {showManualFallback && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden w-full max-w-md mt-4"
                  >
                    <Card className="shadow-sm border-slate-200">
                      <CardContent className="p-4 space-y-3">
                        <p className="text-xs text-slate-500">
                          If you weren't redirected properly, find your Installation ID in the URL on GitHub (e.g., github.com/settings/installations/<strong>123456</strong>) and paste it below.
                        </p>
                        <div className="flex gap-2">
                          <Input 
                            type="number"
                            placeholder="e.g. 142552714" 
                            {...register('github_installation_id', { valueAsNumber: true })}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => installationIdValue && handleFetchRepos(installationIdValue)}
                            disabled={!installationIdValue || isFetchingRepos}
                            isLoading={isFetchingRepos}
                            className="shrink-0"
                          >
                            Fetch Repos
                          </Button>
                        </div>
                        {errors.github_installation_id && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.github_installation_id.message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      )}

      {/* Disconnect Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Disconnect GitHub Integration?"
        description="This will stop all AST indexing for your codebase immediately. No code will be deleted, but auto-sync will halt."
        size="sm"
      >
        <div className="mt-5 space-y-4">
          <Input
            label="Type 'disconnect' to confirm"
            placeholder="disconnect"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              isLoading={isLoading}
              disabled={deleteConfirmText.trim().toLowerCase() !== 'disconnect'}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
