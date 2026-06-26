import apiClient from '@lib/axios'
import type { BackendResponse, GitHubIntegrationStatus, GitHubIntegrationFormData } from '@/types'

const unwrap = <T>(res: { data: BackendResponse<T> }) => res.data

export const integrationsApi = {
  // GET /api/v1/integrations/github/
  getGitHubIntegration: () =>
    apiClient.get<BackendResponse<GitHubIntegrationStatus>>('/integrations/github/').then(unwrap),

  // POST /api/v1/integrations/github/
  saveGitHubIntegration: (data: GitHubIntegrationFormData) => {
    return apiClient.post<BackendResponse<GitHubIntegrationStatus>>('/integrations/github/', data).then(unwrap)
  },

  // DELETE /api/v1/integrations/github/
  deleteGitHubIntegration: () =>
    apiClient.delete<BackendResponse<void>>('/integrations/github/').then(unwrap),

  // GET /api/v1/integrations/github/available-repos/
  getAvailableRepos: (installationId: number) =>
    apiClient.get<BackendResponse<{ repositories: Array<{ id: number; name: string; full_name: string; owner: string; html_url: string }> }>>(`/integrations/github/available-repos/?installation_id=${installationId}`).then(unwrap),
}
