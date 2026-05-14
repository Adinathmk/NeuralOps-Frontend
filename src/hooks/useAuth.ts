import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@store/index'
import { loginThunk, registerThunk, logoutThunk, fetchMeThunk, clearError } from '@store/slices/authSlice'
import type { LoginFormData, RegisterFormData } from '@/types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const auth     = useAppSelector(s => s.auth)

  const login = useCallback(async (data: LoginFormData) => {
    const result = await dispatch(loginThunk(data))

    if (loginThunk.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true })
    }

    return result
  }, [dispatch, navigate])

  const register = useCallback(async (data: RegisterFormData) => {
    const result = await dispatch(registerThunk(data))

    // Registration requires email verification — redirect to confirm page
    if (registerThunk.fulfilled.match(result)) {
      navigate('/register-success', { replace: true })
    }

    return result
  }, [dispatch, navigate])

  const logout = useCallback(async () => {
    await dispatch(logoutThunk())
    navigate('/login', { replace: true })
  }, [dispatch, navigate])

  const refreshUser = useCallback(
    () => dispatch(fetchMeThunk()),
    [dispatch]
  )

  const dismissError = useCallback(
    () => dispatch(clearError()),
    [dispatch]
  )

  return {
    user: auth.user,
    tenant: auth.tenant,
    tokens: auth.tokens,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,

    login,
    register,
    logout,
    refreshUser,
    dismissError,
  }
}
