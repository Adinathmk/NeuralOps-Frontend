import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Zap, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { useAuth } from '@hooks/useAuth'
import type { ForgotPasswordFormData } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true)
      setError(null)
      await forgotPassword(data)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
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

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/8 p-5 space-y-2">
              <p className="text-sm font-semibold text-primary">Check your inbox</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                We've sent you a password reset link. It expires in 1 hour.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft size={14} /> Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
              <p className="text-sm text-slate-500">Enter your email and we'll send a reset link</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                leftIcon={<Mail size={14} />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" className="w-full" isLoading={loading}>
                Send reset link
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