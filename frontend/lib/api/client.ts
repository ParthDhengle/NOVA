import type { ApiErrorBody } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.')
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

async function throwApiError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null
  const detail = body?.detail
  const validationMessages = Array.isArray(detail)
    ? detail.flatMap((issue) =>
        typeof issue === 'object' && issue !== null && 'msg' in issue && typeof issue.msg === 'string'
          ? [issue.msg]
          : []
      ).join('; ')
    : ''
  const message =
    (typeof detail === 'string' ? detail : Array.isArray(detail) ? validationMessages : detail?.message) ??
    body?.message ??
    response.statusText ??
    'The request failed.'
  throw new ApiError(message, response.status, body?.code)
}

export async function apiResponse(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', headers.get('Accept') ?? 'application/json')
  if (
    typeof window !== 'undefined' &&
    !path.startsWith('/api/auth/login') &&
    !path.startsWith('/api/auth/register')
  ) {
    const token = localStorage.getItem('nova_token')

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  })
  if (
    response.status === 401 &&
    !path.startsWith('/api/auth/') &&
    typeof window !== 'undefined'
  ) {
    window.dispatchEvent(new Event('nova:unauthorized'))
  }
  if (!response.ok) await throwApiError(response)
  return response
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await apiResponse(path, init)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value)
}
