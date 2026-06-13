import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Zap, ArrowLeft, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { useAuth } from '@hooks/useAuth'
import type { ResetPasswordFormData } from '@/types'

const schema = z.object({
  new_password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  new_password_confirm: z.string(),
}).refine(d => d.new_password === d.new_password_confirm, {
  message: 'Passwords do not match',
  path: ['new_password_confirm'],
})

type FormData = Omit<ResetPasswordFormData, 'token'>

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token') ?? ''
  const [done, setDone]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { setError('Invalid or missing reset token.'); return }
    try {
      setLoading(true); setError(null)
      await resetPassword({ token, ...data })
      setDone(true)
    } catch {
      setError('Reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap size={16} className="text-slate-900" />
          </div>
          <span className="text-slate-900 font-bold text-lg tracking-tight">NeuralOps</span>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Password reset!</p>
                <p className="text-sm text-slate-500 mt-1">You can now sign in with your new password.</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to sign in
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Reset password</h2>
              <p className="text-sm text-slate-500">Choose a strong new password</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">{error}</div>
            )}
            {!token && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-400">
                No reset token found. Please use the link from your email.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.new_password?.message}
                {...register('new_password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.new_password_confirm?.message}
                {...register('new_password_confirm')}
              />
              <Button type="submit" className="w-full" isLoading={loading} disabled={!token}>
                Reset password
              </Button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft size={12} /> Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}