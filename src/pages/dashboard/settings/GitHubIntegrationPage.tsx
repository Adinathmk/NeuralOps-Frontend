import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GitBranch, Save, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  Trash2, ChevronDown, ChevronRight, Unplug, Check, ExternalLink, 
  Plus, Server, GitMerge
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { 
  fetchGitHubIntegrationsThunk, saveGitHubIntegrationThunk, deleteGitHubIntegrationThunk, 
  fetchServiceMappingsThunk, createServiceMappingThunk, deleteServiceMappingThunk, clearError 
} from '@store/slices/integrationsSlice'
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
  default_branch:         z.string(),
  github_installation_id: z.number().int().positive('Required'),
})

export default function GitHubIntegrationPage() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { integrations, serviceMappings, isLoading, error } = useAppSelector(s => s.integrations)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [repoToDelete, setRepoToDelete] = useState<number | null>(null)

  const [availableRepos, setAvailableRepos] = useState<any[]>([])
  const [isFetchingRepos, setIsFetchingRepos] = useState(false)
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('')
  const [showManualFallback, setShowManualFallback] = useState(false)
  
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isAddingMapping, setIsAddingMapping] = useState(false)
  
  const [newServiceName, setNewServiceName] = useState('')
  const [newMappingRepoId, setNewMappingRepoId] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<GitHubIntegrationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      repo_url: '',
      repo_owner: '',
      repo_name: '',
      default_branch: 'main',
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
        const connectedRepoUrls = new Set(integrations.map(i => i.repo_url))
        const unintegratedRepos = repos.filter(repo => !connectedRepoUrls.has(repo.html_url))

        setAvailableRepos(unintegratedRepos)
        if (unintegratedRepos.length === 0) {
          if (repos.length > 0) {
             toast({ type: 'success', title: 'All available repositories for this installation are already connected.' })
          } else {
             toast({ type: 'error', title: 'No repositories found for this installation ID' })
          }
        }
      })
      .catch(err => {
        toast({ type: 'error', title: 'Failed to fetch repositories. Check the Installation ID.' })
      })
      .finally(() => {
        setIsFetchingRepos(false)
      })
  }, [toast, integrations])

  useEffect(() => {
    dispatch(fetchGitHubIntegrationsThunk())
    dispatch(fetchServiceMappingsThunk())
  }, [dispatch])

  useEffect(() => {
    const installationId = searchParams.get('installation_id')
    if (installationId) {
      const parsedId = parseInt(installationId, 10)
      setValue('github_installation_id', parsedId)
      setIsAddingNew(true)
      
      handleFetchRepos(parsedId)

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
      toast({ type: 'success', title: 'Repository integrated successfully' })
      setIsAddingNew(false)
      reset()
      setAvailableRepos([])
      setSelectedRepoFullName('')
    }
  }

  const handleDelete = (id: number) => {
    setRepoToDelete(id)
    setIsDeleteModalOpen(true)
    setDeleteConfirmText('')
  }

  const confirmDelete = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'disconnect' || repoToDelete === null) return
    const res = await dispatch(deleteGitHubIntegrationThunk(repoToDelete))
    if (deleteGitHubIntegrationThunk.fulfilled.match(res)) {
      setIsDeleteModalOpen(false)
      setRepoToDelete(null)
      toast({ type: 'success', title: 'Repository disconnected successfully' })
    }
  }

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName || !newMappingRepoId) return
    const res = await dispatch(createServiceMappingThunk({
      service_name: newServiceName,
      github_integration_id: newMappingRepoId
    }))
    if (createServiceMappingThunk.fulfilled.match(res)) {
      toast({ type: 'success', title: 'Code mapping created successfully' })
      setNewServiceName('')
      setNewMappingRepoId('')
      setIsAddingMapping(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    const res = await dispatch(deleteServiceMappingThunk(id))
    if (deleteServiceMappingThunk.fulfilled.match(res)) {
      toast({ type: 'success', title: 'Code mapping deleted successfully' })
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'indexed':
      case 'completed': return <Badge variant="success" dot className="bg-emerald-50 text-emerald-700 border-emerald-200">Indexed</Badge>
      case 'indexing':  return <Badge variant="warning" dot className="bg-amber-50 text-amber-700 border-amber-200">Indexing</Badge>
      case 'failed':    return <Badge variant="critical" dot className="bg-rose-50 text-rose-700 border-rose-200">Failed</Badge>
      case 'pending':   return <Badge variant="neutral" dot>Pending</Badge>
      default:          return <Badge variant="neutral">Not Connected</Badge>
    }
  }

  const isStep1Complete = !!installationIdValue && availableRepos.length > 0;
  const showSetupFlow = isAddingNew || integrations.length === 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-24">
      {/* ── Premium Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Cpath%20d%3D%22M20%200L40%2020L20%2040L0%2020L20%200Z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E')] bg-[length:30px_30px]" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <GitBranch size={24} className="text-indigo-300" />
              </div>
              GitHub Integrations
            </h1>
            <p className="text-slate-300 mt-3 max-w-xl text-sm leading-relaxed">
              Connect your repositories to enable NeuralOps' state-of-the-art AST parser. We continuously monitor and index your codebase to provide perfect context for incident resolution.
            </p>
          </div>
          {!showSetupFlow && (
            <Button 
              onClick={() => setIsAddingNew(true)} 
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10 whitespace-nowrap gap-2 border-0"
            >
              <Plus size={18} /> Connect Repository
            </Button>
          )}
        </div>
      </div>

      {/* ── SETUP FLOW (Stepper) ── */}
      <AnimatePresence mode="wait">
        {showSetupFlow && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Configure Connection</h2>
                  <p className="text-sm text-slate-500 mt-1">Follow the steps below to securely link your codebase.</p>
                </div>
                {integrations.length > 0 && (
                  <Button variant="ghost" onClick={() => setIsAddingNew(false)} className="text-slate-500 hover:text-slate-800">
                    Cancel Setup
                  </Button>
                )}
              </div>
              
              <div className="p-8 sm:p-10 space-y-12">
                {/* Step 1: Install App */}
                <div className="flex gap-6 relative">
                  <div className="flex flex-col items-center z-10">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm transition-colors duration-300", isStep1Complete ? "bg-emerald-500" : "bg-indigo-600")}>
                      {isStep1Complete ? <Check size={18} strokeWidth={3} /> : '1'}
                    </div>
                    {/* Vertical line connecting steps */}
                    <div className="absolute top-10 bottom-[-3rem] left-5 w-px bg-slate-200 -z-10"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">Authorize GitHub App</h3>
                    <p className="text-sm text-slate-500 mt-1.5 mb-5 max-w-lg leading-relaxed">
                      Install the NeuralOps GitHub App on your account or organization to grant read-only access to your source code.
                    </p>
                    
                    {isStep1Complete ? (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium text-sm border border-emerald-100">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        App Authorized Successfully
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-sm font-medium text-slate-700">You will be redirected to GitHub to complete the installation.</span>
                        <a href="https://github.com/apps/neuralops-app/installations/new" target="_blank" rel="noreferrer">
                          <Button type="button" className="gap-2 bg-[#24292e] hover:bg-[#1b1f23] text-white shadow-md border-0 w-full sm:w-auto h-11 px-6 rounded-xl">
                            <GitBranch size={16} />
                            Install on GitHub
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Select Repository */}
                <div className={cn("flex gap-6 transition-opacity duration-500", !isStep1Complete && "opacity-40 pointer-events-none")}>
                  <div className="flex flex-col items-center z-10">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm transition-colors duration-300", !isStep1Complete ? "bg-slate-300" : "bg-indigo-600")}>
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Select Repository</h3>
                    <p className="text-sm text-slate-500 mt-1.5 mb-5 max-w-lg leading-relaxed">
                      Choose the specific repository you want NeuralOps to sync and index.
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (isStep1Complete) setIsRepoDropdownOpen(!isRepoDropdownOpen)
                          }}
                          disabled={!isStep1Complete}
                          className={cn(
                            "flex items-center justify-between w-full h-12 px-4 rounded-xl border bg-slate-50 text-sm font-medium transition-all focus:outline-none",
                            !isStep1Complete ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-400" : 
                            isRepoDropdownOpen ? "border-indigo-500 ring-4 ring-indigo-500/10 text-slate-800 bg-white" : "border-slate-200 hover:border-slate-300 text-slate-800"
                          )}
                        >
                          <span className={cn("truncate", !selectedRepoFullName && "text-slate-500 font-normal")}>
                            {selectedRepoFullName || "Choose a repository from your GitHub account..."}
                          </span>
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", isRepoDropdownOpen && "rotate-180")} />
                        </button>
                        
                        <AnimatePresence>
                          {isRepoDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsRepoDropdownOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden"
                              >
                                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                                  {availableRepos.length === 0 ? (
                                    <div className="px-3 py-4 text-sm text-slate-500 text-center">
                                      No repositories available
                                    </div>
                                  ) : (
                                    availableRepos.map(repo => (
                                      <button
                                        key={repo.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedRepoFullName(repo.full_name)
                                          setValue('repo_owner', repo.owner)
                                          setValue('repo_name', repo.name)
                                          setValue('repo_url', repo.html_url)
                                          setIsRepoDropdownOpen(false)
                                        }}
                                        className={cn(
                                          "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                                          selectedRepoFullName === repo.full_name 
                                            ? "bg-indigo-50 text-indigo-700 font-semibold" 
                                            : "text-slate-700 hover:bg-slate-50 font-medium"
                                        )}
                                      >
                                        <span className="truncate">{repo.full_name}</span>
                                        {selectedRepoFullName === repo.full_name && (
                                          <Check className="w-4 h-4 shrink-0 text-indigo-600" />
                                        )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      <input type="hidden" {...register('repo_url')} />
                      <input type="hidden" {...register('repo_owner')} />
                      <input type="hidden" {...register('repo_name')} />
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit" 
                          isLoading={isLoading} 
                          disabled={!selectedRepoFullName}
                          className="gap-2 shadow-md h-11 px-6 rounded-xl"
                        >
                          <Save size={16} />
                          Save Connection
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              {/* Manual Fallback Footer */}
              {!isStep1Complete && (
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex flex-col items-center">
                  <button 
                    type="button"
                    onClick={() => setShowManualFallback(!showManualFallback)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
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
                        className="overflow-hidden w-full max-w-lg mt-5"
                      >
                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Find your Installation ID in the URL on GitHub (e.g., github.com/settings/installations/<strong>123456</strong>) and paste it below.
                          </p>
                          <div className="flex gap-3">
                            <Input 
                              type="number"
                              placeholder="e.g. 142552714" 
                              {...register('github_installation_id', { valueAsNumber: true })}
                              className="flex-1 h-11 rounded-xl"
                            />
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => installationIdValue && handleFetchRepos(installationIdValue)}
                              disabled={!installationIdValue || isFetchingRepos}
                              isLoading={isFetchingRepos}
                              className="shrink-0 h-11 px-5 rounded-xl shadow-sm"
                            >
                              Fetch Repos
                            </Button>
                          </div>
                          {errors.github_installation_id && (
                            <p className="text-xs font-medium text-red-500 flex items-center gap-1.5">
                              <AlertCircle size={14} />
                              {errors.github_installation_id.message}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONNECTED REPOSITORIES ── */}
      {!showSetupFlow && integrations?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Connections</h2>
          <div className="grid grid-cols-1 gap-5">
            {integrations.map((github) => (
              <div key={github.id} className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/60 flex flex-col md:flex-row gap-6 justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100/50 shrink-0 text-indigo-600">
                    <GitBranch size={26} strokeWidth={2.5}/>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{github.repo_name}</h3>
                    <a href={github.repo_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 mt-1 w-fit">
                      {github.repo_owner}/{github.repo_name} <ExternalLink size={12}/>
                    </a>
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      {getStatusBadge(github.indexing_status)}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Clock size={12}/> 
                        Last Sync: <span className="font-mono text-slate-600">{github.last_indexed_commit?.slice(0,7) || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                  <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    Inst. ID: {github.github_installation_id}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-9 px-3 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" 
                    onClick={() => handleDelete(github.id)}
                    isLoading={isLoading && repoToDelete === github.id}
                  >
                    <Unplug size={14} className="mr-2" /> Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── CODE MAPPINGS ── */}
      {!showSetupFlow && integrations?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <GitMerge className="text-indigo-600" size={22} />
                Code Mappings
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
                Explicitly map SDK service names to their corresponding repositories. This ensures the AI knows exactly where to look for source code during an incident.
              </p>
            </div>
            {!isAddingMapping && (
              <Button onClick={() => setIsAddingMapping(true)} variant="secondary" className="shadow-sm gap-2 rounded-xl h-10">
                <Plus size={16} /> New Mapping
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {serviceMappings?.map(mapping => (
              <div key={mapping.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 text-slate-400">
                    <Server size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{mapping.service_name}</h4>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                      Mapped to <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{mapping.repo_name}</span>
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDeleteMapping(mapping.id)} 
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 px-3 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}

            {(!serviceMappings || serviceMappings.length === 0) && !isAddingMapping && (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                  <GitMerge size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No mappings configured</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4 max-w-sm">Connect your first service name to a repository to enable accurate code retrieval.</p>
                <Button onClick={() => setIsAddingMapping(true)} variant="secondary" className="shadow-sm gap-2 rounded-xl">
                  <Plus size={16} /> Create Mapping
                </Button>
              </div>
            )}

            {isAddingMapping && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-indigo-900 mb-4">Create New Code Mapping</h4>
                  <form onSubmit={handleCreateMapping} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-indigo-700 mb-1.5 uppercase tracking-wider">Service Name (from SDK)</label>
                      <Input 
                        placeholder="e.g. payment-api" 
                        value={newServiceName} 
                        onChange={e => setNewServiceName(e.target.value)} 
                        required 
                        className="bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-indigo-700 mb-1.5 uppercase tracking-wider">Target Repository</label>
                      <select 
                        className="w-full h-11 px-4 rounded-xl border border-indigo-200 bg-white text-slate-800 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat pr-10"
                        value={newMappingRepoId}
                        onChange={e => setNewMappingRepoId(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select repository...</option>
                        {integrations.map(repo => (
                          <option key={repo.id} value={repo.id}>{repo.repo_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Button type="button" variant="ghost" onClick={() => setIsAddingMapping(false)} className="text-slate-500 hover:text-slate-700 h-11 px-4 rounded-xl">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!newServiceName || !newMappingRepoId || isLoading} isLoading={isLoading} className="h-11 px-6 rounded-xl shadow-md">
                        Save Mapping
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Disconnect Modal ── */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Disconnect Repository"
        description="This will stop all AST indexing for this repository immediately. No source code will be deleted, but auto-sync will halt."
        size="sm"
      >
        <div className="mt-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>If any Code Mappings are attached to this repository, incident resolution for those services will fail.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Type <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-rose-600">disconnect</span> to confirm</label>
            <Input
              placeholder="disconnect"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl h-10 px-5">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              isLoading={isLoading}
              disabled={deleteConfirmText.trim().toLowerCase() !== 'disconnect'}
              className="rounded-xl h-10 px-5"
            >
              Disconnect Repository
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
