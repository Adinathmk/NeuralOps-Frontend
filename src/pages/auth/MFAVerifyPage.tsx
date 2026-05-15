// src/pages/auth/MFAVerifyPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@store/index'
import { mfaVerifyThunk, clearMfa } from '@store/slices/authSlice'
import { Button } from '@components/common/Button'

export default function MFAVerifyPage() {
  const dispatch  = useAppDispatch()
  const navigate  = useNavigate()
  const mfaToken  = useAppSelector(s => s.auth.mfaToken)
  const isLoading = useAppSelector(s => s.auth.isLoading)
  const error     = useAppSelector(s => s.auth.error)

  // 6 individual digit inputs
  const [digits, setDigits]     = useState<string[]>(Array(6).fill(''))
  const [useBackup, setUseBackup] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect away if there's no MFA token (user navigated here directly)
  useEffect(() => {
    if (!mfaToken) navigate('/login', { replace: true })
  }, [mfaToken, navigate])

  // ── digit input handlers ───────────────────────────────────────────────────
  const handleDigit = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...digits]
    next[idx] = val.slice(-1)
    setDigits(next)
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!mfaToken) return
    const code = useBackup ? backupCode.trim() : digits.join('')
    if (!useBackup && code.length !== 6) return

    const result = await dispatch(mfaVerifyThunk({ mfa_token: mfaToken, code }))
    if (mfaVerifyThunk.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleBack = () => {
    dispatch(clearMfa())
    navigate('/login', { replace: true })
  }

  const codeComplete = useBackup ? backupCode.trim().length > 0 : digits.every(d => d !== '')

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neural-500 flex items-center justify-center shadow-lg shadow-neural-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NeuralOps</span>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="h-14 w-14 rounded-full bg-neural-500/10 border border-neural-500/20 flex items-center justify-center">
            <ShieldCheck size={26} className="text-neural-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Two-factor verification</h2>
            <p className="text-sm text-white/40 mt-1">
              {useBackup
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* TOTP digit inputs */}
        {!useBackup ? (
          <div
            className="flex gap-2 justify-center"
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="h-12 w-11 rounded-lg border border-white/10 bg-surface-2 text-center text-lg font-bold text-white focus:outline-none focus:border-neural-500 focus:ring-1 focus:ring-neural-500/40 transition-colors caret-transparent"
              />
            ))}
          </div>
        ) : (
          // Backup code input
          <div className="space-y-2">
            <input
              type="text"
              value={backupCode}
              onChange={e => setBackupCode(e.target.value)}
              placeholder="e.g. a1b2c3d4"
              autoFocus
              className="w-full h-10 rounded-lg border border-white/10 bg-surface-2 px-3 text-sm text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-neural-500 transition-colors"
            />
            <p className="text-xs text-white/30 text-center">
              Backup codes were provided when you set up MFA
            </p>
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={!codeComplete}
        >
          Verify
        </Button>

        {/* Switch between TOTP / backup code */}
        <button
          onClick={() => { setUseBackup(v => !v); setDigits(Array(6).fill('')); setBackupCode('') }}
          className="flex items-center justify-center gap-2 w-full text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <KeyRound size={12} />
          {useBackup ? 'Use authenticator app instead' : "Can't access your app? Use a backup code"}
        </button>

        {/* Back to login */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center gap-2 w-full text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft size={12} /> Back to sign in
        </button>
      </motion.div>
    </div>
  )
}