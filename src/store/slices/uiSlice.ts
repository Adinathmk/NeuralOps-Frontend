import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { UIState, Toast } from '@/types'

const initialState: UIState = {
  sidebarCollapsed: false,
  theme:            'dark',
  activeModal:      null,
  toasts:           [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload
    },
    setTheme(state, action: PayloadAction<'dark' | 'light'>) {
      state.theme = action.payload
    },
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload
    },
    closeModal(state) {
      state.activeModal = null
    },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      const id = crypto.randomUUID()
      state.toasts.push({ id, ...action.payload })
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
  },
})

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  openModal,
  closeModal,
  addToast,
  removeToast,
} = uiSlice.actions

export default uiSlice.reducer