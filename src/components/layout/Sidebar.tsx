import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, AlertTriangle, BarChart2, Bell,
  Settings, Users, ChevronLeft, ChevronRight,
  Zap, LogOut, BookOpen, Shield,
} from 'lucide-react'
// import {cn} from '@utils/cn'
import { cn } from '@utils/cn'
import { useAppDispatch, useAppSelector } from '@store/index'
import { toggleSidebar } from '@store/slices/uiSlice'
import { logoutThunk } from '@store/slices/authSlice'
import { getInitials } from '@utils/cn'

const navItems = [
  { to: '/dashboard',             icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/incidents',   icon: AlertTriangle,   label: 'Incidents' },
  { to: '/dashboard/analytics',   icon: BarChart2,       label: 'Analytics' },
  { to: '/dashboard/notifications', icon: Bell,          label: 'Notifications' },
]

const settingsItems = [
  { to: '/dashboard/settings/alert-rules', icon: Shield,   label: 'Alert Rules' },
  { to: '/dashboard/settings/playbooks',   icon: BookOpen, label: 'Playbooks' },
  { to: '/dashboard/settings/team',        icon: Users,    label: 'Team' },
  { to: '/dashboard/settings',             icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const dispatch   = useAppDispatch()
  const navigate   = useNavigate()
  const collapsed  = useAppSelector(s => s.ui.sidebarCollapsed)
  const user       = useAppSelector(s => s.auth.user)
  const tenant     = useAppSelector(s => s.auth.tenant)
  const unread     = useAppSelector(s => s.notifications.unreadCount)

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-surface-1 border-r border-white/8 shrink-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-14 px-4 border-b border-white/8 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-neural-500 flex items-center justify-center shrink-0 shadow-lg shadow-neural-500/30">
          <Zap size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-bold text-white tracking-tight whitespace-nowrap"
            >
              NeuralOps
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Tenant badge */}
      <AnimatePresence>
        {!collapsed && tenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 px-3 py-2 rounded-md bg-surface-2 border border-white/8"
          >
            <p className="text-xs font-medium text-white/80 truncate">{tenant.name}</p>
            <p className={cn(
              'text-[10px] font-medium mt-0.5',
              tenant.plan_tier === 'enterprise' ? 'text-neural-400' :
              tenant.plan_tier === 'pro'        ? 'text-amber-400'  : 'text-white/40'
            )}>
              {tenant.plan_tier.toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        <NavSection label="Main" collapsed={collapsed}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <SidebarItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed}
              badge={label === 'Notifications' && unread > 0 ? unread : undefined}
            />
          ))}
        </NavSection>
        <div className="my-3 h-px bg-white/8" />
        <NavSection label="Config" collapsed={collapsed}>
          {settingsItems.map(({ to, icon: Icon, label }) => (
            <SidebarItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
          ))}
        </NavSection>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/8 p-3 shrink-0">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="h-7 w-7 rounded-full bg-neural-500/20 border border-neural-500/30 flex items-center justify-center text-xs font-semibold text-neural-400 shrink-0">
            {user ? getInitials(user.full_name) : '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-white/80 truncate">{user?.full_name}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="text-white/30 hover:text-white/70 transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="absolute top-4 -right-3 h-6 w-6 rounded-full bg-surface-3 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/90 hover:bg-surface-4 transition-all z-30"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}

function NavSection({ label, collapsed, children }: {
  label: string; collapsed: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <AnimatePresence>
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-2 pb-1 text-[10px] uppercase tracking-widest text-white/30 font-medium"
          >
            {label}
          </motion.p>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}

function SidebarItem({ to, icon: Icon, label, collapsed, badge }: {
  to: string; icon: React.ElementType; label: string; collapsed: boolean; badge?: number
}) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) => cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-150 relative group',
        isActive
          ? 'bg-neural-500/10 text-neural-400 font-medium'
          : 'text-white/50 hover:bg-white/5 hover:text-white/80',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon size={15} className="shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="whitespace-nowrap flex-1"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {badge !== undefined && (
        <span className={cn(
          'flex items-center justify-center text-[10px] font-bold rounded-full bg-neural-500 text-white min-w-[16px] h-4 px-1',
          collapsed ? 'absolute -top-0.5 -right-0.5' : ''
        )}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-surface-3 border border-white/10 text-xs text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {label}
        </div>
      )}
    </NavLink>
  )
}