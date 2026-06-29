import apiClient from '@lib/axios'

export interface APIKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface CreateAPIKeyResponse {
  id: string
  name: string
  key: string
  created_at: string
}

export const apiKeysApi = {
  listKeys: async (): Promise<APIKey[]> => {
    const res = await apiClient.get('/team/api-keys')
    return res.data.data
  },
  createKey: async (name: string): Promise<CreateAPIKeyResponse> => {
    const res = await apiClient.post('/team/api-keys/create', { name })
    return res.data.data
  },
  revokeKey: async (id: string): Promise<void> => {
    await apiClient.post(`/team/api-keys/${id}/revoke`)
  }
}
