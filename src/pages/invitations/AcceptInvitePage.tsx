import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Zap, User, Lock, CheckCircle, AlertTriangle, Loader2, GitBranch } from 'lucide-react'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Badge } from '@components/common/Badge'
import { invitationsApi } from '@features/invitations/api/invitationsApi'
import { authApi } from '@features/auth/api/authApi'
import { useAppDispatch } from '@store/index'
import { setAuthFromOAuth } from '@store/slices/authSlice'
import { tokenStorage, userStorage } from '@utils/token'
import type { ValidatedInvitation, JoinPayload } from '@/types'

const schema = z.object({
  first_name:       z.string().min(1, 'First name required'),
  last_name:        z.string().min(1, 'Last name required'),
  password:         z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Uppercase required').regex(/[0-9]/, 'Number required'),
  password_confirm: z.string(),
}).refine(d => d.password === d.password_confirm, { message: 'Passwords do not match', path: ['password_confirm'] })

type FormData = Omit<JoinPayload, 'invite_token' | 'new_password_confirm'> & { password_confirm: string }

type PageState = 'loading' | 'valid' | 'invalid' | 'joined'

export default function AcceptInvitePage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const dispatch        = useAppDispatch()
  const token           = searchParams.get('token') ?? ''
  const [pageState, setPageState]           = useState<PageState>('loading')
  const [invitation, setInvitation]         = useState<ValidatedInvitation | null>(null)
  const [joining, setJoining]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) { setPageState('invalid'); return }
    invitationsApi.validate(token)
      .then(res => {
        if (res.data) { setInvitation(res.data); setPageState('valid') }
        else setPageState('invalid')
      })
      .catch(() => setPageState('invalid'))
  }, [token])

  const onJoin = async (data: FormData) => {
    if (!invitation) return
    setJoining(true); setError(null)
    try {
      const res = await invitationsApi.join({
        invite_token:    token,
        first_name:      data.first_name,
        last_name:       data.last_name,
        password:        data.password,
        password_confirm: data.password_confirm,
      })
      // If the backend returns tokens on join, log in immediately
      if (res.access_token && res.refresh_token && res.data) {
        const tokens = { access_token: res.access_token, refresh_token: res.refresh_token, token_type: 'bearer' as const }
        tokenStorage.setTokens(tokens)
        setPageState('joined')
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        setPageState('joined')
        setTimeout(() => navigate('/login'), 2500)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Failed to join. Please try again.')
    } finally { setJoining(false) }
  }

  const handleOAuth = (provider: 'google' | 'github') => {
    // Store invite token in sessionStorage before redirecting
    sessionStorage.setItem('invite_token', token)
    const redirectUri = `${window.location.origin}/auth/${provider}/callback`
    const clientId    = provider === 'google'
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID
      : import.meta.env.VITE_GITHUB_CLIENT_ID
    const oauthUrl = provider === 'google'
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile`
      : `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`
    window.location.href = oauthUrl
  }

  // ── Render states ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NeuralOps</span>
        </div>

        {pageState === 'loading' && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 size={28} className="text-neural-400 animate-spin" />
            <p className="text-sm text-white/40">Validating invitation…</p>
          </div>
        )}

        {pageState === 'invalid' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-12">
            <div className="h-14 w-14 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Invalid invitation</p>
              <p className="text-sm text-white/40 mt-1">This link is invalid, expired, or has already been used.</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">Go to sign in</Button>
            </Link>
          </motion.div>
        )}

        {pageState === 'joined' && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-12">
            <div className="h-14 w-14 mx-auto rounded-full bg-neural-500/10 border border-neural-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-neural-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Welcome aboard!</p>
              <p className="text-sm text-white/40 mt-1">You've joined {invitation?.tenant.name}. Redirecting…</p>
            </div>
          </motion.div>
        )}

        {pageState === 'valid' && invitation && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Invitation card */}
            <div className="rounded-xl border border-neural-500/20 bg-neural-500/5 p-4 space-y-1">
              <p className="text-xs text-neural-400 font-medium uppercase tracking-widest">You're invited to join</p>
              <p className="text-lg font-bold text-white">{invitation.tenant.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/50">As</span>
                <Badge variant="info">{invitation.role}</Badge>
                <span className="text-xs text-white/30">· {invitation.email}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <form onSubmit={handleSubmit(onJoin)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" placeholder="Jane" error={errors.first_name?.message} {...register('first_name')} />
                <Input label="Last Name"  placeholder="Smith" error={errors.last_name?.message}  {...register('last_name')} />
              </div>
              <Input label="Password" type="password" placeholder="••••••••" leftIcon={<Lock size={14}/>}
                hint="Min 8 chars, one uppercase, one number"
                error={errors.password?.message} {...register('password')} />
              <Input label="Confirm Password" type="password" placeholder="••••••••" leftIcon={<Lock size={14}/>}
                error={errors.password_confirm?.message} {...register('password_confirm')} />
              <Button type="submit" className="w-full" isLoading={joining}>
                Create account & join
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
              <div className="relative flex justify-center"><span className="bg-surface-0 px-3 text-xs text-white/30">or join with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" type="button" className="gap-2 text-xs" onClick={() => handleOAuth('google')}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" type="button" className="gap-2 text-xs" onClick={() => handleOAuth('github')}>
                <GitBranch size={14} /> GitHub
              </Button>
            </div>

            <p className="text-center text-xs text-white/30">
              Already have an account?{' '}
              <Link to="/login" className="text-neural-400 hover:text-neural-300 transition-colors">Sign in</Link>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}