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
  { to: '/dashboard/settings/demo',        icon: Zap,      label: 'SDK Demo' },
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
      className="relative flex flex-col h-screen bg-white border-r border-slate-200 shrink-0 overflow-hidden z-20"
    >
      {/* Logo / Interactive Toggle Header */}
      <div
        onClick={() => collapsed && dispatch(toggleSidebar())}
        className={cn(
          "flex items-center justify-between h-14 pl-4 pr-3 border-b border-slate-200 shrink-0 select-none",
          collapsed && "cursor-pointer hover:bg-slate-100 justify-center px-0 relative group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 transition-all duration-300",
            collapsed && "group-hover:scale-0 opacity-100 group-hover:opacity-0"
          )}>
            <Zap size={14} className="text-slate-900" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              NeuralOps
            </span>
          )}
        </div>

        {/* Toggle Button for Expanded State */}
        {!collapsed && (
          <button
            onClick={(e) => { e.stopPropagation(); dispatch(toggleSidebar()) }}
            className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-all shadow-sm shadow-black/10"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={13} />
          </button>
        )}

        {/* Expand Indicator for Collapsed State on Hover */}
        {collapsed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ChevronRight size={16} className="text-primary" />
          </div>
        )}
      </div>

      {/* Tenant badge */}
      <AnimatePresence>
        {!collapsed && tenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 px-3 py-2 rounded-md bg-slate-50 border border-slate-200"
          >
            <p className="text-xs font-medium text-slate-700 truncate">{tenant.name}</p>
            <p className={cn(
              'text-[10px] font-medium mt-0.5',
              tenant.plan_tier === 'enterprise' ? 'text-primary' :
              tenant.plan_tier === 'pro'        ? 'text-amber-400'  : 'text-slate-500'
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
      <div className="border-t border-slate-200 p-3 shrink-0">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
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
                <p className="text-xs font-medium text-slate-700 truncate">{user?.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.role}</p>
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
                className="text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
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
            className="px-2 pb-1 text-[10px] uppercase tracking-widest text-slate-500 font-medium"
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
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-700',
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
          'flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-slate-900 min-w-[16px] h-4 px-1',
          collapsed ? 'absolute -top-0.5 -right-0.5' : ''
        )}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {label}
        </div>
      )}
    </NavLink>
  )
}