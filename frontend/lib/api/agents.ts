import { apiRequest } from './client'
import type { Agent } from './types'

export const agentsApi = {
  list: () => apiRequest<Agent[]>('/api/agents'),
}
