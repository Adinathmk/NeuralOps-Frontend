import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { GitHubIntegrationStatus, GitHubIntegrationFormData } from '@/types'
import { integrationsApi } from '@features/integrations/api/integrationsApi'

interface IntegrationsState {
  integrations: GitHubIntegrationStatus[]
  serviceMappings?: import('@/types').ServiceRepoMapping[]
  isLoading: boolean
  error: string | null
}

const initialState: IntegrationsState = {
  integrations: [],
  serviceMappings: [],
  isLoading: false,
  error: null,
}

export const fetchGitHubIntegrationsThunk = createAsyncThunk(
  'integrations/fetchGitHub',
  async (_, { rejectWithValue }) => {
    try {
      const res = await integrationsApi.getGitHubIntegrations()
      return res.data || []
    } catch (err: unknown) {
      const e = err as { response?: { status?: number, data?: { message?: string } } }
      if (e.response?.status === 404) {
        return []
      }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to fetch GitHub integrations')
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
  async (id: number, { rejectWithValue }) => {
    try {
      await integrationsApi.deleteGitHubIntegration(id)
      return id
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to delete GitHub integration')
    }
  }
)

export const fetchServiceMappingsThunk = createAsyncThunk(
  'integrations/fetchMappings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await integrationsApi.getServiceMappings()
      return res.data || []
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to fetch mappings')
    }
  }
)

export const createServiceMappingThunk = createAsyncThunk(
  'integrations/createMapping',
  async (payload: import('@/types').ServiceRepoMappingFormData, { rejectWithValue }) => {
    try {
      const res = await integrationsApi.createServiceMapping(payload)
      return res.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to create mapping')
    }
  }
)

export const deleteServiceMappingThunk = createAsyncThunk(
  'integrations/deleteMapping',
  async (id: string, { rejectWithValue }) => {
    try {
      await integrationsApi.deleteServiceMapping(id)
      return id
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(e.response?.data?.message ?? 'Failed to delete mapping')
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
    updateGitHubIntegrationStatus(
      state,
      action: import('@reduxjs/toolkit').PayloadAction<{
        repo_url?: string;
        id?: number;
        status: import('@/types').GitHubIntegrationStatus['indexing_status'];
        commit_sha: string | null
      }>
    ) {
      const { repo_url, id, status, commit_sha } = action.payload
      const target = state.integrations.find(
        (repo) => repo.id === id || repo.repo_url === repo_url
      )
      if (target) {
        target.indexing_status = status
        if (commit_sha) {
          target.last_indexed_commit = commit_sha
        }
      }
    },
  },
  extraReducers: builder => {
    // Fetch
    builder
      .addCase(fetchGitHubIntegrationsThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchGitHubIntegrationsThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.integrations = payload
      })
      .addCase(fetchGitHubIntegrationsThunk.rejected, (state, { payload }) => {
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
        if (payload) {
          // If the integration already exists, update it. Otherwise, append.
          const index = state.integrations.findIndex(r => r.id === payload.id)
          if (index !== -1) {
            state.integrations[index] = payload
          } else {
            state.integrations.push(payload)
          }
        }
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
      .addCase(deleteGitHubIntegrationThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.integrations = state.integrations.filter(r => r.id !== payload)
      })
      .addCase(deleteGitHubIntegrationThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error = payload as string
      })

    // Mappings
    builder
      .addCase(fetchServiceMappingsThunk.pending, state => {
        state.isLoading = true
      })
      .addCase(fetchServiceMappingsThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.serviceMappings = payload
      })
      .addCase(fetchServiceMappingsThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error = payload as string
      })
      .addCase(createServiceMappingThunk.fulfilled, (state, { payload }) => {
        if (payload) {
          state.serviceMappings?.push(payload)
        }
      })
      .addCase(deleteServiceMappingThunk.fulfilled, (state, { payload }) => {
        state.serviceMappings = state.serviceMappings?.filter(m => m.id !== payload)
      })
  },
})

export const { clearError, updateGitHubIntegrationStatus } = integrationsSlice.actions
export default integrationsSlice.reducer
