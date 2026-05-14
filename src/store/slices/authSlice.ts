import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, AuthTokens, User, Tenant, LoginFormData, RegisterFormData } from '@/types'
import { tokenStorage, userStorage } from '@utils/token'
import apiClient from '@lib/axios'

const storedTokens = tokenStorage.getTokens()
const storedUser   = userStorage.getUser()

const initialState: AuthState = {
  user:            storedUser,
  tenant:          storedUser?.tenant ?? null,
  tokens:          storedTokens,
  isAuthenticated: !!storedTokens && !!storedUser,
  isLoading:       false,
  error:           null,
}

// -- helpers -------------------------------------------------------------------
function normaliseUser(raw: User): User {
  return {
    ...raw,
    full_name: raw.full_name || `${raw.first_name} ${raw.last_name}`.trim(),
    is_email_verified: raw.is_email_verified ?? raw.email_verified ?? false,
  }
}

// -- thunks --------------------------------------------------------------------
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginFormData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/login', payload)
      const body = res.data // { success, data: User, access_token, refresh_token }
      return {
        user:          normaliseUser(body.data),
        access_token:  body.access_token as string,
        refresh_token: body.refresh_token as string,
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Login failed')
    }
  }
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterFormData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/register', payload)
      const body = res.data
      return { message: body.message as string }
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
      const res = await apiClient.get('/auth/me')
      return normaliseUser(res.data.data as User)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to fetch user')
    }
  }
)

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try { await apiClient.post('/auth/logout') } catch { /* swallow */ }
})

// -- slice ---------------------------------------------------------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload
      tokenStorage.setTokens(action.payload)
    },
    logout(state) {
      state.user = null; state.tenant = null; state.tokens = null
      state.isAuthenticated = false; state.error = null
      tokenStorage.clearTokens(); userStorage.clearUser()
    },
    clearError(state) { state.error = null },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        userStorage.setUser(state.user)
      }
    },
    // Called by OAuth flows that return tokens directly
    setAuthFromOAuth(state, action: PayloadAction<{ user: User; access_token: string; refresh_token: string }>) {
      const { user, access_token, refresh_token } = action.payload
      const tokens: AuthTokens = { access_token, refresh_token, token_type: 'bearer' }
      state.user = normaliseUser(user)
      state.tenant = user.tenant ?? null
      state.tokens = tokens
      state.isAuthenticated = true
      state.error = null
      tokenStorage.setTokens(tokens)
      userStorage.setUser(state.user)
    },
  },
  extraReducers: builder => {
    // login
    builder
      .addCase(loginThunk.pending,   state => { state.isLoading = true; state.error = null })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        const tokens: AuthTokens = { access_token: payload.access_token, refresh_token: payload.refresh_token, token_type: 'bearer' }
        state.isLoading = false; state.isAuthenticated = true
        state.tokens = tokens; state.user = payload.user; state.tenant = payload.user.tenant ?? null
        tokenStorage.setTokens(tokens); userStorage.setUser(payload.user)
      })
      .addCase(loginThunk.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload as string })

    // register — just shows success message, no auto-login (email verification required)
    builder
      .addCase(registerThunk.pending,   state => { state.isLoading = true; state.error = null })
      .addCase(registerThunk.fulfilled, state => { state.isLoading = false })
      .addCase(registerThunk.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload as string })

    // fetchMe
    builder.addCase(fetchMeThunk.fulfilled, (state, { payload }) => {
      state.user = payload; state.tenant = payload.tenant ?? null
      userStorage.setUser(payload)
    })

    // logout
    builder.addCase(logoutThunk.fulfilled, state => {
      state.user = null; state.tenant = null; state.tokens = null
      state.isAuthenticated = false
      tokenStorage.clearTokens(); userStorage.clearUser()
    })
  },
})

export const { setTokens, logout, clearError, updateUser, setAuthFromOAuth } = authSlice.actions
export default authSlice.reducer
