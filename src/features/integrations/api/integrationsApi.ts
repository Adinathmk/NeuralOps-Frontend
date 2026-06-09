import apiClient from '@lib/axios'
import type { BackendResponse, GitHubIntegrationStatus, GitHubIntegrationFormData } from '@/types'

const unwrap = <T>(res: { data: BackendResponse<T> }) => res.data

export const integrationsApi = {
  // GET /api/v1/integrations/github/
  getGitHubIntegration: () =>
    apiClient.get<BackendResponse<GitHubIntegrationStatus>>('/integrations/github/').then(unwrap),

  // POST /api/v1/integrations/github/
  saveGitHubIntegration: (data: GitHubIntegrationFormData) => {
    const { webhook_secret, ...rest } = data
    const payload = { ...rest, webhook_secret_input: webhook_secret }
    return apiClient.post<BackendResponse<GitHubIntegrationStatus>>('/integrations/github/', payload).then(unwrap)
  },

  // DELETE /api/v1/integrations/github/
  deleteGitHubIntegration: () =>
    apiClient.delete<BackendResponse<void>>('/integrations/github/').then(unwrap),
}
