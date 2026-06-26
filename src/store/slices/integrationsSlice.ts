import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { GitHubIntegrationStatus, GitHubIntegrationFormData } from '@/types'
import { integrationsApi } from '@features/integrations/api/integrationsApi'

interface IntegrationsState {
  github: GitHubIntegrationStatus | null
  isLoading: boolean
  error: string | null
}

const initialState: IntegrationsState = {
  github: null,
  isLoading: false,
  error: null,
}

export const fetchGitHubIntegrationThunk = createAsyncThunk(
  'integrations/fetchGitHub',
  async (_, { rejectWithValue }) => {
    try {
      const res = await integrationsApi.getGitHubIntegration()
      return res.data
    } catch (err: unknown) {
      const e = err as { response?: { status?: number, data?: { message?: string } } }
      if (e.response?.status === 404) {
        return null
      }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to fetch GitHub integration')
    }
  }
)

export const saveGitHubIntegrationThunk = createAsyncThunk(
  'integrations/saveGitHub',
  async (payload: GitHubIntegrationFormData, { rejectWithValue }) => {
    try {
      const res = await integrationsApi.saveGitHubIntegration(payload)
      return res.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to save GitHub integration')
    }
  }
)

export const deleteGitHubIntegrationThunk = createAsyncThunk(
  'integrations/deleteGitHub',
  async (_, { rejectWithValue }) => {
    try {
      await integrationsApi.deleteGitHubIntegration()
      return null
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to delete GitHub integration')
    }
  }
)

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
    updateGitHubIntegrationStatus(state, action: import('@reduxjs/toolkit').PayloadAction<{status: import('@/types').GitHubIntegrationStatus['indexing_status'], commit_sha: string | null}>) {
      if (state.github) {
        state.github.indexing_status = action.payload.status
        if (action.payload.commit_sha) {
          state.github.last_indexed_commit = action.payload.commit_sha
        }
      }
    },
  },
  extraReducers: builder => {
    // Fetch
    builder
      .addCase(fetchGitHubIntegrationThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchGitHubIntegrationThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.github = payload ?? null
      })
      .addCase(fetchGitHubIntegrationThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error = payload as string
      })

    // Save
    builder
      .addCase(saveGitHubIntegrationThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(saveGitHubIntegrationThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.github = payload ?? null
      })
      .addCase(saveGitHubIntegrationThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error = payload as string
      })

    // Delete
    builder
      .addCase(deleteGitHubIntegrationThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteGitHubIntegrationThunk.fulfilled, state => {
        state.isLoading = false
        state.github = null
      })
      .addCase(deleteGitHubIntegrationThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error = payload as string
      })
  },
})

export const { clearError, updateGitHubIntegrationStatus } = integrationsSlice.actions
export default integrationsSlice.reducer
