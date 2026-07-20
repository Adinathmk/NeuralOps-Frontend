import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@store/index'
import { loginThunk, registerThunk, logoutThunk, fetchMeThunk, clearError, googleOAuthThunk, githubOAuthThunk, joinInvitationThunk } from '@store/slices/authSlice'
import { authApi } from '@features/auth/api/authApi'
import type { LoginFormData, RegisterFormData, ForgotPasswordFormData, ResetPasswordFormData, ChangePasswordFormData, JoinPayload } from '@/types'

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
      navigate('/register-success', { replace: true, state: { email: data.email } })
    }

    return result
  }, [dispatch, navigate])

  const googleOAuth = useCallback(async (code: string, inviteToken?: string) => {
    return dispatch(googleOAuthThunk({ code, inviteToken })).unwrap()
  }, [dispatch])

  const githubOAuth = useCallback(async (code: string, inviteToken?: string) => {
    return dispatch(githubOAuthThunk({ code, inviteToken })).unwrap()
  }, [dispatch])

  const joinInvitation = useCallback(async (payload: JoinPayload) => {
    return dispatch(joinInvitationThunk(payload)).unwrap()
  }, [dispatch])

  const forgotPassword = useCallback(async (data: ForgotPasswordFormData) => {
    return authApi.forgotPassword(data)
  }, [])

  const resetPassword = useCallback(async (data: ResetPasswordFormData) => {
    return authApi.resetPassword(data)
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    return authApi.verifyEmail(token)
  }, [])

  const resendVerification = useCallback(async (email: string) => {
    return authApi.resendVerification(email)
  }, [])

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
    googleOAuth,
    githubOAuth,
    joinInvitation,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    logout,
    refreshUser,
    dismissError,
  }
}
