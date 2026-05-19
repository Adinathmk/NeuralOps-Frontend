import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Zap } from 'lucide-react'
import { Button } from '@components/common/Button'
import { useAuth } from '@hooks/useAuth'

type State = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token') ?? ''
  const [state, setState]  = useState<State>('loading')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) { setState('error'); return }
    verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  const resend = async () => {
    try {
      setResending(true)
      await resendVerification(searchParams.get('email') || '')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
        </div>

        {state === 'loading' && (
          <div className="space-y-3">
            <Loader2 size={32} className="mx-auto text-neural-400 animate-spin" />
            <p className="text-white/60 text-sm">Verifying your email…</p>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-neural-500/10 border border-neural-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-neural-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Email verified!</p>
              <p className="text-sm text-white/40 mt-1">Your account is ready. Let's get started.</p>
            </div>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>Go to login</Button>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Verification failed</p>
              <p className="text-sm text-white/40 mt-1">This link is invalid or has expired.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={resend} isLoading={resending}>
              Resend verification email
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
              Back to sign in
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}