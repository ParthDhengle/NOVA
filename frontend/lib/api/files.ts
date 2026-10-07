import { apiRequest } from './client'
import type { UploadedFile } from './types'

export const filesApi = {
  upload: (file: File, projectId?: string) => {
    const body = new FormData()
    body.append('file', file)
    if (projectId) body.append('project_id', projectId)
    return apiRequest<UploadedFile>('/api/files/upload', {
      method: 'POST',
      body,
    })
  },
}
