import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Smartphone, Globe, Trash2, Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Badge } from '@components/common/Badge'
import { Modal } from '@components/common/Modal'
import { Skeleton } from '@components/common/Skeleton'
import { authApi } from '@features/auth/api/authApi'
import { useToast } from '@hooks/useProtectedRoute'
import { formatDate, formatRelative, cn } from '@utils/cn'
import type { Session } from '@/types'

// Mock sessions
const MOCK_SESSIONS: Session[] = [
  { id: 'current', device_name: 'Chrome on macOS', ip_address: '192.168.1.1', last_activity: new Date().toISOString(), created_at: new Date(Date.now() - 3600000).toISOString(), expires_at: new Date(Date.now() + 86400000 * 7).toISOString() },
  { id: 's2', device_name: 'Firefox on Windows', ip_address: '203.0.113.42', last_activity: new Date(Date.now() - 7200000).toISOString(), created_at: new Date(Date.now() - 86400000 * 2).toISOString(), expires_at: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: 's3', device_name: 'Safari on iPhone', ip_address: '198.51.100.7', last_activity: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000 * 5).toISOString(), expires_at: new Date(Date.now() + 86400000 * 2).toISOString() },
]

function getDeviceIcon(deviceName: string) {
  if (/iphone|android|mobile/i.test(deviceName)) return Smartphone
  return Monitor
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState<Session[]>(MOCK_SESSIONS)
  const [loading, setLoading]     = useState(false)
  const [revoking, setRevoking]   = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    authApi.getSessions()
      .then(res => { if (res.data) setSessions(res.data) })
      .catch(() => { /* use mock */ })
      .finally(() => setLoading(false))
  }, [])

  const handleRevoke = async (id: string) => {
    setRevoking(id); setConfirmId(null)
    try {
      await authApi.revokeSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast({ type: 'success', title: 'Session revoked', description: 'That device has been signed out.' })
    } catch {
      toast({ type: 'error', title: 'Failed to revoke session' })
    } finally { setRevoking(null) }
  }

  const currentSession = sessions[0] // first in list is current

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Active Sessions</h1>
        <p className="text-sm text-white/40 mt-0.5">Manage where you're signed in. Revoke access from devices you don't recognise.</p>
      </div>

      {/* Security tip */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/8">
        <Shield size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          If you see a session you don't recognise, revoke it immediately and change your password.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => {
            const DeviceIcon = getDeviceIcon(session.device_name)
            const isCurrent = idx === 0

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className={cn(isCurrent && 'border-neural-500/20 bg-neural-500/5')}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                      isCurrent ? 'bg-neural-500/15' : 'bg-white/5'
                    )}>
                      <DeviceIcon size={18} className={isCurrent ? 'text-neural-400' : 'text-white/40'} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white/90">{session.device_name}</p>
                        {isCurrent && <Badge variant="success" dot>Current session</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Globe size={11} /> {session.ip_address}
                        </span>
                        <span className="text-xs text-white/30">Last active {formatRelative(session.last_activity)}</span>
                      </div>
                      <p className="text-[11px] text-white/25 mt-0.5">
                        Started {formatDate(session.created_at)} · Expires {formatDate(session.expires_at)}
                      </p>
                    </div>

                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 shrink-0"
                        onClick={() => setConfirmId(session.id)}
                        isLoading={revoking === session.id}
                      >
                        <Trash2 size={13} /> Revoke
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Revoke confirm modal */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Revoke session?"
        description="This device will be immediately signed out and will need to log in again."
        size="sm"
      >
        <div className="flex items-center gap-3 mt-2">
          <Button variant="destructive" className="flex-1" onClick={() => confirmId && handleRevoke(confirmId)}>
            Yes, revoke
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}