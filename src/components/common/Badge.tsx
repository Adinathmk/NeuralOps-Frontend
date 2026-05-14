import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default:    'bg-neural-500/10 text-neural-400 ring-neural-500/20',
        critical:   'bg-red-500/10     text-red-400     ring-red-500/20',
        warning:    'bg-amber-500/10   text-amber-400   ring-amber-500/20',
        info:       'bg-blue-500/10    text-blue-400    ring-blue-500/20',
        success:    'bg-neural-500/10  text-neural-400  ring-neural-500/20',
        neutral:    'bg-white/5        text-white/60    ring-white/10',
        outline:    'border border-white/10 text-white/70 ring-0 bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'critical' ? 'bg-red-400'    :
          variant === 'warning'  ? 'bg-amber-400'  :
          variant === 'info'     ? 'bg-blue-400'   :
          variant === 'success'  ? 'bg-neural-400' :
          'bg-current'
        )} />
      )}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }