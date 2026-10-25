
import { parseAgentEvent } from './event-parser'
import type { AgentEvent } from '@/lib/api/types'

export function connectSSE(
  url: string,
  onEvent: (event: AgentEvent) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
): () => void {
  const controller = new AbortController()

  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })

  async function connect() {
    try {
      const token = localStorage.getItem('nova_token')

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.')
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        credentials: 'include',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('Streaming is not supported by this response.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const data = event
            .split('\n')
            .find(line => line.startsWith('data:'))
            ?.slice(5)
            .trim()

          if (data) onEvent(parseAgentEvent(data))
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return
      onError?.(error instanceof Error ? error : new Error('Stream failed.'))
    } finally {
      signal?.removeEventListener('abort', abort)
    }
  }

  void connect()
  return abort
}
