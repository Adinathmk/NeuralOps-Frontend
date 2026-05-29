import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Playbook } from '@/types'
import { playbooksApi } from '@features/settings/api/playbooksApi'

// ── State ───────────────────────────────────────────────────────────────────────

interface PlaybooksState {
  items:     Playbook[]
  isLoading: boolean
  error:     string | null
}

const initialState: PlaybooksState = {
  items:     [],
  isLoading: false,
  error:     null,
}

// ── Async thunks ────────────────────────────────────────────────────────────────

export const fetchPlaybooks = createAsyncThunk(
  'playbooks/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await playbooksApi.list()
      return res.data.data          // unwrap APIResponse.success({ data })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch playbooks')
    }
  }
)

export const createPlaybook = createAsyncThunk(
  'playbooks/create',
  async (data: {
    error_pattern: string
    instructions: string
  }, { rejectWithValue }) => {
    try {
      const res = await playbooksApi.create(data)
      return res.data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create playbook')
    }
  }
)

export const updatePlaybook = createAsyncThunk(
  'playbooks/update',
  async ({ id, ...data }: { id: string } & Partial<{
    error_pattern: string
    instructions: string
  }>, { rejectWithValue }) => {
    try {
      const res = await playbooksApi.update(id, data)
      return res.data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update playbook')
    }
  }
)

export const deletePlaybook = createAsyncThunk(
  'playbooks/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await playbooksApi.delete(id)
      return id
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete playbook')
    }
  }
)

// ── Slice ────────────────────────────────────────────────────────────────────────

const playbooksSlice = createSlice({
  name: 'playbooks',
  initialState,
  reducers: {
    clearPlaybooksError(state) {
      state.error = null
    },
  },
  extraReducers: builder => {
    // Fetch all
    builder
      .addCase(fetchPlaybooks.pending, state => {
        state.isLoading = true
        state.error     = null
      })
      .addCase(fetchPlaybooks.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.items     = payload
      })
      .addCase(fetchPlaybooks.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // Create
    builder
      .addCase(createPlaybook.fulfilled, (state, { payload }) => {
        state.items.unshift(payload)
      })

    // Update
    builder
      .addCase(updatePlaybook.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(p => p.id === payload.id)
        if (idx >= 0) state.items[idx] = payload
      })

    // Delete
    builder
      .addCase(deletePlaybook.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter(p => p.id !== id)
      })
  },
})

export const { clearPlaybooksError } = playbooksSlice.actions
export default playbooksSlice.reducer
