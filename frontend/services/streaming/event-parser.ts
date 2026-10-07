import type { AgentEvent } from '@/lib/api/types'

const eventTypes = new Set<AgentEvent['type']>([
  'run_start',
  'agent_start',
  'agent_end',
  'tool_start',
  'tool_end',
  'message_delta',
  'human_approval_required',
  'error',
  'run_complete',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApproval(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.action !== 'string'
  ) return false
  if (value.fields === undefined) return true
  if (!Array.isArray(value.fields)) return false
  return value.fields.every((field: unknown) =>
    isRecord(field) &&
    typeof field.label === 'string' &&
    (field.type === 'text' || field.type === 'select') &&
    (field.options === undefined ||
      (Array.isArray(field.options) && field.options.every((option) => typeof option === 'string')))
  )
}

export function parseAgentEvent(input: string | unknown): AgentEvent {
  const value: unknown = typeof input === 'string' ? JSON.parse(input) : input
  if (!isRecord(value) || typeof value.type !== 'string' || !eventTypes.has(value.type as AgentEvent['type']) || typeof value.run_id !== 'string') {
    throw new Error('The server sent an invalid agent event.')
  }
  for (const key of ['agent', 'tool', 'message', 'delta']) {
    if (value[key] !== undefined && typeof value[key] !== 'string') {
      throw new Error(`The server sent an invalid agent event (${key}).`)
    }
  }
  if (value.type === 'message_delta' && typeof value.delta !== 'string') {
    throw new Error('The server sent an invalid message delta.')
  }
  if (value.type === 'human_approval_required' && !isApproval(value.approval)) {
    throw new Error('The server sent an invalid approval request.')
  }
  return value as AgentEvent
}

export function eventLabel(event: AgentEvent): string {
  return event.message || event.tool || event.agent || event.type.replaceAll('_', ' ')
}
