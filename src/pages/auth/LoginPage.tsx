import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock, Zap, GitBranch } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@hooks/useAuth'
import { useRedirectIfAuthenticated } from '@hooks/useProtectedRoute'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import type { LoginFormData } from '@/types'

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function LoginPage() {
  useRedirectIfAuthenticated()
  const { login, isLoading, error } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: LoginFormData) => login(data)

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-surface-1 border-r border-white/8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(34,197,94,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(34,197,94,0.05),transparent_60%)]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NeuralOps</span>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-2">
            <div className="text-neural-400 text-sm font-medium uppercase tracking-widest">
              AI-Powered Incident Intelligence
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Debug production<br />
              <span className="text-neural-400">in under 2 minutes.</span>
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              NeuralOps reads your logs, traces root causes through your codebase, and delivers actionable fixes — before your team even wakes up.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Avg MTTR',    value: '1.8m' },
              { label: 'Accuracy',    value: '94%'  },
              { label: 'Incidents/mo', value: '10k+' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-white/5 border border-white/8 p-3">
                <p className="text-xl font-bold text-neural-400">{value}</p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">© 2024 NeuralOps Inc. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm text-white/40">Sign in to your workspace</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
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
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={14} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-neural-400 hover:text-neural-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-0 px-3 text-xs text-white/30">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="gap-2 text-xs">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button" className="gap-2 text-xs">
              <GitBranch size={14} />
              GitHub
            </Button>
          </div>

          <p className="text-center text-xs text-white/40">
            No account?{' '}
            <Link to="/register" className="text-neural-400 hover:text-neural-300 font-medium transition-colors">
              Create workspace
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}