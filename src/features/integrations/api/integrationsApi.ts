import apiClient from '@lib/axios'
import type { BackendResponse, GitHubIntegrationStatus, GitHubIntegrationFormData } from '@/types'

const unwrap = <T>(res: { data: BackendResponse<T> }) => res.data

export const integrationsApi = {
  // GET /api/v1/integrations/github/
  getGitHubIntegrations: () =>
    apiClient.get<BackendResponse<GitHubIntegrationStatus[]>>('/integrations/github/').then(unwrap),

  // POST /api/v1/integrations/github/
  saveGitHubIntegration: (data: GitHubIntegrationFormData) => {
    return apiClient.post<BackendResponse<GitHubIntegrationStatus>>('/integrations/github/', data).then(unwrap)
  },

  // DELETE /api/v1/integrations/github/:id/
  deleteGitHubIntegration: (id: number) =>
    apiClient.delete<BackendResponse<void>>(`/integrations/github/${id}/`).then(unwrap),

  // GET /api/v1/integrations/github/available-repos/
  getAvailableRepos: (installationId: number) =>
    apiClient.get<BackendResponse<{ repositories: Array<{ id: number; name: string; full_name: string; owner: string; html_url: string }> }>>(`/integrations/github/available-repos/?installation_id=${installationId}`).then(unwrap),

  // GET /api/v1/integrations/mappings/
  getServiceMappings: () =>
    apiClient.get<BackendResponse<import('@/types').ServiceRepoMapping[]>>('/integrations/mappings/').then(unwrap),

  // POST /api/v1/integrations/mappings/
  createServiceMapping: (data: import('@/types').ServiceRepoMappingFormData) =>
    apiClient.post<BackendResponse<import('@/types').ServiceRepoMapping>>('/integrations/mappings/', data).then(unwrap),

  // DELETE /api/v1/integrations/mappings/:id/
  deleteServiceMapping: (id: string) =>
    apiClient.delete<BackendResponse<void>>(`/integrations/mappings/${id}/`).then(unwrap),
}
