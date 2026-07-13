import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Plus, Trash2, ShieldAlert, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@components/common/Button'
import { Badge } from '@components/common/Badge'
import { Skeleton } from '@components/common/Skeleton'
import { apiKeysApi, APIKey } from '@features/settings/api/apiKeysApi'
import { CreateApiKeyDialog } from '@features/settings/components/CreateApiKeyDialog'
import { RevokeKeyDialog } from '@features/settings/components/RevokeKeyDialog'

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<{id: string, name: string} | null>(null)

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const data = await apiKeysApi.listKeys()
      setKeys(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleRevokeClick = (key: APIKey) => {
    setKeyToRevoke({ id: key.id, name: key.name })
    setRevokeOpen(true)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  const activeKeys = keys.filter(k => k.is_active)

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-24">
      {/* ── Premium Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Cpath%20d%3D%22M20%200L40%2020L20%2040L0%2020L20%200Z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E')] bg-[length:30px_30px]" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <Key size={24} className="text-indigo-300" />
              </div>
              API Keys
            </h1>
            <p className="text-slate-300 mt-3 max-w-xl text-sm leading-relaxed">
              Manage the API keys used by your NeuralOps SDKs to authenticate requests securely. 
              Keep these keys secret and never commit them to version control.
            </p>
          </div>
          <Button 
            onClick={() => setCreateOpen(true)} 
            className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10 whitespace-nowrap gap-2 border-0"
          >
            <Plus size={18} /> Generate New Key
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active API Keys</h2>
        
        <div className="grid grid-cols-1 gap-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active API Keys</h3>
              <p className="text-sm text-slate-500 mt-1.5 mb-6 max-w-sm leading-relaxed">
                Generate your first API key to start connecting your SDKs to the NeuralOps backend.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-md rounded-xl h-11 px-6">
                <Plus size={16} /> Generate Key
              </Button>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              <AnimatePresence>
                {activeKeys.map(key => (
                  <motion.div
                    key={key.id}
                    variants={item}
                    layout
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/60 flex flex-col md:flex-row gap-6 justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100/50 shrink-0 text-indigo-600">
                        <Key size={22} strokeWidth={2.5}/>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-slate-900">{key.name}</h3>
                          <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 uppercase tracking-wider">Active</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <code className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg font-mono border border-slate-200/60 tracking-wider">
                            {key.key_prefix}<span className="text-slate-400">.......................</span>
                          </code>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                            <Clock size={14}/> 
                            Created: <span className="text-slate-600">{formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                      {key.last_used_at ? (
                         <div className="text-xs font-medium text-slate-400">
                            Last used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                         </div>
                      ) : (
                         <div className="text-xs font-medium text-slate-400">
                            Never used
                         </div>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-9 px-3 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => handleRevokeClick(key)}
                      >
                        <Trash2 size={14} className="mr-2" /> Revoke Key
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => fetchKeys()}
      />

      {keyToRevoke && (
        <RevokeKeyDialog
          open={revokeOpen}
          onClose={() => setRevokeOpen(false)}
          onRevoked={() => {
            fetchKeys()
            setKeyToRevoke(null)
          }}
          keyId={keyToRevoke.id}
          keyName={keyToRevoke.name}
        />
      )}
    </div>
  )
}
