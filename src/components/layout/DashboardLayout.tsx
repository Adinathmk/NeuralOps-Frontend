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
import { updateGitHubIntegrationStatus } from '@store/slices/integrationsSlice'
import { patchIncidentInStore } from '@store/slices/incidentsSlice'
import { appendMessage, replaceMessage } from '@store/slices/collaborationSlice'

import { fetchMeThunk } from '@store/slices/authSlice'

export function DashboardLayout() {
  const isAuth = useRequireAuth()
  const { tenant, user } = useAuth()
  const dispatch = useAppDispatch()

  const { lastMessage: collabMessage } = useWebSocket(tenant ? `/ws/collaboration/${tenant.id}/` : null)
  const { lastMessage: notifMessage } = useWebSocket((tenant && user) ? `/ws/notifications/${user.id}/` : null)

  useEffect(() => {
    if (isAuth) {
      dispatch(fetchMeThunk())
    }
  }, [isAuth, dispatch])

  const handleMessage = (msg: any) => {
    if (!msg) return
    if (msg.type === 'collaboration.message' && msg.data) {
      const { incident_id, message } = msg.data
      if (incident_id && message) {
        if (message.is_deleted) {
          dispatch(replaceMessage({ incidentId: incident_id, message }))
        } else {
          dispatch(appendMessage({ incidentId: incident_id, message }))
        }
      }
    } else if (msg.type === 'incident.updated' && msg.data) {
      dispatch(patchIncidentInStore({
        id: msg.data.incident_id,
        status: msg.data.status,
        assigned_user_ids: msg.data.assigned_user_ids,
        updated_at: msg.data.updated_at,
      }))
    } else if (msg.type === 'incident.created') {
      dispatch(addToast({
        title: 'Incident Created',
        description: `A new incident has been detected.`,
        type: 'warning'
      }))
    } else if (msg.type === 'notification.new') {
      import('@store/slices/notificationsSlice').then(({ pushNotification }) => {
        dispatch(pushNotification(msg.data))
      })
      dispatch(addToast({
        title: msg.data.title || 'New Notification',
        description: msg.data.body || 'You have a new notification.',
        type: 'info'
      }))
    } else if (msg.type === 'collaboration.github_indexing') {
      dispatch(updateGitHubIntegrationStatus(msg.data))
      if (msg.data.status === 'indexed') {
        dispatch(addToast({
          title: 'GitHub Integration',
          description: 'Repository indexing complete.',
          type: 'success'
        }))
      } else if (msg.data.status === 'failed') {
        dispatch(addToast({
          title: 'GitHub Integration',
          description: 'Repository indexing failed.',
          type: 'error'
        }))
      }
    }
  }

  useEffect(() => {
    handleMessage(collabMessage)
  }, [collabMessage, dispatch])

  useEffect(() => {
    handleMessage(notifMessage)
  }, [notifMessage, dispatch])


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