import { useState } from 'react'
import { Modal } from '@components/common/Modal'
import { Button } from '@components/common/Button'
import { apiKeysApi } from '../api/apiKeysApi'
import { useToast } from '@hooks/useProtectedRoute'

interface RevokeKeyDialogProps {
  open: boolean
  onClose: () => void
  onRevoked: () => void
  keyId: string
  keyName: string
}

export function RevokeKeyDialog({ open, onClose, onRevoked, keyId, keyName }: RevokeKeyDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRevoke = async () => {
    setLoading(true)
    try {
      await apiKeysApi.revokeKey(keyId)
      toast({ type: 'success', title: 'API Key revoked' })
      onRevoked()
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.message || 'Failed to revoke key' })
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Revoke API Key"
      description={`Are you sure you want to revoke the API key "${keyName}"?`}
      size="sm"
    >
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 my-4">
        <p className="text-sm text-red-800">
          <strong>Warning:</strong> Any SDKs currently using this key will immediately be denied access to ingest logs. This action cannot be undone.
        </p>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleRevoke} isLoading={loading}>
          Revoke Key
        </Button>
      </div>
    </Modal>
  )
}
