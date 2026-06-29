import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Plus, Trash2, ShieldAlert } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">API Keys</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage API keys used by the NeuralOps SDK to authenticate requests.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} />
          Generate New Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={16} className="text-slate-500" />
            Active Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : keys.filter(k => k.is_active).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <ShieldAlert className="text-slate-400" size={24} />
              </div>
              <h3 className="text-sm font-medium text-slate-900">No Active API Keys</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Generate an API key to securely connect your SDKs to the NeuralOps backend.
              </p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {keys.filter(k => k.is_active).map(key => (
                <motion.div
                  key={key.id}
                  variants={item}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key size={16} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{key.name}</p>
                        {key.is_active ? (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">Active</Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px] px-1.5 py-0">Revoked</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {key.key_prefix}...
                        </code>
                        <span className="text-xs text-slate-400">
                          Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                        </span>
                        {key.last_used_at && (
                          <span className="text-xs text-slate-400 border-l border-slate-200 pl-3">
                            Last used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRevokeClick(key)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Revoke
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

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
