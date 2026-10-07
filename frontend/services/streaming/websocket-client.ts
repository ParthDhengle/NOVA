import { parseAgentEvent } from './event-parser'
import type { AgentEvent } from '@/lib/api/types'

export type AgentSocket = {
  send: (payload: unknown) => void
  close: () => void
}

export function connectWebSocket(
  url: string,
  onEvent: (event: AgentEvent) => void,
  onError?: (error: Error) => void
): AgentSocket {
  const socket = new WebSocket(url)
  socket.onmessage = (message: MessageEvent<string>) => {
    try {
      onEvent(parseAgentEvent(message.data))
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Invalid stream event.'))
    }
  }
  socket.onerror = () => onError?.(new Error('The agent event socket failed.'))
  return {
    send: (payload) => {
      if (socket.readyState !== WebSocket.OPEN) {
        onError?.(new Error('The agent event socket is not connected.'))
        return
      }
      socket.send(JSON.stringify(payload))
    },
    close: () => socket.close(),
  }
}
