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


function getDeviceIcon(deviceName: string) {
  if (/iphone|android|mobile/i.test(deviceName)) return Smartphone
  return Monitor
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState<Session[]>([])
  const [loading, setLoading]     = useState(false)
  const [revoking, setRevoking]   = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    authApi.getSessions()
      .then(res => { 
        if (res.data) {
          // Map over data to update last_activity for the current session
          const updatedData = res.data.map((session: Session) => 
            session.is_current 
              ? { ...session, last_activity: new Date().toISOString() } 
              : session
          );

          // Sort to ensure the current session is always at the top
          const sorted = updatedData.sort((a, b) => {
            if (a.is_current && !b.is_current) return -1;
            if (!a.is_current && b.is_current) return 1;
            return 0; // retain original order (last active) for the rest
          });
          setSessions(sorted);
        }
      })
      .catch((err) => { toast({ type: 'error', title: 'Failed to load sessions' }) })
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



  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Active Sessions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage where you're signed in. Revoke access from devices you don't recognise.</p>
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
            const isCurrent = session.is_current

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className={cn(isCurrent && 'border-primary/20 bg-primary/5')}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                      isCurrent ? 'bg-primary/15' : 'bg-white/5'
                    )}>
                      <DeviceIcon size={18} className={isCurrent ? 'text-primary' : 'text-slate-500'} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800">{session.device_name}</p>
                        {isCurrent && <Badge variant="success" dot>Current session</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Globe size={11} /> {session.ip_address}
                        </span>
                        <span className="text-xs text-slate-500">Last active {formatRelative(session.last_activity)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
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