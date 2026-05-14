import { Bell, Search, Command } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@store/index'
import { getInitials } from '@utils/cn'
import { cn } from '@utils/cn'

export function Topbar() {
  const user    = useAppSelector(s => s.auth.user)
  const unread  = useAppSelector(s => s.notifications.unreadCount)

  return (
    <header className="h-14 border-b border-white/8 bg-surface-1/80 backdrop-blur-md flex items-center gap-4 px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="flex items-center gap-2 w-full rounded-lg border border-white/10 bg-surface-2 px-3 py-1.5 text-sm text-white/40 cursor-pointer hover:border-white/20 hover:text-white/60 transition-all">
          <Search size={13} />
          <span className="flex-1 text-xs">Search incidents…</span>
          <span className="flex items-center gap-1 text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">
            <Command size={10} />K
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <Link
          to="/dashboard/notifications"
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-neural-500 text-[9px] font-bold text-white flex items-center justify-center px-1'
            )}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link to="/dashboard/settings" className="flex items-center gap-2 group">
          <div className="h-7 w-7 rounded-full bg-neural-500/20 border border-neural-500/30 flex items-center justify-center text-xs font-semibold text-neural-400 group-hover:border-neural-500/60 transition-all">
            {user ? getInitials(user.full_name) : '?'}
          </div>
        </Link>
      </div>
    </header>
  )
}