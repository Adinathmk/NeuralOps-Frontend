// src/pages/dashboard/settings/SettingsPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { User, Lock, Monitor, Bell, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@store/index'
import { authApi } from '@features/auth/api/authApi'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Badge } from '@components/common/Badge'
import { MFASection } from '@features/settings/components/MFASection'
import { useToast } from '@hooks/useProtectedRoute'
import { getInitials } from '@utils/cn'
import type { ChangePasswordFormData } from '@/types'

const passwordSchema = z.object({
  current_password:     z.string().min(1, 'Required'),
  new_password:         z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Uppercase required')
    .regex(/[0-9]/, 'Number required'),
  new_password_confirm: z.string(),
}).refine(d => d.new_password === d.new_password_confirm, {
  message: 'Passwords do not match',
  path: ['new_password_confirm'],
})

type PwFormData = ChangePasswordFormData & { new_password_confirm: string }

const SETTING_LINKS = [
  { to: '/dashboard/sessions',              icon: Monitor, label: 'Active Sessions',  desc: 'View and revoke sessions on other devices' },
  { to: '/dashboard/settings/team',         icon: User,    label: 'Team Members',     desc: 'Manage your workspace users and roles' },
  { to: '/dashboard/settings/alert-rules',  icon: Bell,    label: 'Alert Rules',      desc: 'Configure incident notification thresholds' },
]

export default function SettingsPage() {
  const user   = useAppSelector(s => s.auth.user)
  const tenant = useAppSelector(s => s.auth.tenant)
  const { toast } = useToast()
  const [pwLoading, setPwLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onChangePassword = async (data: PwFormData) => {
    setPwLoading(true)
    try {
      await authApi.changePassword({
        current_password:     data.current_password,
        new_password:         data.new_password,
        new_password_confirm: data.new_password_confirm,
      })
      toast({ type: 'success', title: 'Password changed', description: 'Please log in again on other devices.' })
      reset()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast({ type: 'error', title: e.response?.data?.message ?? 'Failed to change password' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-0.5">Manage your account and workspace preferences.</p>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-neural-500/20 border-2 border-neural-500/30 flex items-center justify-center text-lg font-bold text-neural-400">
                {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : '?'}
              </div>
              <div>
                <p className="font-semibold text-white">{user?.full_name || `${user?.first_name} ${user?.last_name}`}</p>
                <p className="text-sm text-white/50">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="neutral">{user?.role}</Badge>
                  {user?.is_email_verified
                    ? <Badge variant="success" dot>Verified</Badge>
                    : <Badge variant="warning" dot>Unverified</Badge>
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workspace */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Workspace', value: tenant?.name       ?? '—' },
                { label: 'Plan',      value: tenant?.plan_tier?.toUpperCase() ?? '—' },
                { label: 'Slug',      value: tenant?.slug       ?? '—' },
                { label: 'Status',    value: tenant?.status     ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-white/30 mb-0.5">{label}</p>
                  <p className="text-sm text-white/80 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-white/50" />
              <CardTitle>Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={errors.current_password?.message}
                {...register('current_password')}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                hint="Min 8 chars, one uppercase, one number"
                error={errors.new_password?.message}
                {...register('new_password')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errors.new_password_confirm?.message}
                {...register('new_password_confirm')}
              />
              <Button type="submit" isLoading={pwLoading} className="w-full sm:w-auto">
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── MFA Section ── dropped in here */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <MFASection />
      </motion.div>

      {/* Quick links */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle>More Settings</CardTitle></CardHeader>
          <CardContent className="space-y-1 pt-0">
            {SETTING_LINKS.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all group"
              >
                <div className="h-8 w-8 rounded-md bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/8 transition-colors">
                  <Icon size={14} className="text-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80">{label}</p>
                  <p className="text-xs text-white/40">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}