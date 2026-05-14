import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '@/types'
import api from '@lib/axios'

interface NotificationsState {
  items:      Notification[]
  unreadCount: number
  isLoading:  boolean
}

const initialState: NotificationsState = {
  items:       [],
  unreadCount: 0,
  isLoading:   false,
}

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchAll',
  async (userId: string) => {
    const res = await api.get<Notification[]>(`/users/${userId}/notifications`)
    return res.data
  }
)

export const markReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (notificationId: string) => {
    await api.patch(`/notifications/${notificationId}/read`)
    return notificationId
  }
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload)
      if (!action.payload.is_read) state.unreadCount++
    },
    markAllRead(state) {
      state.items       = state.items.map(n => ({ ...n, is_read: true }))
      state.unreadCount = 0
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotificationsThunk.pending, state => { state.isLoading = true })
      .addCase(fetchNotificationsThunk.fulfilled, (state, { payload }) => {
        state.isLoading   = false
        state.items       = payload
        state.unreadCount = payload.filter(n => !n.is_read).length
      })

    builder.addCase(markReadThunk.fulfilled, (state, { payload: id }) => {
      const n = state.items.find(n => n.id === id)
      if (n && !n.is_read) {
        n.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    })
  },
})

export const { pushNotification, markAllRead } = notificationsSlice.actions
export default notificationsSlice.reducer