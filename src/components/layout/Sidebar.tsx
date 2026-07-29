import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, AlertCircle, MessageSquare,
  Settings, BarChart2, Users, CreditCard,
  ChevronLeft, ChevronRight, Zap, LogOut, Terminal
} from 'lucide-react'
import { cn } from '@utils/cn'
import { useAppDispatch, useAppSelector } from '@store/index'
import { toggleSidebar } from '@store/slices/uiSlice'
import { logoutThunk } from '@store/slices/authSlice'

const navItems = [
  { to: '/dashboard',               icon: Home,          label: 'Overview' },
  { to: '/dashboard/incidents',     icon: AlertCircle,   label: 'Incidents' },
  { to: '/dashboard/logs',          icon: Terminal,      label: 'Log Explorer' },
  { to: '/dashboard/configuration', icon: Settings,      label: 'Configuration' },
  { to: '/dashboard/analytics',     icon: BarChart2,     label: 'Analytics' },
  { to: '/dashboard/team',          icon: Users,         label: 'Team Management' },
  { to: '/dashboard/settings',      icon: Settings,      label: 'Settings' },
  { to: '/dashboard/billing',       icon: CreditCard,    label: 'Billing' },
]

export function Sidebar() {
  const dispatch   = useAppDispatch()
  const navigate   = useNavigate()
  const collapsed  = useAppSelector(s => s.ui.sidebarCollapsed)
  const user       = useAppSelector(s => s.auth.user)

  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Billing') {
      return user && ['owner', 'admin'].includes(user.role)
    }
    return true
  })

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-card border-r border-border shrink-0 overflow-hidden z-20"
    >
      {/* Logo / Interactive Toggle Header */}
      <div
        onClick={() => collapsed && dispatch(toggleSidebar())}
        className={cn(
          "flex items-center justify-between h-16 pl-6 pr-4 border-b border-transparent shrink-0 select-none",
          collapsed && "cursor-pointer hover:bg-muted justify-center px-0 relative group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-full overflow-hidden shrink-0 transition-all duration-300 flex items-center justify-center bg-transparent",
            collapsed && "group-hover:scale-0 opacity-100 group-hover:opacity-0"
          )}>
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="h-full w-full object-cover scale-[1.15]" 
            />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground tracking-tight whitespace-nowrap">
              NeuralOps
            </span>
          )}
        </div>

        {/* Toggle Button for Expanded State */}
        {!collapsed && (
          <button
            onClick={(e) => { e.stopPropagation(); dispatch(toggleSidebar()) }}
            className="h-7 w-7 rounded-lg bg-background border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-sm"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Expand Indicator for Collapsed State on Hover */}
        {collapsed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ChevronRight size={16} className="text-indigo-600" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        <div className="flex-1 space-y-1">
          {filteredNavItems.map(({ to, icon: Icon, label }) => (
            <SidebarItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
          ))}
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 relative group overflow-hidden',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut size={18} className="shrink-0 text-slate-400 group-hover:text-slate-600" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap flex-1 text-left"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </nav>
    </motion.aside>
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
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 relative group overflow-hidden',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div 
              layoutId="active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-[3px] bg-[#4F46E5] rounded-r-full" 
            />
          )}
          <Icon 
            size={18} 
            className={cn("shrink-0", isActive ? "text-[#4F46E5]" : "text-slate-400 group-hover:text-slate-600")} 
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap flex-1"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {badge !== undefined && (
            <span className={cn(
              'flex items-center justify-center text-[10px] font-bold rounded-full bg-indigo-600 text-white min-w-[16px] h-4 px-1',
              collapsed ? 'absolute -top-0.5 -right-0.5' : ''
            )}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}