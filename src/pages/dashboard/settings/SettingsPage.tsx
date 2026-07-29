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
        <h1 className="text-xl font-bold text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace preferences and integrations.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="overflow-hidden border-border shadow-sm">
          <div className="bg-primary/5 px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary-foreground">{tenant?.name?.charAt(0).toUpperCase() || 'W'}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{tenant?.name}</h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Workspace details and active subscription</p>
              </div>
            </div>
            <Badge variant={tenant?.status === 'active' ? 'success' : 'warning'} className="capitalize px-3 py-1 text-xs">
              {tenant?.status || 'Active'}
            </Badge>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Workspace ID</p>
                <div>
                   <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-1 rounded-md border border-border">{tenant?.id || '—'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Current Plan</p>
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">{tenant?.plan_tier || 'FREE'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Created At</p>
                <p className="text-sm text-foreground font-medium">{tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
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
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-all group"
              >
                <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-background transition-colors">
                  <Icon size={14} className="text-muted-foreground group-hover:text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}