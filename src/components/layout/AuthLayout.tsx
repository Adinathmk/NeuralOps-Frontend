import { Outlet } from 'react-router-dom'
import { ToastContainer } from './ToastContainer'

export function AuthLayout() {
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  )
}