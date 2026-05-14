import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Incident, IncidentStatus } from '@/types'
import api from '@lib/axios'

interface IncidentsState {
  items:    Incident[]
  selected: Incident | null
  total:    number
  isLoading: boolean
  error:    string | null
  filters: {
    status:   IncidentStatus | 'all'
    severity: string
    search:   string
    page:     number
  }
}

const initialState: IncidentsState = {
  items:    [],
  selected: null,
  total:    0,
  isLoading: false,
  error:    null,
  filters: {
    status:   'all',
    severity: 'all',
    search:   '',
    page:     1,
  },
}

export const fetchIncidentsThunk = createAsyncThunk(
  'incidents/fetchAll',
  async (params: Record<string, unknown> = {}, { rejectWithValue }) => {
    try {
      const res = await api.get<{ results: Incident[]; count: number }>('/v1/incidents', { params })
      return res.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch incidents')
    }
  }
)

export const fetchIncidentThunk = createAsyncThunk(
  'incidents/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get<Incident>(`/v1/incidents/${id}`)
      return res.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch incident')
    }
  }
)

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    setSelected(state, action: PayloadAction<Incident | null>) {
      state.selected = action.payload
    },
    upsertIncident(state, action: PayloadAction<Incident>) {
      const idx = state.items.findIndex(i => i.id === action.payload.id)
      if (idx >= 0) state.items[idx] = action.payload
      else state.items.unshift(action.payload)
    },
    setFilter(state, action: PayloadAction<Partial<IncidentsState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload, page: 1 }
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchIncidentsThunk.pending, state => {
        state.isLoading = true
        state.error     = null
      })
      .addCase(fetchIncidentsThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.items     = payload.results
        state.total     = payload.count
      })
      .addCase(fetchIncidentsThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    builder
      .addCase(fetchIncidentThunk.fulfilled, (state, { payload }) => {
        state.selected = payload
        const idx = state.items.findIndex(i => i.id === payload.id)
        if (idx >= 0) state.items[idx] = payload
      })
  },
})

export const { setSelected, upsertIncident, setFilter, clearError } = incidentsSlice.actions
export default incidentsSlice.reducer