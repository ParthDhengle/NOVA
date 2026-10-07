import { apiRequest } from './client'
import type { Model } from './types'

export const modelsApi = {
  list: () => apiRequest<Model[]>('/api/models'),
}
