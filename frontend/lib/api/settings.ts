import { apiRequest, jsonBody } from './client'
import type { AppSettings } from './types'

export const settingsApi = {
  get: () => apiRequest<AppSettings>('/api/settings'),
  save: (settings: AppSettings) =>
    apiRequest<AppSettings>('/api/settings', {
      method: 'PUT',
      body: jsonBody(settings),
    }),
}
