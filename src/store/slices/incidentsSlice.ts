import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Incident, IncidentStatus } from '@/types'
import { incidentsApi } from '@features/dashboard/api/incidentsApi'

interface IncidentsState {
  items:    Incident[]
  selected: Incident | null
  total:    number
  isLoading: boolean
  error:    string | null
  filters: {
    status:   IncidentStatus | 'all'
    severity: string
    category: string
    search:   string
    page:     number
    assignedToMe: boolean
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
    category: 'all',
    search:   '',
    page:     1,
    assignedToMe: false,
  },
}

export const fetchIncidentsThunk = createAsyncThunk(
  'incidents/fetchAll',
  async (params: Record<string, unknown> = {}, { rejectWithValue }) => {
    try {
      const res = await incidentsApi.list(params)
      return res.data // Contains data array and pagination object
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch incidents')
    }
  }
)

export const fetchIncidentThunk = createAsyncThunk(
  'incidents/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await incidentsApi.getById(id)
      const { incident, analysis } = res.data.data
      return { ...incident, analysis } as Incident
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch incident')
    }
  }
)

export const updateIncidentThunk = createAsyncThunk(
  'incidents/update',
  async ({ id, ...data }: { id: string, status?: IncidentStatus, assigned_user_ids?: string[] | null, actor_id?: string, note?: string }, { rejectWithValue }) => {
    try {
      const res = await incidentsApi.update(id, data)
      // The API returns the updated fields in res.data.data
      return res.data.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update incident')
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
    patchIncidentInStore(state, action: PayloadAction<Partial<Incident> & { id: string }>) {
      const idx = state.items.findIndex(i => i.id === action.payload.id)
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...action.payload }
      }
      if (state.selected?.id === action.payload.id) {
        state.selected = { ...state.selected, ...action.payload }
      }
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
        state.items     = payload.data
        state.total     = payload.pagination.total
      })
      .addCase(fetchIncidentsThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    builder
      .addCase(fetchIncidentThunk.pending, (state) => {
        state.isLoading = true
        state.error     = null
      })
      .addCase(fetchIncidentThunk.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.selected = payload
        const idx = state.items.findIndex(i => i.id === payload.id)
        if (idx >= 0) state.items[idx] = payload
      })
      .addCase(fetchIncidentThunk.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })
      .addCase(updateIncidentThunk.fulfilled, (state, { payload }) => {
        if (state.selected && state.selected.id === payload.id) {
          state.selected = { ...state.selected, ...payload }
        }
        const idx = state.items.findIndex(i => i.id === payload.id)
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...payload }
        }
      })
  },
})

export const { setSelected, upsertIncident, patchIncidentInStore, setFilter, clearError } = incidentsSlice.actions
export default incidentsSlice.reducer