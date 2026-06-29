import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Key } from 'lucide-react'
import { Modal } from '@components/common/Modal'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { apiKeysApi, CreateAPIKeyResponse } from '../api/apiKeysApi'
import { useToast } from '@hooks/useProtectedRoute'

interface CreateApiKeyDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateApiKeyDialog({ open, onClose, onCreated }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState<CreateAPIKeyResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const created = await apiKeysApi.createKey(name.trim())
      setNewKey(created)
      onCreated()
      toast({ type: 'success', title: 'API Key created successfully' })
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.message || 'Failed to create key' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!newKey?.key) return
    navigator.clipboard.writeText(newKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ type: 'success', title: 'Copied to clipboard' })
  }

  const handleClose = () => {
    setNewKey(null)
    setName('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={newKey ? "Your New API Key" : "Create API Key"}
      description={newKey ? undefined : "Generate a new API key for authenticating SDK requests."}
      size="md"
    >
      <AnimatePresence mode="wait">
        {!newKey ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onSubmit={handleCreate}
            className="space-y-4"
          >
            <Input
              label="Key Name"
              placeholder="e.g. Production Worker Node"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || loading} isLoading={loading}>
                Generate Key
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800 font-medium">
                Please copy this key now. For your security, you will not be able to see it again.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg p-3">
                <Key className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                <code className="text-sm font-mono text-emerald-400 break-all w-full select-all">
                  {newKey.key}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-3 p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={handleClose}>
                I have saved it safely
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
