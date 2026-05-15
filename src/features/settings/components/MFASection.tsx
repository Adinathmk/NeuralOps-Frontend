// src/components/settings/MFASection.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ShieldCheck, ShieldOff, Copy, CheckCircle,
  AlertTriangle, Loader2, Eye, EyeOff,
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@store/index'
import { updateUser } from '@store/slices/authSlice'
import { mfaApi } from '@features/auth/api/mfaApi'
import type { MFASetupData, MFAConfirmData } from '@features/auth/api/mfaApi'
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Modal } from '@components/common/Modal'
import { useToast } from '@hooks/useProtectedRoute'
import { cn } from '@utils/cn'

// ── Setup flow steps ───────────────────────────────────────────────────────────
type SetupStep = 'idle' | 'qr' | 'confirm' | 'backup'

export function MFASection() {
  const dispatch    = useAppDispatch()
  const { toast }   = useToast()
  const user        = useAppSelector(s => s.auth.user)
  const mfaEnabled  = user?.mfa_enabled ?? false

  // Setup flow
  const [step, setStep]           = useState<SetupStep>('idle')
  const [setupData, setSetupData] = useState<MFASetupData | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [confirmCode, setConfirmCode] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [loading, setLoading]     = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes]   = useState(false)

  // Disable flow
  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode]         = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [disableLoading, setDisableLoading]   = useState(false)
  const [disableError, setDisableError]       = useState('')

  // ── Setup MFA ──────────────────────────────────────────────────────────────
  const startSetup = async () => {
    setLoading(true)
    try {
      const res = await mfaApi.setup()
      if (res.data) {
        setSetupData(res.data)
        setStep('qr')
      }
    } catch {
      toast({ type: 'error', title: 'Failed to start MFA setup' })
    } finally {
      setLoading(false)
    }
  }

  const confirmSetup = async () => {
    if (confirmCode.length !== 6) {
      setConfirmError('Enter the 6-digit code from your app')
      return
    }
    setLoading(true)
    setConfirmError('')
    try {
      const res = await mfaApi.confirm(confirmCode)
      if (res.data) {
        const data = res.data as MFAConfirmData
        setBackupCodes(data.backup_codes)
        setStep('backup')
        dispatch(updateUser({ mfa_enabled: true }))
        toast({ type: 'success', title: 'MFA enabled', description: 'Save your backup codes safely.' })
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setConfirmError(e.response?.data?.message ?? 'Invalid code, try again')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  const finishSetup = () => {
    setStep('idle')
    setSetupData(null)
    setBackupCodes([])
    setConfirmCode('')
  }

  // ── Disable MFA ────────────────────────────────────────────────────────────
  const handleDisable = async () => {
    if (!disablePassword || !disableCode) {
      setDisableError('Both password and authenticator code are required')
      return
    }
    setDisableLoading(true)
    setDisableError('')
    try {
      await mfaApi.disable(disablePassword, disableCode)
      dispatch(updateUser({ mfa_enabled: false }))
      toast({ type: 'success', title: 'MFA disabled' })
      setDisableOpen(false)
      setDisablePassword('')
      setDisableCode('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setDisableError(e.response?.data?.message ?? 'Failed to disable MFA')
    } finally {
      setDisableLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {mfaEnabled
              ? <ShieldCheck size={14} className="text-neural-400" />
              : <Shield size={14} className="text-white/50" />
            }
            <CardTitle>Two-Factor Authentication</CardTitle>
            {mfaEnabled && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-neural-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-neural-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status description */}
          <p className="text-sm text-white/50 leading-relaxed">
            {mfaEnabled
              ? 'Your account is protected with TOTP two-factor authentication. You need your authenticator app to sign in.'
              : 'Add an extra layer of security. After enabling, you will need your authenticator app every time you sign in.'}
          </p>

          {/* ── Not enabled → show setup flow ── */}
          {!mfaEnabled && (
            <AnimatePresence mode="wait">

              {/* Step: idle — entry point */}
              {step === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button onClick={startSetup} isLoading={loading} className="gap-2">
                    <Shield size={14} /> Enable MFA
                  </Button>
                </motion.div>
              )}

              {/* Step: qr — scan QR code */}
              {step === 'qr' && setupData && (
                <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="rounded-xl border border-white/8 bg-surface-2 p-4 space-y-4">
                    <p className="text-xs font-medium text-white/70">
                      1. Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator
                    </p>
                    {/* QR Code image */}
                    <div className="flex justify-center">
                      <div className="rounded-xl bg-white p-3 inline-block">
                        <img
                          src={setupData.qr_code}
                          alt="MFA QR Code"
                          className="h-40 w-40"
                        />
                      </div>
                    </div>

                    {/* Manual secret */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-white/40">Can't scan? Enter this key manually:</p>
                      <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface-3 px-3 py-2">
                        <code className="flex-1 text-xs text-neural-400 font-mono tracking-wider break-all">
                          {setupData.secret}
                        </code>
                        <button
                          onClick={copySecret}
                          className="text-white/30 hover:text-white/70 transition-colors shrink-0"
                        >
                          {copiedSecret ? <CheckCircle size={13} className="text-neural-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verify code */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-white/70">
                      2. Enter the 6-digit code from your app to verify
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={confirmCode}
                        onChange={e => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="flex-1 h-10 rounded-lg border border-white/10 bg-surface-2 px-3 text-center text-lg font-mono font-bold text-white tracking-[0.5em] placeholder:text-white/20 placeholder:tracking-normal focus:outline-none focus:border-neural-500 transition-colors"
                      />
                      <Button onClick={confirmSetup} isLoading={loading} disabled={confirmCode.length !== 6}>
                        Verify
                      </Button>
                    </div>
                    {confirmError && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <AlertTriangle size={11} /> {confirmError}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => { setStep('idle'); setSetupData(null); setConfirmCode('') }}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    Cancel setup
                  </button>
                </motion.div>
              )}

              {/* Step: backup — show backup codes */}
              {step === 'backup' && (
                <motion.div key="backup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <p className="text-sm font-semibold text-amber-300">Save your backup codes</p>
                    </div>
                    <p className="text-xs text-amber-300/70 leading-relaxed">
                      Each code can be used once if you lose access to your authenticator. Store them somewhere safe — you won't see them again.
                    </p>
                  </div>

                  {/* Grid of backup codes */}
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="rounded-lg border border-white/8 bg-surface-2 px-3 py-2 text-center">
                        <code className="text-xs font-mono text-white/70">{code}</code>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={copyCodes}>
                      {copiedCodes ? <CheckCircle size={13} /> : <Copy size={13} />}
                      {copiedCodes ? 'Copied!' : 'Copy all'}
                    </Button>
                    <Button className="flex-1" onClick={finishSetup}>
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ── Enabled → show disable button ── */}
          {mfaEnabled && (
            <Button
              variant="outline"
              className="gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30"
              onClick={() => setDisableOpen(true)}
            >
              <ShieldOff size={14} /> Disable MFA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Disable MFA modal ── */}
      <Modal
        open={disableOpen}
        onClose={() => { setDisableOpen(false); setDisablePassword(''); setDisableCode(''); setDisableError('') }}
        title="Disable two-factor authentication"
        description="This will remove MFA protection from your account. You'll need your password and current authenticator code to confirm."
        size="sm"
      >
        <div className="space-y-4 mt-4">
          {disableError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-sm text-red-400">
              {disableError}
            </div>
          )}

          <div className="relative">
            <Input
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              }
            />
          </div>

          <Input
            label="Authenticator Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />

          <div className="flex gap-2 pt-1">
            <Button
              variant="destructive"
              className="flex-1"
              isLoading={disableLoading}
              onClick={handleDisable}
            >
              Disable MFA
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setDisableOpen(false); setDisablePassword(''); setDisableCode(''); setDisableError('') }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}