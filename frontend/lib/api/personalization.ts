import { apiRequest, jsonBody } from './client'
import type { Memory, Personalization } from './types'

export const personalizationApi = {
  get: () => apiRequest<Personalization>('/api/personalization'),
  save: (preferences: Personalization) =>
    apiRequest<Personalization>('/api/personalization', {
      method: 'PUT',
      body: jsonBody(preferences),
    }),
  listMemories: () => apiRequest<Memory[]>('/api/memory'),
  createMemory: (text: string) =>
    apiRequest<Memory>('/api/memory', {
      method: 'POST',
      body: jsonBody({ text }),
    }),
  updateMemory: (id: string, text: string) =>
    apiRequest<Memory>(`/api/memory/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: jsonBody({ text }),
    }),
  deleteMemory: (id: string) =>
    apiRequest<void>(`/api/memory/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  clearMemories: () => apiRequest<void>('/api/memory', { method: 'DELETE' }),
}
