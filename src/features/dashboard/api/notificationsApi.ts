import apiClient from '@lib/axios'
import type { Notification } from '@/types'

export const notificationsApi = {
  // GET /api/users/:userId/notifications
  listByUser: (userId: string) =>
    apiClient.get<Notification[]>(`/users/${userId}/notifications`),

  // PATCH /api/notifications/:id/read
  markRead: (notificationId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read`),
}
