import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@store/index'

import { cn } from '@utils/cn'
import { Avatar } from '@components/common/Avatar'

export function Topbar() {
  const user    = useAppSelector(s => s.auth.user)
  const unread  = useAppSelector(s => s.notifications.unreadCount)

  return (
    <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center gap-4 px-6 shrink-0">
      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <Link
          to="/dashboard/notifications"
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-primary text-[9px] font-bold text-slate-900 flex items-center justify-center px-1'
            )}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link to="/dashboard/profile" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
          <Avatar user={user} size="md" />
        </Link>
      </div>
    </header>
  )
}