import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Building2, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@hooks/useAuth'
import { useRedirectIfAuthenticated } from '@hooks/useProtectedRoute'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import type { RegisterFormData } from '@/types'

const schema = z.object({
  first_name:      z.string().min(2, 'First name is required'),
  last_name:       z.string().min(2, 'Last name is required'),
  email:           z.string().email('Invalid email address'),
  tenant_name:     z.string().min(2, 'Workspace name is required'),
  password:        z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  password_confirm: z.string(),
}).refine(d => d.password === d.password_confirm, {
  message: 'Passwords do not match',
  path:    ['password_confirm'],
})

export default function RegisterPage() {
  useRedirectIfAuthenticated()
  const { register: registerUser, isLoading, error } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: RegisterFormData) => registerUser(data)

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NeuralOps</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">Create your workspace</h2>
          <p className="text-sm text-white/40">Set up NeuralOps for your engineering team</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <Input
                label="First Name"
                type="text"
                placeholder="Jane"
                leftIcon={<User size={14} />}
                error={errors.first_name?.message}
                {...register('first_name')}
              />
            </div>
            <div className="col-span-1">
              <Input
                label="Last Name"
                type="text"
                placeholder="Smith"
                leftIcon={<User size={14} />}
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Work Email"
                type="email"
                placeholder="jane@company.com"
                leftIcon={<Mail size={14} />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Workspace Name"
                type="text"
                placeholder="Acme Engineering"
                leftIcon={<Building2 size={14} />}
                hint="This becomes your team's NeuralOps workspace"
                error={errors.tenant_name?.message}
                {...register('tenant_name')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.password_confirm?.message}
                {...register('password_confirm')}
              />
            </div>
          </div>

          <p className="text-[11px] text-white/30 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-neural-400 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-neural-400 hover:underline">Privacy Policy</a>.
          </p>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create workspace
          </Button>
        </form>

        <p className="text-center text-xs text-white/40">
          Already have an account?{' '}
          <Link to="/login" className="text-neural-400 hover:text-neural-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}