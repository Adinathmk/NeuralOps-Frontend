import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { UserPlus, Mail, RefreshCw, X, Clock, CheckCircle, XCircle, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Badge } from '@components/common/Badge'
import { Modal } from '@components/common/Modal'
import { Skeleton } from '@components/common/Skeleton'
import { invitationsApi } from '@features/invitations/api/invitationsApi'
import { useToast } from '@hooks/useProtectedRoute'
import { useRole } from '@hooks/useProtectedRoute'
import { getInitials, formatDate, formatRelative, cn } from '@utils/cn'
import type { Invitation, InvitationStatus, UserRole } from '@/types'

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role:  z.enum(['engineer', 'admin', 'viewer'] as const),
})
type InviteForm = { email: string; role: 'engineer' | 'admin' | 'viewer' }

// Mock current team members
const MOCK_MEMBERS = [
  { id: 'u1', full_name: 'Jane Smith',  email: 'jane@co.com',  role: 'owner'    as UserRole, is_email_verified: true,  created_at: '' },
  { id: 'u2', full_name: 'Alice Chen',  email: 'alice@co.com', role: 'engineer' as UserRole, is_email_verified: true,  created_at: '' },
  { id: 'u3', full_name: 'Bob Torres',  email: 'bob@co.com',   role: 'admin'    as UserRole, is_email_verified: true,  created_at: '' },
  { id: 'u4', full_name: 'Carol Singh', email: 'carol@co.com', role: 'viewer'   as UserRole, is_email_verified: false, created_at: '' },
]

const STATUS_ICON: Record<InvitationStatus, React.ElementType> = {
  pending:   Clock,
  accepted:  CheckCircle,
  cancelled: XCircle,
  expired:   XCircle,
}
const STATUS_COLOR: Record<InvitationStatus, string> = {
  pending:   'text-amber-400',
  accepted:  'text-neural-400',
  cancelled: 'text-red-400',
  expired:   'text-white/30',
}

export default function TeamPage() {
  const { canManage } = useRole()
  const { toast } = useToast()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInv, setLoadingInv]   = useState(false)
  const [inviteOpen, setInviteOpen]   = useState(false)
  const [sending, setSending]         = useState(false)
  const [actionId, setActionId]       = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'engineer' },
  })

  const loadInvitations = () => {
    setLoadingInv(true)
    invitationsApi.list('pending')
      .then(res => { if (res.data) setInvitations(res.data) })
      .catch(() => {})
      .finally(() => setLoadingInv(false))
  }

  useEffect(() => { loadInvitations() }, [])

  const onInvite = async (data: InviteForm) => {
    setSending(true)
    try {
      await invitationsApi.send(data)
      toast({ type: 'success', title: 'Invitation sent', description: `${data.email} will receive an email shortly.` })
      setInviteOpen(false); reset(); loadInvitations()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast({ type: 'error', title: e.response?.data?.message ?? 'Failed to send invitation' })
    } finally { setSending(false) }
  }

  const onCancel = async (id: string) => {
    setActionId(id)
    try {
      await invitationsApi.cancel(id)
      toast({ type: 'success', title: 'Invitation cancelled' })
      loadInvitations()
    } catch { toast({ type: 'error', title: 'Failed to cancel' }) }
    finally { setActionId(null) }
  }

  const onResend = async (id: string) => {
    setActionId(id)
    try {
      await invitationsApi.resend(id)
      toast({ type: 'success', title: 'Invitation resent' })
    } catch { toast({ type: 'error', title: 'Failed to resend' }) }
    finally { setActionId(null) }
  }

  const roleVariant = (role: UserRole) =>
    role === 'owner' ? 'warning' : role === 'admin' ? 'info' : role === 'engineer' ? 'success' : 'neutral'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Team</h1>
          <p className="text-sm text-white/40 mt-0.5">{MOCK_MEMBERS.length} members in this workspace</p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus size={13} /> Invite member
          </Button>
        )}
      </div>

      {/* Members */}
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent className="space-y-1 pt-0">
          {MOCK_MEMBERS.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/4 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-neural-500/15 border border-neural-500/20 flex items-center justify-center text-xs font-semibold text-neural-400 shrink-0">
                {getInitials(member.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">{member.full_name}</p>
                <p className="text-xs text-white/40">{member.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!member.is_email_verified && <Badge variant="warning" dot>Unverified</Badge>}
                <Badge variant={roleVariant(member.role) as 'warning' | 'info' | 'success' | 'neutral'}>{member.role}</Badge>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {canManage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Invitations</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadInvitations}>
                <RefreshCw size={12} className={cn(loadingInv && 'animate-spin')} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingInv ? (
              <div className="space-y-2">{[1,2].map(i=><Skeleton key={i} className="h-14 rounded-lg"/>)}</div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail size={24} className="mx-auto text-white/15 mb-2" />
                <p className="text-sm text-white/30">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invitations.map(inv => {
                  const StatusIcon  = STATUS_ICON[inv.status]
                  const statusColor = STATUS_COLOR[inv.status]
                  return (
                    <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/8 bg-surface-2">
                      <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-semibold text-white/50 shrink-0">
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusIcon size={10} className={statusColor} />
                          <span className={cn('text-xs', statusColor)}>{inv.status}</span>
                          <span className="text-xs text-white/25">Â·</span>
                          <span className="text-xs text-white/30">expires {formatRelative(inv.expires_at)}</span>
                        </div>
                      </div>
                      <Badge variant="neutral">{inv.role}</Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white/70"
                          title="Resend" isLoading={actionId === inv.id}
                          onClick={() => onResend(inv.id)}
                        >
                          <Send size={12} />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400"
                          title="Cancel" isLoading={actionId === inv.id}
                          onClick={() => onCancel(inv.id)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); reset() }} title="Invite team member" description="They'll receive an email with a signup link." size="sm">
        <form onSubmit={handleSubmit(onInvite)} className="space-y-4 mt-4">
          <Input label="Email address" type="email" placeholder="colleague@company.com" error={errors.email?.message} {...register('email')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Role</label>
            <select
              {...register('role')}
              className="h-9 rounded-md border border-white/10 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:border-neural-500 transition-colors"
            >
              <option value="engineer">Engineer â€” Can view and interact with incidents</option>
              <option value="admin">Admin â€” All permissions except billing</option>
              <option value="viewer">Viewer â€” Read-only access</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" isLoading={sending}>Send invitation</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setInviteOpen(false); reset() }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
