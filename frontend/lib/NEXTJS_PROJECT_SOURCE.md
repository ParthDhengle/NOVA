# Next.js Project Source

This document contains source files from selected Next.js project directories and configuration files.

**Project root:** `C:\Users\parth\Desktop\Projects\NOVA\frontend\lib`

**Files included:** 15

---

## `api\activity.ts`

**File:** `api\activity.ts`

```text
import { apiUrl } from './client'
import { connectSSE } from '@/services/streaming/sse-client'
import type { AgentEvent } from './types'

export function streamRun(
  chatId: string,
  runId: string,
  onEvent: (event: AgentEvent) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): () => void {
  const url = `${apiUrl(`/api/chat/${encodeURIComponent(chatId)}/stream`)}?run_id=${encodeURIComponent(runId)}`
  return connectSSE(url, onEvent, onError, signal)
}
```

---

## `api\agents.ts`

**File:** `api\agents.ts`

```text
import { apiRequest } from './client'
import type { Agent } from './types'

export const agentsApi = {
  list: () => apiRequest<Agent[]>('/api/agents'),
}
```

---

## `api\approvals.ts`

**File:** `api\approvals.ts`

```text
import { apiRequest, jsonBody } from './client'

export type ApprovalResponse = {
  approved: boolean
  values: Record<string, string>
}

export const approvalsApi = {
  respond: (approvalId: string, response: ApprovalResponse) =>
    apiRequest<void>(`/api/approvals/${encodeURIComponent(approvalId)}`, {
      method: 'POST',
      body: jsonBody(response),
    }),
}
```

---

## `api\auth.ts`

**File:** `api\auth.ts`

```text
import { apiRequest, jsonBody } from './client'
import type { User } from './types'

export type Credentials = { email: string; password: string }
export type Registration = Credentials & { name: string }

export const authApi = {
  login: (credentials: Credentials) =>
    apiRequest<User>('/api/auth/login', {
      method: 'POST',
      body: jsonBody(credentials),
    }),
  register: (registration: Registration) =>
    apiRequest<User>('/api/auth/register', {
      method: 'POST',
      body: jsonBody(registration),
    }),
  logout: () =>
    apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    }),
  currentUser: () => apiRequest<User>('/api/auth/me'),
}
```

---

## `api\chat.ts`

**File:** `api\chat.ts`

```text
import { apiRequest, jsonBody } from './client'
import type { Chat, ChatDetail } from './types'

export type SendMessageRequest = {
  message: string
  chat_id?: string
  project_id?: string
  agent_id?: string
  model_id?: string
  mode: 'Chat' | 'Research'
  tool_ids: string[]
  connector_ids: string[]
  file_ids: string[]
}

export type StartRunResponse = {
  chat_id: string
  run_id: string
}

export const chatApi = {
  list: () => apiRequest<Chat[]>('/api/chats'),
  get: (chatId: string) =>
    apiRequest<ChatDetail>(`/api/chats/${encodeURIComponent(chatId)}`),
  send: (request: SendMessageRequest) =>
    apiRequest<StartRunResponse>('/api/chat', {
      method: 'POST',
      body: jsonBody(request),
    }),
  cancel: (chatId: string, runId: string) =>
    apiRequest<void>(`/api/chat/${encodeURIComponent(chatId)}/cancel`, {
      method: 'POST',
      body: jsonBody({ run_id: runId }),
    }),
}
```

---

## `api\client.ts`

**File:** `api\client.ts`

```text
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
```

---

## `api\connectors.ts`

**File:** `api\connectors.ts`

```text
import { apiRequest, jsonBody } from './client'
import type { Connector } from './types'

export const connectorsApi = {
  list: () => apiRequest<Connector[]>('/api/connectors'),
  catalog: () => apiRequest<Connector[]>('/api/connectors/catalog'),
  connect: (connectorId: string) =>
    apiRequest<Connector>(`/api/connectors/${encodeURIComponent(connectorId)}/connect`, {
      method: 'POST',
      body: jsonBody({}),
    }),
  disconnect: (connectorId: string) =>
    apiRequest<Connector>(`/api/connectors/${encodeURIComponent(connectorId)}/disconnect`, {
      method: 'POST',
      body: jsonBody({}),
    }),
  setEnabled: (connectorId: string, enabled: boolean) =>
    apiRequest<Connector>(`/api/connectors/${encodeURIComponent(connectorId)}`, {
      method: 'PATCH',
      body: jsonBody({ enabled }),
    }),
  remove: (connectorId: string) =>
    apiRequest<void>(`/api/connectors/${encodeURIComponent(connectorId)}`, {
      method: 'DELETE',
    }),
}
```

---

## `api\files.ts`

**File:** `api\files.ts`

```text
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
```

---

## `api\models.ts`

**File:** `api\models.ts`

```text
import { apiRequest } from './client'
import type { Model } from './types'

export const modelsApi = {
  list: () => apiRequest<Model[]>('/api/models'),
}
```

---

## `api\personalization.ts`

**File:** `api\personalization.ts`

```text
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
```

---

## `api\projects.ts`

**File:** `api\projects.ts`

```text
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
```

---

## `api\search.ts`

**File:** `api\search.ts`

```text
import { apiRequest } from './client'
import type { SearchResult } from './types'

export const searchApi = {
  search: (query: string, signal?: AbortSignal) =>
    apiRequest<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`, {
      signal,
    }),
}
```

---

## `api\settings.ts`

**File:** `api\settings.ts`

```text
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
```

---

## `api\tools.ts`

**File:** `api\tools.ts`

```text
import { apiRequest } from './client'
import type { Tool } from './types'

export const toolsApi = {
  list: () => apiRequest<Tool[]>('/api/tools'),
}
```

---

## `api\types.ts`

**File:** `api\types.ts`

```text
export type User = {
  id: string
  email: string
  name: string
  avatar_url?: string | null
}

export type Agent = {
  id: string
  name: string
  description?: string
}

export type Model = {
  id: string
  name: string
  description?: string
}

export type Tool = {
  id: string
  name: string
  description?: string
  enabled: boolean
}

export type Connector = {
  id: string
  name: string
  description: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  enabled: boolean
  tools: string[]
  permissions: string[]
  authorization_url?: string | null
}

export type Project = {
  id: string
  name: string
  description: string
  chats: number
  files: number
  instructions: string
}

export type Chat = {
  id: string
  title: string
  created_at: string
  updated_at: string
  pinned: boolean
  archived: boolean
}

export type Source = {
  id: string
  title: string
  meta?: string
  url?: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  sources?: Source[]
}

export type ChatDetail = Chat & {
  messages: ChatMessage[]
  active_run_id?: string | null
}

export type ApprovalField = {
  label: string
  type: 'text' | 'select'
  options?: string[]
}

export type Approval = {
  id: string
  title: string
  description: string
  action: string
  fields?: ApprovalField[]
}

export type AgentEvent = {
  type:
    | 'run_start'
    | 'agent_start'
    | 'agent_end'
    | 'tool_start'
    | 'tool_end'
    | 'message_delta'
    | 'human_approval_required'
    | 'error'
    | 'run_complete'
  run_id: string
  agent?: string
  tool?: string
  message?: string
  delta?: string
  approval?: Approval
}

export type Memory = {
  id: string
  text: string
  created_at: string
}

export type Personalization = {
  instructions: string
  memory_enabled: boolean
  response_length: 'Concise' | 'Balanced' | 'Detailed'
  tone: 'Professional' | 'Friendly' | 'Direct'
  technical_depth: 'Simple' | 'Advanced' | 'Expert'
  language: string
}

export type AppSettings = {
  theme: 'Dark' | 'Light' | 'System'
  accent_color: string
  enter_to_send: boolean
  default_agent_id: string | null
  default_model_id: string | null
  chat_history_enabled: boolean
  product_improvement_enabled: boolean
  source_citations_enabled: boolean
}

export type SearchResult = {
  id: string
  title: string
  type: 'chat' | 'project' | 'connector'
  resource_id: string
}

export type UploadedFile = {
  id: string
  name: string
  size: number
  content_type: string
}

export type ApiErrorBody = {
  detail?: string | { message?: string; [key: string]: unknown } | unknown[]
  message?: string
  code?: string
}
```

---

