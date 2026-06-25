import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, AlertTriangle, AtSign, UserCheck, Activity, RefreshCw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { fetchNotificationsThunk, markReadThunk, markAllRead } from '@store/slices/notificationsSlice'
import { Card, CardContent } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Badge } from '@components/common/Badge'
import { Skeleton } from '@components/common/Skeleton'
import { formatRelative, cn } from '@utils/cn'
import type { Notification, NotificationType } from '@/types'

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  incident_created: { icon: AlertTriangle, label: 'New Incident',    color: 'text-red-400',    bg: 'bg-red-500/10' },
  mention:          { icon: AtSign,        label: 'Mention',         color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  assignment:       { icon: UserCheck,     label: 'Assignment',      color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  status_change:    { icon: Activity,      label: 'Status Update',   color: 'text-primary', bg: 'bg-primary/10' },
  alert:            { icon: Bell,          label: 'Alert',           color: 'text-purple-400', bg: 'bg-purple-500/10' },
}

export default function NotificationsPage() {
  const dispatch      = useAppDispatch()
  const { items: notifications, unreadCount, isLoading } = useAppSelector(s => s.notifications)
  const user = useAppSelector(s => s.auth.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotificationsThunk(user.id))
    }
  }, [user?.id, dispatch])

  const unread = notifications.filter(n => !n.is_read)
  const read   = notifications.filter(n => n.is_read)

  const handleRead = (n: Notification) => {
    dispatch(markReadThunk(n.id))
    if (n.incident_id) {
      navigate(`/dashboard/incidents/${n.incident_id}`)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={() => dispatch(markAllRead())}>
            <CheckCheck size={13} /> Mark all read
          </Button>
        </div>
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium px-1">Unread</p>
          <AnimatePresence>
            {unread.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.05 }}
              >
                <NotificationRow 
                  n={n} 
                  onRead={() => handleRead(n)} 
                  onMarkRead={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    dispatch(markReadThunk(n.id))
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium px-1">Earlier</p>
          {read.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 + 0.2 }}
            >
              <NotificationRow 
                n={n} 
                onRead={() => handleRead(n)} 
                onMarkRead={(e) => {
                  e.stopPropagation()
                  dispatch(markReadThunk(n.id))
                }} 
              />
            </motion.div>
          ))}
        </div>
      )}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center">
            <Bell size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No notifications yet</p>
          <p className="text-xs text-slate-400">You'll be notified about incidents, mentions, and assignments here.</p>
        </div>
      )}
    </div>
  )
}

function NotificationRow({ n, onRead, onMarkRead }: { n: Notification; onRead: () => void; onMarkRead: (e: React.MouseEvent) => void }) {
  const cfg = TYPE_CONFIG[n.type]
  const Icon = cfg.icon

  return (
    <div
      onClick={onRead}
      className={cn(
        'group w-full flex items-start gap-3 p-4 rounded-xl border text-left cursor-pointer transition-all',
        n.is_read
          ? 'border-slate-200 bg-white hover:bg-slate-50 opacity-60 hover:opacity-80'
          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200'
      )}
    >
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-800 leading-tight">{n.title}</p>
          <span className="text-[11px] text-slate-500 shrink-0 mt-0.5">{formatRelative(n.created_at)}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{n.body}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2.5">
            <Badge variant="neutral">{cfg.label}</Badge>
            {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </div>
          {!n.is_read && (
            <button
              onClick={onMarkRead}
              className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 px-2.5 py-0.5 rounded-md transition-colors"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}