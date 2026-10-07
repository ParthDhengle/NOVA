import { parseAgentEvent } from './event-parser'
import type { AgentEvent } from '@/lib/api/types'

export function connectSSE(
  url: string,
  onEvent: (event: AgentEvent) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
): () => void {
  const source = new EventSource(url, { withCredentials: true })
  let closed = false

  source.onmessage = (message) => {
    try {
      onEvent(parseAgentEvent(message.data))
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Invalid stream event.'))
    }
  }
  source.onerror = () => {
    onError?.(
      new Error(
        source.readyState === EventSource.CLOSED
          ? 'The agent event stream closed unexpectedly.'
          : 'The agent event stream disconnected and is reconnecting.'
      )
    )
    if (source.readyState === EventSource.CLOSED) cleanup()
  }
  signal?.addEventListener('abort', cleanup, { once: true })

  function cleanup() {
    if (closed) return
    closed = true
    signal?.removeEventListener('abort', cleanup)
    source.close()
  }

  return cleanup
}
