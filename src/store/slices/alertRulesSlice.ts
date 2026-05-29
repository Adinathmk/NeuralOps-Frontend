import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { AlertRule } from '@/types'
import { alertRulesApi } from '@features/settings/api/alertRulesApi'

// ── State ───────────────────────────────────────────────────────────────────────

interface AlertRulesState {
  items:     AlertRule[]
  isLoading: boolean
  error:     string | null
}

const initialState: AlertRulesState = {
  items:     [],
  isLoading: false,
  error:     null,
}

// ── Async thunks ────────────────────────────────────────────────────────────────

export const fetchAlertRules = createAsyncThunk(
  'alertRules/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await alertRulesApi.list()
      return res.data.data          // unwrap APIResponse.success({ data })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch alert rules')
    }
  }
)

export const createAlertRule = createAsyncThunk(
  'alertRules/create',
  async (data: {
    confidence_threshold: number
    severity_filter: string[]
    recipient_ids: string[]
    enabled?: boolean
  }, { rejectWithValue }) => {
    try {
      const res = await alertRulesApi.create(data)
      return res.data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create alert rule')
    }
  }
)

export const updateAlertRule = createAsyncThunk(
  'alertRules/update',
  async ({ id, ...data }: { id: string } & Partial<{
    confidence_threshold: number
    severity_filter: string[]
    recipient_ids: string[]
    enabled: boolean
  }>, { rejectWithValue }) => {
    try {
      const res = await alertRulesApi.update(id, data)
      return res.data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update alert rule')
    }
  }
)

export const deleteAlertRule = createAsyncThunk(
  'alertRules/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await alertRulesApi.delete(id)
      return id
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete alert rule')
    }
  }
)

// ── Slice ────────────────────────────────────────────────────────────────────────

const alertRulesSlice = createSlice({
  name: 'alertRules',
  initialState,
  reducers: {
    clearAlertRulesError(state) {
      state.error = null
    },
  },
  extraReducers: builder => {
    // Fetch all
    builder
      .addCase(fetchAlertRules.pending, state => {
        state.isLoading = true
        state.error     = null
      })
      .addCase(fetchAlertRules.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.items     = payload
      })
      .addCase(fetchAlertRules.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // Create
    builder
      .addCase(createAlertRule.fulfilled, (state, { payload }) => {
        state.items.unshift(payload)
      })

    // Update
    builder
      .addCase(updateAlertRule.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(r => r.id === payload.id)
        if (idx >= 0) state.items[idx] = payload
      })

    // Delete
    builder
      .addCase(deleteAlertRule.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter(r => r.id !== id)
      })
  },
})

export const { clearAlertRulesError } = alertRulesSlice.actions
export default alertRulesSlice.reducer
