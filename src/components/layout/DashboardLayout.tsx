import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from './ToastContainer'
import { useRequireAuth } from '@hooks/useProtectedRoute'
import { useWebSocket } from '@hooks/useWebSocket'
import { useAuth } from '@hooks/useAuth'
import { useAppDispatch } from '@store/index'
import { addToast } from '@store/slices/uiSlice'

export function DashboardLayout() {
  const isAuth = useRequireAuth()
  const { tenant } = useAuth()
  const dispatch = useAppDispatch()

  const { lastMessage } = useWebSocket(tenant ? `/ws/collaboration/${tenant.id}/` : null)

  useEffect(() => {
    console.log(`[DashboardLayout] Tenant ID:`, tenant?.id)
    console.log(`[DashboardLayout] lastMessage updated:`, lastMessage)
    if (lastMessage) {
      if (lastMessage.type === 'collaboration.message' && lastMessage.data?.message) {
        dispatch(addToast({
          title: 'New Update',
          description: lastMessage.data.message,
          type: 'info'
        }))
      } else if (lastMessage.type === 'incident.created') {
         dispatch(addToast({
          title: 'Incident Created',
          description: `A new incident has been detected.`,
          type: 'warning'
        }))
      }
    }
  }, [lastMessage, dispatch])

  if (!isAuth) return null

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}