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
import { teamApi } from '@features/team/api/teamApi'
import { useToast } from '@hooks/useProtectedRoute'
import { useRole } from '@hooks/useProtectedRoute'
import { getInitials, formatDate, formatRelative, cn } from '@utils/cn'
import type { Invitation, InvitationStatus, UserRole, User } from '@/types'

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role:  z.enum(['engineer', 'admin', 'viewer'] as const),
})
type InviteForm = { email: string; role: 'engineer' | 'admin' | 'viewer' }

const STATUS_ICON: Record<InvitationStatus, React.ElementType> = {
  pending:   Clock,
  accepted:  CheckCircle,
  cancelled: XCircle,
  expired:   XCircle,
}
const STATUS_COLOR: Record<InvitationStatus, string> = {
  pending:   'text-amber-400',
  accepted:  'text-primary',
  cancelled: 'text-red-400',
  expired:   'text-slate-500',
}

export default function TeamPage() {
  const { canManage } = useRole()
  const { toast } = useToast()
  
  const [members, setMembers]         = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  
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

  const loadMembers = () => {
    setLoadingMembers(true)
    teamApi.listMembers()
      .then(res => { if (res.data) setMembers(res.data) })
      .catch(() => toast({ type: 'error', title: 'Failed to load team members' }))
      .finally(() => setLoadingMembers(false))
  }

  useEffect(() => { 
    loadInvitations()
    loadMembers()
  }, [])

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
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} member{members.length !== 1 && 's'} in this workspace</p>
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
          {loadingMembers ? (
            <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-14 rounded-lg"/>)}</div>
          ) : (
            members.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {getInitials(member.full_name || member.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900/85">{member.full_name || 'No Name'}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!member.email_verified && !member.is_email_verified && <Badge variant="warning" dot>Unverified</Badge>}
                  <Badge variant={roleVariant(member.role) as 'warning' | 'info' | 'success' | 'neutral'}>{member.role}</Badge>
                </div>
              </motion.div>
            ))
          )}
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
                <Mail size={24} className="mx-auto text-slate-900/15 mb-2" />
                <p className="text-sm text-slate-500">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invitations.map(inv => {
                  const StatusIcon  = STATUS_ICON[inv.status]
                  const statusColor = STATUS_COLOR[inv.status]
                  return (
                    <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusIcon size={10} className={statusColor} />
                          <span className={cn('text-xs', statusColor)}>{inv.status}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">expires {formatRelative(inv.expires_at)}</span>
                        </div>
                      </div>
                      <Badge variant="neutral">{inv.role}</Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-700"
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
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Role</label>
            <select
              {...register('role')}
              className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="engineer">Engineer - Can view and interact with incidents</option>
              <option value="admin">Admin - All permissions except billing</option>
              <option value="viewer">Viewer - Read-only access</option>
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
