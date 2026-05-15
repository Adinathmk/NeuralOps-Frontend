// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, AuthTokens, User, LoginFormData, RegisterFormData, JoinPayload } from '@/types'
import { tokenStorage, userStorage } from '@utils/token'
import { authApi } from '@features/auth/api/authApi'
import { mfaApi } from '@features/auth/api/mfaApi'
import { invitationsApi } from '@features/invitations/api/invitationsApi'

const storedTokens = tokenStorage.getTokens()
const storedUser   = userStorage.getUser()

const initialState: AuthState = {
  user:            storedUser,
  tenant:          storedUser?.tenant ?? null,
  tokens:          storedTokens,
  isAuthenticated: !!storedTokens && !!storedUser,
  isLoading:       false,
  error:           null,
  mfaRequired:     false,   // ← MFA challenge pending
  mfaToken:        null,    // ← temporary token from backend
}

// ── helpers ───────────────────────────────────────────────────────────────────
function normaliseUser(raw: User): User {
  return {
    ...raw,
    full_name: raw.full_name || `${raw.first_name} ${raw.last_name}`.trim(),
    is_email_verified: raw.is_email_verified ?? raw.email_verified ?? false,
  }
}

// ── shared auth success handler ───────────────────────────────────────────────
function applyAuthSuccess(
  state: AuthState,
  payload: { user: User; access_token: string; refresh_token: string }
) {
  const tokens: AuthTokens = {
    access_token:  payload.access_token,
    refresh_token: payload.refresh_token,
    token_type:    'bearer',
  }
  state.isLoading      = false
  state.isAuthenticated = true
  state.tokens         = tokens
  state.user           = payload.user
  state.tenant         = payload.user.tenant ?? null
  state.mfaRequired    = false
  state.mfaToken       = null
  state.error          = null
  tokenStorage.setTokens(tokens)
  userStorage.setUser(payload.user)
}

// ── thunks ────────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginFormData, { rejectWithValue }) => {
    try {
      const res = await authApi.login(payload)

      // ── MFA required — backend returns mfa_token instead of access_token ──
      if (res.requires_mfa && res.mfa_token) {
        return {
          requiresMfa: true,
          mfaToken:    res.mfa_token,
        }
      }

      // ── Normal login (MFA not enabled) ──
      if (!res.data || !res.access_token || !res.refresh_token) {
        return rejectWithValue(res.message ?? 'Login failed')
      }

      return {
        requiresMfa:   false,
        user:          normaliseUser(res.data as User),
        access_token:  res.access_token,
        refresh_token: res.refresh_token,
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Login failed')
    }
  }
)

export const mfaVerifyThunk = createAsyncThunk(
  'auth/mfaVerify',
  async (
    { mfa_token, code }: { mfa_token: string; code: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await mfaApi.verify(mfa_token, code)

      if (!res.access_token || !res.refresh_token) {
        return rejectWithValue(res.message ?? 'MFA verification failed')
      }

      // After MFA verify, fetch the full user profile
      const meRes = await authApi.me()
      if (!meRes.data) return rejectWithValue('Failed to fetch user')

      return {
        user:          normaliseUser(meRes.data as User),
        access_token:  res.access_token,
        refresh_token: res.refresh_token,
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'MFA verification failed')
    }
  }
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterFormData, { rejectWithValue }) => {
    try {
      const res = await authApi.register(payload)
      return { message: res.message as string }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Registration failed')
    }
  }
)

export const fetchMeThunk = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.me()
      return normaliseUser(res.data as User)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to fetch user')
    }
  }
)

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logout() } catch { /* swallow */ }
})

export const joinInvitationThunk = createAsyncThunk(
  'auth/joinInvitation',
  async (payload: JoinPayload, { rejectWithValue }) => {
    try {
      const res = await invitationsApi.join(payload)
      if (res.access_token && res.refresh_token && res.data) {
        return {
          user:          normaliseUser(res.data as User),
          access_token:  res.access_token,
          refresh_token: res.refresh_token,
          autoLogin:     true,
        }
      }
      return { autoLogin: false }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to join workspace')
    }
  }
)

export const googleOAuthThunk = createAsyncThunk(
  'auth/googleOAuth',
  async ({ code, inviteToken }: { code: string; inviteToken?: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.googleCallback(code, inviteToken)
      if (!res.data || !res.access_token || !res.refresh_token) {
        throw new Error(res.message ?? 'Authentication failed')
      }
      return {
        user:          normaliseUser(res.data),
        access_token:  res.access_token,
        refresh_token: res.refresh_token,
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      return rejectWithValue(e.response?.data?.message ?? e.message ?? 'Google OAuth failed')
    }
  }
)

export const githubOAuthThunk = createAsyncThunk(
  'auth/githubOAuth',
  async ({ code, inviteToken }: { code: string; inviteToken?: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.githubCallback(code, inviteToken)
      if (!res.data || !res.access_token || !res.refresh_token) {
        throw new Error(res.message ?? 'Authentication failed')
      }
      return {
        user:          normaliseUser(res.data),
        access_token:  res.access_token,
        refresh_token: res.refresh_token,
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      return rejectWithValue(e.response?.data?.message ?? e.message ?? 'GitHub OAuth failed')
    }
  }
)

// ── slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload
      tokenStorage.setTokens(action.payload)
    },
    logout(state) {
      state.user            = null
      state.tenant          = null
      state.tokens          = null
      state.isAuthenticated = false
      state.error           = null
      state.mfaRequired     = false
      state.mfaToken        = null
      tokenStorage.clearTokens()
      userStorage.clearUser()
    },
    clearError(state)  { state.error = null },
    clearMfa(state)    { state.mfaRequired = false; state.mfaToken = null },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        userStorage.setUser(state.user)
      }
    },
    // Called by OAuthCallbackPage after a successful OAuth exchange
    setAuthFromOAuth(
      state,
      action: PayloadAction<{ user: User; access_token: string; refresh_token: string }>
    ) {
      applyAuthSuccess(state, action.payload)
    },
  },
  extraReducers: builder => {
    // ── login ──
    builder
      .addCase(loginThunk.pending, state => {
        state.isLoading = true
        state.error     = null
        state.mfaRequired = false
        state.mfaToken    = null
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        if (payload.requiresMfa) {
          // Stop here — show MFA challenge page
          state.mfaRequired = true
          state.mfaToken    = payload.mfaToken ?? null
        } else if (payload.user && payload.access_token && payload.refresh_token) {
          applyAuthSuccess(state, {
            user:          payload.user,
            access_token:  payload.access_token,
            refresh_token: payload.refresh_token,
          })
        }
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // ── MFA verify ──
    builder
      .addCase(mfaVerifyThunk.pending, state => {
        state.isLoading = true
        state.error     = null
      })
      .addCase(mfaVerifyThunk.fulfilled, (state, { payload }) => {
        applyAuthSuccess(state, payload)
      })
      .addCase(mfaVerifyThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // ── google OAuth ──
    builder
      .addCase(googleOAuthThunk.pending,   state => { state.isLoading = true; state.error = null })
      .addCase(googleOAuthThunk.fulfilled, (state, { payload }) => applyAuthSuccess(state, payload))
      .addCase(googleOAuthThunk.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload as string })

    // ── github OAuth ──
    builder
      .addCase(githubOAuthThunk.pending,   state => { state.isLoading = true; state.error = null })
      .addCase(githubOAuthThunk.fulfilled, (state, { payload }) => applyAuthSuccess(state, payload))
      .addCase(githubOAuthThunk.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload as string })

    // ── register ──
    builder
      .addCase(registerThunk.pending,   state => { state.isLoading = true; state.error = null })
      .addCase(registerThunk.fulfilled, state => { state.isLoading = false })
      .addCase(registerThunk.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload as string })

    // ── fetchMe ──
    builder.addCase(fetchMeThunk.fulfilled, (state, { payload }) => {
      state.user   = payload
      state.tenant = payload.tenant ?? null
      userStorage.setUser(payload)
    })

    // ── logout ──
    builder.addCase(logoutThunk.fulfilled, state => {
      state.user = null; state.tenant = null; state.tokens = null
      state.isAuthenticated = false
      state.mfaRequired     = false
      state.mfaToken        = null
      tokenStorage.clearTokens(); userStorage.clearUser()
    })

    // ── join invitation ──
    builder
      .addCase(joinInvitationThunk.pending,  state => { state.isLoading = true; state.error = null })
      .addCase(joinInvitationThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        if (payload.autoLogin && payload.user && payload.access_token && payload.refresh_token) {
          applyAuthSuccess(state, payload as { user: User; access_token: string; refresh_token: string })
        }
      })
      .addCase(joinInvitationThunk.rejected, (state, { payload }) => {
        state.isLoading = false; state.error = payload as string
      })
  },
})

export const { setTokens, logout, clearError, clearMfa, updateUser, setAuthFromOAuth } = authSlice.actions
export default authSlice.reducer