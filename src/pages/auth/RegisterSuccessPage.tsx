// src/pages/auth/RegisterSuccessPage.tsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, RefreshCw, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react'
import { Button } from '@components/common/Button'
import { authApi } from '@features/auth/api/authApi'

export default function RegisterSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const state     = location.state as { email?: string; fromLogin?: boolean } | null
  const email     = state?.email ?? ''
  const fromLogin = state?.fromLogin === true   // ← came from login, email not verified

  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setError(null)
    try {
      await authApi.resendVerification(email)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch {
      setError('Failed to resend. Please try again in a moment.')
    } finally {
      setResending(false)
    }
  }

  // ── copy variants ──────────────────────────────────────────────────────────
  const heading = fromLogin ? 'Email not verified yet' : 'Check your inbox'
  const subtext = fromLogin
    ? 'You need to verify your email before signing in. We can resend the link to'
    : 'We sent a verification link to'
  const steps = fromLogin
    ? [
        { step: '1', text: 'Check your inbox (and spam folder)' },
        { step: '2', text: 'Click the "Verify email" link in the email' },
        { step: '3', text: 'Come back here and sign in' },
      ]
    : [
        { step: '1', text: 'Open the email from NeuralOps' },
        { step: '2', text: 'Click the "Verify email" button' },
        { step: '3', text: "You'll be redirected to sign in" },
      ]

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NeuralOps</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-surface-1 p-8 space-y-6">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                fromLogin
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-neural-500/10 border border-neural-500/20'
              }`}>
                {fromLogin
                  ? <ShieldAlert size={34} className="text-amber-400" />
                  : <Mail      size={34} className="text-neural-400" />
                }
              </div>
              {/* Pulse ring */}
              <div className={`absolute inset-0 rounded-full border animate-ping opacity-30 ${
                fromLogin ? 'border-amber-500/20' : 'border-neural-500/20'
              }`} />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">{heading}</h1>
            <p className="text-sm text-white/50 leading-relaxed">{subtext}</p>
            {email && (
              <p className="text-sm font-semibold text-neural-400 break-all">{email}</p>
            )}
            {!fromLogin && (
              <p className="text-sm text-white/40 leading-relaxed pt-1">
                Click the link in that email to activate your account. The link expires in{' '}
                <span className="text-white/60 font-medium">24 hours</span>.
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-white/8 bg-surface-2 p-4 space-y-3">
            {steps.map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-neural-500/15 border border-neural-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-neural-400">{step}</span>
                </div>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>

          {/* Resent success */}
          {resent && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-neural-500/20 bg-neural-500/8 px-4 py-3"
            >
              <CheckCircle size={14} className="text-neural-400 shrink-0" />
              <p className="text-sm text-neural-400">Verification email resent!</p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-1">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleResend}
              isLoading={resending}
              disabled={!email || resent}
            >
              <RefreshCw size={13} />
              {resent ? 'Email sent!' : 'Resend verification email'}
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2 text-white/40 hover:text-white/70"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={13} />
              Back to sign in
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/25 leading-relaxed">
          Didn't receive it? Check your spam folder. If it's still not there,
          use the resend button above.
        </p>
      </motion.div>
    </div>
  )
}