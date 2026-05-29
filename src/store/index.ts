import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import authReducer          from './slices/authSlice'
import uiReducer            from './slices/uiSlice'
import incidentsReducer     from './slices/incidentsSlice'
import notificationsReducer from './slices/notificationsSlice'
import alertRulesReducer    from './slices/alertRulesSlice'
import playbooksReducer     from './slices/playbooksSlice'

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    ui:            uiReducer,
    incidents:     incidentsReducer,
    notifications: notificationsReducer,
    alertRules:    alertRulesReducer,
    playbooks:     playbooksReducer,
  },
  middleware: getDefault =>
    getDefault({ serializableCheck: { ignoredActionPaths: ['payload.created_at'] } }),
})

export type RootState   = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch           = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector