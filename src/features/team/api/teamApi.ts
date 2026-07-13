import apiClient from '@lib/axios'
import type { User, BackendResponse } from '@/types'

export const teamApi = {
  /**
   * List all users (teammates) in the current workspace.
   */
  listMembers: async () => {
    const response = await apiClient.get<BackendResponse<User[]>>('/team/members')
    return response.data
  },
  
  /**
   * Update a team member's role.
   */
  updateRole: async (memberId: string, role: string) => {
    const response = await apiClient.patch<BackendResponse<User>>(`/team/members/${memberId}/role`, { role })
    return response.data
  },
}
