import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppSelector } from '@store/index'
import { motion } from 'framer-motion'
import { UserPlus, Mail, RefreshCw, X, Clock, CheckCircle, XCircle, Send, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Badge } from '@components/common/Badge'
import { Modal } from '@components/common/Modal'
import { Skeleton } from '@components/common/Skeleton'
import { Select } from '@components/common/Select'
import { invitationsApi } from '@features/invitations/api/invitationsApi'
import { teamApi } from '@features/team/api/teamApi'
import { useToast } from '@hooks/useProtectedRoute'
import { useRole } from '@hooks/useProtectedRoute'
import { formatDate, formatRelative, cn } from '@utils/cn'
import { Avatar } from '@components/common/Avatar'
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
  const { canManage, isOwner } = useRole()
  const { toast } = useToast()
  const currentUser = useAppSelector(s => s.auth.user)
  
  const [members, setMembers]         = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInv, setLoadingInv]   = useState(false)
  const [inviteOpen, setInviteOpen]   = useState(false)
  const [sending, setSending]         = useState(false)
  const [actionId, setActionId]       = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [changeRoleMember, setChangeRoleMember] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<string>('')

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

  const onRoleChange = async (memberId: string, roleToSet: string) => {
    setUpdatingRoleId(memberId)
    try {
      await teamApi.updateRole(memberId, roleToSet)
      toast({ type: 'success', title: 'Role updated' })
      loadMembers()
      setChangeRoleMember(null)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast({ type: 'error', title: e.response?.data?.message ?? 'Failed to update role' })
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const roleOptions = [
    { value: 'engineer', label: 'Engineer' },
    { value: 'admin', label: 'Admin' },
    { value: 'viewer', label: 'Viewer' },
    ...(isOwner ? [{ value: 'owner', label: 'Owner' }] : [])
  ]

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} member{members.length !== 1 && 's'} in this workspace</p>
        </div>
        {isOwner && (
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
                <Avatar user={member} className="!h-8 !w-8 !text-xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900/85">{member.full_name || 'No Name'}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!member.email_verified && !member.is_email_verified && <Badge variant="warning" dot>Unverified</Badge>}
                  <Badge variant={roleVariant(member.role) as 'warning' | 'info' | 'success' | 'neutral'}>{member.role}</Badge>
                  {canManage && member.id !== currentUser?.id && member.role !== 'owner' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:text-indigo-600 ml-1"
                      onClick={() => { setChangeRoleMember(member); setNewRole(member.role); }}
                      title="Change role"
                    >
                      <Shield size={14} />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {isOwner && (
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
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); reset() }} title="Invite team member" description="They'll receive an email with a magic link to join." size="sm">
        <form onSubmit={handleSubmit(onInvite)} className="space-y-5 mt-4">
          <Input label="Email address" type="email" placeholder="colleague@company.com" error={errors.email?.message} {...register('email')} />
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <div className="space-y-2">
              <label className="relative flex cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors focus:outline-none">
                <input type="radio" value="engineer" {...register('role')} className="sr-only" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-medium text-slate-900">Engineer</span>
                    <span className="mt-0.5 flex items-center text-xs text-slate-500">
                      Can view and interact with all incidents and runbooks.
                    </span>
                  </span>
                </span>
              </label>

              <label className="relative flex cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors focus:outline-none">
                <input type="radio" value="admin" {...register('role')} className="sr-only" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-medium text-slate-900">Admin</span>
                    <span className="mt-0.5 flex items-center text-xs text-slate-500">
                      Full access to all settings, members, and billing.
                    </span>
                  </span>
                </span>
              </label>

              <label className="relative flex cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors focus:outline-none">
                <input type="radio" value="viewer" {...register('role')} className="sr-only" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-medium text-slate-900">Viewer</span>
                    <span className="mt-0.5 flex items-center text-xs text-slate-500">
                      Read-only access to dashboards and incident logs.
                    </span>
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" isLoading={sending}>Send invitation</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setInviteOpen(false); reset() }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal open={!!changeRoleMember} onClose={() => setChangeRoleMember(null)} title="Change Role" description={`Update the role for ${changeRoleMember?.full_name || changeRoleMember?.email}.`} size="sm">
        {changeRoleMember && (
          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select
                value={newRole}
                onChange={setNewRole}
                options={roleOptions}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onRoleChange(changeRoleMember.id, newRole)} 
                isLoading={updatingRoleId === changeRoleMember.id} 
                className="flex-1"
                disabled={newRole === changeRoleMember.role}
              >
                Save changes
              </Button>
              <Button variant="outline" onClick={() => setChangeRoleMember(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
