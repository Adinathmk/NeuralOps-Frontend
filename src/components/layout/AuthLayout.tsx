import { Outlet } from 'react-router-dom'
import { ToastContainer } from './ToastContainer'
import { ThemeToggle } from '@components/ui/ThemeToggle'

export function AuthLayout() {
  return (
    <>
      <div className="absolute top-4 right-6 z-50">
        <ThemeToggle />
      </div>
      <Outlet />
      <ToastContainer />
    </>
  )
}