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
