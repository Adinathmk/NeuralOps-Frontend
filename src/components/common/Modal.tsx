import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@utils/cn'

interface ModalProps {
  open:         boolean
  onClose:      () => void
  title?:       string
  description?: string
  children:     React.ReactNode
  className?:   string
  size?:        'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-2xl',
}

export function Modal({
  open, onClose, title, description, children, className, size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  className={cn(
                    'w-full',
                    sizeMap[size]
                  )}
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1,    y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className={cn(
                    'relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-black/60 p-6',
                    className
                  )}>
                    <button
                      onClick={onClose}
                      className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <X size={16} />
                    </button>

                    {(title || description) && (
                      <div className="mb-5">
                        {title && (
                          <Dialog.Title className="text-base font-semibold text-slate-900">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="mt-1 text-sm text-slate-600">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                    )}

                    {children}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}