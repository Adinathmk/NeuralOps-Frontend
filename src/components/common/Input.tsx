import * as React from 'react'
import { cn } from '@utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  hint?:     string
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-600 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-500">{leftIcon}</span>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-500',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-neural-500/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors duration-150',
              leftIcon  && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-severity-critical focus:ring-severity-critical/50',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-500">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-severity-critical">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }