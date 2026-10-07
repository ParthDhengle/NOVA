import { apiRequest } from './client'
import type { Tool } from './types'

export const toolsApi = {
  list: () => apiRequest<Tool[]>('/api/tools'),
}
