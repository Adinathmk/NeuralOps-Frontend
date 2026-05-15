// src/components/auth/BackupCodesModal.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Download, Copy, CheckCheck, X, AlertTriangle } from 'lucide-react'
import { Button } from '@components/common/Button'

interface BackupCodesModalProps {
  isOpen: boolean
  codes: string[]
  onClose: () => void
}

export default function BackupCodesModal({ isOpen, codes, onClose }: BackupCodesModalProps) {
  const [copied, setCopied] = useState(false)

  // ── copy all codes to clipboard ────────────────────────────────────────────
  const handleCopy = async () => {
    const text = codes.join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── download codes as a .txt file ──────────────────────────────────────────
  const handleDownload = () => {
    const content = [
      'NeuralOps – MFA Backup Codes',
      '==============================',
      'Keep these codes in a safe place.',
      'Each code can only be used once.',
      '',
      ...codes,
      '',
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'neuralops-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-1 shadow-2xl shadow-black/40 overflow-hidden">

              {/* Header */}
              <div className="relative flex items-start gap-4 p-6 pb-4">
                <div className="h-11 w-11 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-lg leading-tight">MFA enabled!</h2>
                  <p className="text-sm text-white/40 mt-0.5">Save your backup codes before continuing</p>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Warning banner */}
              <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3.5 py-3">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  These codes are shown <span className="text-amber-300 font-semibold">only once</span>. 
                  Store them somewhere safe — each code can be used once if you lose access to your authenticator app.
                </p>
              </div>

              {/* Codes grid */}
              <div className="mx-6 grid grid-cols-2 gap-2 mb-5">
                {codes.map((code, i) => (
                  <motion.div
                    key={code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface-2 px-3 py-2"
                  >
                    <span className="text-white/20 text-xs font-mono tabular-nums w-4 shrink-0">{i + 1}.</span>
                    <span className="text-white font-mono text-sm tracking-widest">{code}</span>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-6 pb-6">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-white/10 bg-surface-2 hover:bg-surface-3 text-xs text-white/60 hover:text-white/90 transition-all"
                >
                  {copied
                    ? <><CheckCheck size={13} className="text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                    : <><Copy size={13} /><span>Copy all</span></>
                  }
                </button>

                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-white/10 bg-surface-2 hover:bg-surface-3 text-xs text-white/60 hover:text-white/90 transition-all"
                >
                  <Download size={13} />
                  <span>Download .txt</span>
                </button>
              </div>

              {/* Confirm done */}
              <div className="px-6 pb-6">
                <Button className="w-full" onClick={onClose}>
                  I've saved my backup codes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}