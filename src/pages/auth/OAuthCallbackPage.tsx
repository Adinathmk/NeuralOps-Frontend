import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@components/common/Button'

type State = 'loading' | 'success' | 'mfa' | 'error'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const { provider }    = useParams<{ provider: 'google' | 'github' }>()
  const { googleOAuth, githubOAuth } = useAuth()

  const [state, setState]   = useState<State>('loading')
  const [errMsg, setErrMsg] = useState<string>('')

  useEffect(() => {
    const code        = searchParams.get('code')
    const inviteToken = sessionStorage.getItem('invite_token') ?? undefined

    if (!code || !provider) {
      setState('error')
      setErrMsg('Missing OAuth code or provider. Please try again.')
      return
    }

    ;(async () => {
      try {
        const result = provider === 'google'
          ? await googleOAuth(code, inviteToken)
          : provider === 'github'
            ? await githubOAuth(code, inviteToken)
            : (() => { throw new Error('Unknown provider') })()

        sessionStorage.removeItem('invite_token')

        if (result.requiresMfa) {
          // MFA required — show shield UI, then redirect to MFA page
          setState('mfa')
          setTimeout(() => navigate('/mfa-verify', { replace: true }), 1200)
        } else {
          // Normal success — redirect to dashboard
          setState('success')
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
        }
      } catch (err: unknown) {
        sessionStorage.removeItem('invite_token')
        setErrMsg(typeof err === 'string' ? err : 'Authentication failed. Please try again.')
        setState('error')
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const providerLabel = provider === 'google' ? 'Google' : 'GitHub'

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
        </div>

        {/* Loading */}
        {state === 'loading' && (
          <div className="space-y-4">
            <Loader2 size={32} className="mx-auto text-neural-400 animate-spin" />
            <div>
              <p className="text-white font-semibold">Signing you in with {providerLabel}…</p>
              <p className="text-sm text-white/40 mt-1">Just a moment while we verify your account.</p>
            </div>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="h-14 w-14 rounded-full bg-neural-500/10 border border-neural-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-neural-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Signed in!</p>
              <p className="text-sm text-white/40 mt-1">Redirecting to your dashboard…</p>
            </div>
          </motion.div>
        )}

        {/* MFA redirect */}
        {state === 'mfa' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="h-14 w-14 rounded-full bg-neural-500/10 border border-neural-500/20 flex items-center justify-center mx-auto">
              <ShieldCheck size={28} className="text-neural-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Two-factor required</p>
              <p className="text-sm text-white/40 mt-1">Redirecting to verification…</p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Sign-in failed</p>
              <p className="text-sm text-white/40 mt-1 leading-relaxed">{errMsg}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
                Back to sign in
              </Button>

            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}