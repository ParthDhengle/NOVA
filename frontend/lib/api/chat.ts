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
