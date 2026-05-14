import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@store/index'
import { removeToast } from '@store/slices/uiSlice'
import { cn } from '@utils/cn'
import { useEffect } from 'react'
import type { Toast } from '@/types'

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

const colors = {
  success: 'text-neural-400 bg-neural-500/10 border-neural-500/20',
  error:   'text-red-400 bg-red-500/10 border-red-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  info:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch()
  const Icon = icons[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dispatch])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-2xl shadow-black/40 min-w-[300px] max-w-sm',
        'bg-surface-2',
        colors[toast.type]
      )}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-white/50 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-white/30 hover:text-white/70 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useAppSelector(s => s.ui.toasts)

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
        </AnimatePresence>
      </div>
    </div>
  )
}