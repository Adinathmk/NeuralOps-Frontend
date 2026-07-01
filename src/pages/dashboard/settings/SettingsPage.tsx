import { motion } from 'framer-motion'
import { Monitor, ChevronRight, GitBranch, Key } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@store/index'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { MFASection } from '@features/settings/components/MFASection'

const SETTING_LINKS = [
  { to: '/dashboard/sessions',              icon: Monitor, label: 'Active Sessions',  desc: 'View and revoke sessions on other devices' },
  { to: '/dashboard/settings/github',       icon: GitBranch,  label: 'GitHub Integration', desc: 'Connect repo for AST-driven code retrieval' },
  { to: '/dashboard/settings/api-keys',     icon: Key,        label: 'API Keys',         desc: 'Manage keys for authenticating SDK requests' },
]

export default function SettingsPage() {
  const tenant = useAppSelector(s => s.auth.tenant)

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your workspace preferences and integrations.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="overflow-hidden border-0 shadow-lg shadow-indigo-500/5 ring-1 ring-slate-200/50">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-6 py-5 border-b border-indigo-100/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/20 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-white">{tenant?.name?.charAt(0).toUpperCase() || 'W'}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{tenant?.name}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Workspace details and active subscription</p>
              </div>
            </div>
            <Badge variant={tenant?.status === 'active' ? 'success' : 'warning'} className="capitalize px-3 py-1 text-xs">
              {tenant?.status || 'Active'}
            </Badge>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Workspace ID</p>
                <div>
                   <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{tenant?.id || '—'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Plan</p>
                <div>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide bg-indigo-100/50 px-2.5 py-1 rounded-md">{tenant?.plan_tier || 'FREE'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Created At</p>
                <p className="text-sm text-slate-700 font-medium">{tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── MFA Section ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <MFASection />
      </motion.div>

      {/* Quick links */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader><CardTitle>More Settings</CardTitle></CardHeader>
          <CardContent className="space-y-1 pt-0">
            {SETTING_LINKS.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-all group"
              >
                <div className="h-8 w-8 rounded-md bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Icon size={14} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}