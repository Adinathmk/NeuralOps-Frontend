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
    <div className="min-h-screen relative flex flex-col bg-background text-foreground overflow-hidden justify-center items-center p-6 transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] sm:blur-[120px] opacity-[0.15] dark:opacity-20 transition-opacity"
          style={{ background: 'radial-gradient(ellipse, #3b82f6, transparent 70%)' }} />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full blur-[80px] sm:blur-[100px] opacity-[0.12] dark:opacity-15 transition-opacity"
          style={{ background: 'radial-gradient(ellipse, #06b6d4, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Glass Container */}
        <div className="rounded-3xl p-6 sm:p-8 border bg-card/80 backdrop-blur-[20px] border-border shadow-xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center border border-blue-500/20 dark:border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))' }}
              >
                <Zap size={16} className="text-primary" />
              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">NeuralOps</span>
            </Link>
            <h2 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">Create workspace</h2>
            <p className="text-muted-foreground text-[13px]">Set up NeuralOps for your engineering team</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive mb-5 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">First Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input 
                    {...register('first_name')}
                    type="text" placeholder="Jane"
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-foreground text-[14px] placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
              </div>

              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input 
                    {...register('last_name')}
                    type="text" placeholder="Smith"
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-foreground text-[14px] placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Work Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input 
                    {...register('email')}
                    type="email" placeholder="jane@company.com"
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-foreground text-[14px] placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Workspace Name</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input 
                    {...register('tenant_name')}
                    type="text" placeholder="Acme Engineering"
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-foreground text-[14px] placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">This becomes your team's NeuralOps workspace</p>
                {errors.tenant_name && <p className="text-xs text-destructive">{errors.tenant_name.message}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input 
                    {...register('password')}
                    type="password" placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-foreground text-[14px] placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input 
                    {...register('password_confirm')}
                    type="password" placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-foreground text-[14px] placeholder-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                {errors.password_confirm && <p className="text-xs text-destructive">{errors.password_confirm.message}</p>}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary hover:text-primary/80 transition-colors">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</a>.
            </p>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-xl font-bold text-white px-5 py-3 mt-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}
            >
              <motion.span
                className="absolute inset-0 -skew-x-12 pointer-events-none opacity-50 dark:opacity-100"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', width: '50%' }}
                animate={{ x: ['-200%', '400%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
              />
              <span className="relative flex items-center justify-center gap-2 text-[14px]">
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create workspace'
                )}
              </span>
            </button>
          </form>

          <p className="text-center text-[12px] text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground font-semibold hover:text-primary transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}