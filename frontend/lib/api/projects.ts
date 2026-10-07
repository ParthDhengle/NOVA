import { apiRequest, jsonBody } from './client'
import type { Chat, Memory, Project, UploadedFile } from './types'

export type CreateProjectRequest = Pick<Project, 'name' | 'description' | 'instructions'>

export const projectsApi = {
  list: () => apiRequest<Project[]>('/api/projects'),
  create: (project: CreateProjectRequest) =>
    apiRequest<Project>('/api/projects', {
      method: 'POST',
      body: jsonBody(project),
    }),
  update: (projectId: string, patch: Partial<CreateProjectRequest>) =>
    apiRequest<Project>(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      body: jsonBody(patch),
    }),
  chats: (projectId: string) =>
    apiRequest<Chat[]>(`/api/projects/${encodeURIComponent(projectId)}/chats`),
  files: (projectId: string) =>
    apiRequest<UploadedFile[]>(`/api/projects/${encodeURIComponent(projectId)}/files`),
  memories: (projectId: string) =>
    apiRequest<Memory[]>(`/api/projects/${encodeURIComponent(projectId)}/memory`),
  addChat: (projectId: string, chatId: string) =>
    apiRequest<void>(`/api/projects/${encodeURIComponent(projectId)}/chats`, {
      method: 'POST',
      body: jsonBody({ chat_id: chatId }),
    }),
}
