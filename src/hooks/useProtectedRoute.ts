import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@store/index'
import { addToast, removeToast } from '@store/slices/uiSlice'
import type { Toast } from '@/types'

// ── Protected route guard ─────────────────────────────────────────────────────
export function useRequireAuth(redirectTo = '/login') {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  const navigate        = useNavigate()
  const location        = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(redirectTo, { state: { from: location.pathname }, replace: true })
    }
  }, [isAuthenticated, navigate, redirectTo, location])

  return isAuthenticated
}

// ── Redirect authenticated users away from auth pages ─────────────────────────
export function useRedirectIfAuthenticated(to = '/dashboard') {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  const navigate        = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate(to, { replace: true })
  }, [isAuthenticated, navigate, to])
}

// ── Toast helper ──────────────────────────────────────────────────────────────
export function useToast() {
  const dispatch = useAppDispatch()

  const toast = (opts: Omit<Toast, 'id'>) => {
    dispatch(addToast(opts))
  }

  const dismiss = (id: string) => dispatch(removeToast(id))

  return { toast, dismiss }
}

// ── Role guard ────────────────────────────────────────────────────────────────
export function useRole() {
  const role   = useAppSelector(s => s.auth.user?.role)
  const canManage  = role === 'owner' || role === 'admin'
  const canInteract = canManage || role === 'engineer'
  const isOwner    = role === 'owner'

  return { role,canManage, canInteract, isOwner }
}