import { apiRequest } from './client'
import type { SearchResult } from './types'

export const searchApi = {
  search: (query: string, signal?: AbortSignal) =>
    apiRequest<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`, {
      signal,
    }),
}
