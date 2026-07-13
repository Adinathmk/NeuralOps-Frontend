import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Smartphone, Globe, Trash2, Shield, MonitorSpeaker } from 'lucide-react'
import { Card, CardContent } from '@components/common/Card'
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

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-24">
      {/* ── Premium Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Cpath%20d%3D%22M20%200L40%2020L20%2040L0%2020L20%200Z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E')] bg-[length:30px_30px]" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <MonitorSpeaker size={24} className="text-indigo-300" />
              </div>
              Active Sessions
            </h1>
            <p className="text-slate-300 mt-3 max-w-xl text-sm leading-relaxed">
              Manage where you're signed in across devices. Review your recent activity and securely revoke access from any devices you don't recognize.
            </p>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        
        {/* Security tip */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
          <Shield size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-800 leading-relaxed">
            If you see a session you don't recognize, revoke it immediately and change your password.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              <AnimatePresence>
                {sessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device_name)
                  const isCurrent = session.is_current

                  return (
                    <motion.div
                      key={session.id}
                      variants={item}
                      layout
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border flex flex-col md:flex-row gap-6 justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden",
                        isCurrent ? "bg-indigo-50/20 border-indigo-200" : "bg-white border-slate-200/60"
                      )}
                    >
                      {isCurrent && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transition-colors" />
                      )}
                      {!isCurrent && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-300/30 group-hover:bg-slate-300 transition-colors" />
                      )}
                      
                      <div className="flex items-start gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                          isCurrent ? "bg-indigo-100/50 border-indigo-200 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-500"
                        )}>
                          <DeviceIcon size={22} strokeWidth={2.5} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-slate-900">{session.device_name}</h3>
                            {isCurrent && <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 uppercase tracking-wider">Current Session</Badge>}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                              <Globe size={13} /> {session.ip_address}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              Last active <span className="text-slate-700 font-semibold">{formatRelative(session.last_activity)}</span>
                            </span>
                          </div>
                          
                          <p className="text-[11px] font-medium text-slate-400 mt-2">
                            Started {formatDate(session.created_at)} &middot; Expires {formatDate(session.expires_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-center border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0 min-h-full">
                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-9 px-3 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setConfirmId(session.id)}
                            isLoading={revoking === session.id}
                          >
                            <Trash2 size={14} className="mr-2" /> Revoke
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Revoke confirm modal */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Revoke session?"
        description="This device will be immediately signed out and will need to log in again."
        size="sm"
      >
        <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-5">
          <Button variant="ghost" className="flex-1 rounded-xl h-10" onClick={() => setConfirmId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1 rounded-xl h-10" onClick={() => confirmId && handleRevoke(confirmId)}>
            Yes, Revoke
          </Button>
        </div>
      </Modal>
    </div>
  )
}