export type User = {
  id: string
  email: string
  username: string
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
