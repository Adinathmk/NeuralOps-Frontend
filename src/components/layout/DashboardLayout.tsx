import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from './ToastContainer'
import { useRequireAuth } from '@hooks/useProtectedRoute'

export function DashboardLayout() {
  const isAuth = useRequireAuth()
  if (!isAuth) return null

  return (
    <div className="flex h-screen w-full bg-surface-0 overflow-hidden">
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