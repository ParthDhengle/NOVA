'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  FileText,
  Pencil,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react'
import { streamRun } from '@/lib/api/activity'
import { approvalsApi } from '@/lib/api/approvals'
import { agentsApi } from '@/lib/api/agents'
import { ApiError } from '@/lib/api/client'
import { chatApi } from '@/lib/api/chat'
import { connectorsApi } from '@/lib/api/connectors'
import { filesApi } from '@/lib/api/files'
import { modelsApi } from '@/lib/api/models'
import { projectsApi } from '@/lib/api/projects'
import { settingsApi } from '@/lib/api/settings'
import { toolsApi } from '@/lib/api/tools'
import type {
  AgentEvent,
  Approval,
  ChatMessage as ApiChatMessage,
  Source,
  UploadedFile,
} from '@/lib/api/types'
import { IconButton } from '@/components/ui/IconButton'
import { ActivityPanel } from './ActivityPanel'
import { ApprovalCard } from './ApprovalCard'
import {
  Composer,
  type Option,
  type ToolOption,
  type ConnectorOption,
} from './Composer'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  sources?: Source[]
  streaming?: boolean
}

type UploadItem = {
  key: string
  file: File
  uploaded?: UploadedFile
  status: 'uploading' | 'ready' | 'error'
  error?: string
}

type Props = {
  newChat: number
  activeChatId: string | null
  projectId: string | null
  userName: string
  onChatChanged: () => void
}

function timeLabel(value = new Date().toISOString()) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function mapMessage(message: ApiChatMessage): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    time: timeLabel(message.created_at),
    sources: message.sources,
  }
}

export function ChatPage({ newChat, activeChatId, projectId, userName, onChatChanged }: Props) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'Chat' | 'Research'>('Chat')
  const [agent, setAgent] = useState('')
  const [model, setModel] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [streaming, setStreaming] = useState(false)
  const [approval, setApproval] = useState<Approval | null>(null)
  const [activity, setActivity] = useState(true)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [tools, setTools] = useState<ToolOption[]>([])
  const [agents, setAgents] = useState<Option[]>([])
  const [models, setModels] = useState<Option[]>([])
  const [connectors, setConnectors] = useState<ConnectorOption[]>([])
  const [projects, setProjects] = useState<Option[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [retryOptions, setRetryOptions] = useState(0)
  const [enterToSend, setEnterToSend] = useState<boolean | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const requestVersionRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => {
    requestVersionRef.current += 1
    stopRef.current?.()
    stopRef.current = null
  }, [])

  const loadOptions = useCallback(() => {
    setOptionsLoading(true)
    setOptionsError(null)
    Promise.all([
      toolsApi.list(),
      agentsApi.list(),
      modelsApi.list(),
      connectorsApi.list(),
      projectsApi.list(),
    ])
      .then(([toolItems, agentItems, modelItems, connectorItems, projectItems]) => {
        setTools(toolItems)
        setAgents(agentItems)
        setModels(modelItems)
        setConnectors(connectorItems.map((connector) => ({
          id: connector.id,
          name: connector.name,
          connected: connector.status === 'connected',
          enabled: connector.enabled,
        })))
        setProjects(projectItems.map(({ id, name }) => ({ id, name })))
      })
      .catch((cause: unknown) => {
        setOptionsError(cause instanceof ApiError ? cause.message : 'Unable to load chat options.')
      })
      .finally(() => setOptionsLoading(false))
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions, retryOptions])

  useEffect(() => {
    settingsApi.get()
      .then((settings) => {
        setEnterToSend(settings.enter_to_send)
        setAgent(settings.default_agent_id ?? '')
        setModel(settings.default_model_id ?? '')
      })
      .catch((cause: unknown) => {
        setRequestError(cause instanceof Error ? cause.message : 'Unable to load chat settings.')
      })
  }, [])

  useEffect(() => {
    if (!newChat) return
    requestVersionRef.current += 1
    stopRef.current?.()
    stopRef.current = null
    setChatId(null)
    setRunId(null)
    setInput('')
    setMessages([])
    setEvents([])
    setApproval(null)
    setStreaming(false)
    setChatError(null)
    setRequestError(null)
    setUploads([])
  }, [newChat])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, events, approval])

  const appendDelta = useCallback((delta: string) => {
    setMessages((current) => {
      const last = current[current.length - 1]
      if (last?.role === 'assistant' && last.streaming) {
        return [...current.slice(0, -1), { ...last, content: last.content + delta }]
      }
      return [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: delta,
          time: timeLabel(),
          streaming: true,
        },
      ]
    })
  }, [])

  const handleEvent = useCallback((event: AgentEvent) => {
    setRequestError(null)
    setEvents((current) => [...current, event])
    if (event.type === 'message_delta' && event.delta) appendDelta(event.delta)
    if (event.type === 'human_approval_required' && event.approval) {
      setApproval(event.approval)
    }
    if (event.type === 'error') {
      setRequestError(event.message ?? 'The agent run failed.')
      if (event.message) appendDelta(`\n\n${event.message}`)
    }
    if (event.type === 'run_complete' || event.type === 'error') {
      setStreaming(false)
      setMessages((current) =>
        current.map((message) => message.streaming ? { ...message, streaming: false } : message)
      )
      stopRef.current?.()
      stopRef.current = null
      onChatChanged()
      setRunId(null)
    }
  }, [appendDelta, onChatChanged])

  useEffect(() => {
    requestVersionRef.current += 1
    stopRef.current?.()
    stopRef.current = null
    setStreaming(false)
    setRunId(null)
    if (!activeChatId) {
      setChatId(null)
      setRunId(null)
      setMessages([])
      setEvents([])
      setApproval(null)
      setChatError(null)
      setChatLoading(false)
      return
    }
    let cancelled = false
    setChatLoading(true)
    setChatError(null)
    chatApi.get(activeChatId)
      .then((chat) => {
        if (cancelled) return
        setChatId(chat.id)
        setMessages(chat.messages.map(mapMessage))
        setEvents([])
        setApproval(null)
        if (chat.active_run_id) {
          setRunId(chat.active_run_id)
          setStreaming(true)
          stopRef.current = streamRun(chat.id, chat.active_run_id, handleEvent, (cause) => {
            setRequestError(cause.message)
            if (cause.message.includes('closed unexpectedly')) setStreaming(false)
          })
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setChatError(cause instanceof ApiError ? cause.message : 'Unable to load this conversation.')
        }
      })
      .finally(() => {
        if (!cancelled) setChatLoading(false)
      })
    return () => { cancelled = true }
  }, [activeChatId, handleEvent])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming || optionsLoading || optionsError) return
    const readyUploads = uploads.filter((item) => item.status === 'ready' && item.uploaded)
    setRequestError(null)
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', content: text, time: timeLabel() },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        time: timeLabel(),
        streaming: true,
      },
    ])
    setInput('')
    setStreaming(true)
    setEvents([])
    setApproval(null)
    setRunId(null)
    const requestVersion = ++requestVersionRef.current
    try {
      const result = await chatApi.send({
        message: text,
        chat_id: chatId ?? undefined,
        project_id: !chatId ? projectId ?? undefined : undefined,
        agent_id: agent || undefined,
        model_id: model || undefined,
        mode,
        tool_ids: selectedToolIds,
        connector_ids: connectors.filter((connector) => connector.enabled).map(({ id }) => id),
        file_ids: readyUploads.map((item) => item.uploaded!.id),
      })
      if (requestVersion !== requestVersionRef.current) {
        try {
          await chatApi.cancel(result.chat_id, result.run_id)
        } catch (cause) {
          setRequestError(cause instanceof Error ? cause.message : 'Unable to cancel the abandoned run.')
        }
        return
      }
      setChatId(result.chat_id)
      setRunId(result.run_id)
      setUploads((current) => current.filter((item) => !readyUploads.includes(item)))
      onChatChanged()
      stopRef.current = streamRun(result.chat_id, result.run_id, handleEvent, (error) => {
        setRequestError(error.message)
        if (error.message.includes('closed unexpectedly')) {
          setStreaming(false)
          setMessages((current) =>
            current.map((message) => message.streaming ? { ...message, streaming: false } : message)
          )
        }
      })
    } catch (cause) {
      if (requestVersion !== requestVersionRef.current) return
      setInput(text)
      setStreaming(false)
      setMessages((current) => current.filter((message) => !message.streaming))
      setRequestError(cause instanceof Error ? cause.message : 'Unable to send your message.')
    }
  }

  const stop = async () => {
    requestVersionRef.current += 1
    stopRef.current?.()
    stopRef.current = null
    setStreaming(false)
    setMessages((current) =>
      current.map((message) => message.streaming ? { ...message, streaming: false } : message)
    )
    if (chatId && runId) {
      try {
        await chatApi.cancel(chatId, runId)
      } catch (cause) {
        setRequestError(cause instanceof Error ? cause.message : 'Unable to stop the run.')
      }
    }
  }

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''
    for (const file of selectedFiles) {
      const key = crypto.randomUUID()
      setUploads((current) => [...current, { key, file, status: 'uploading' }])
      try {
        const uploaded = await filesApi.upload(file)
        setUploads((current) => current.map((item) =>
          item.key === key ? { ...item, uploaded, status: 'ready' } : item
        ))
      } catch (cause) {
        setUploads((current) => current.map((item) =>
          item.key === key
            ? { ...item, status: 'error', error: cause instanceof Error ? cause.message : 'Upload failed.' }
            : item
        ))
      }
    }
  }

  const retryUpload = async (item: UploadItem) => {
    setUploads((current) => current.map((file) =>
      file.key === item.key ? { ...file, status: 'uploading', error: undefined } : file
    ))
    try {
      const uploaded = await filesApi.upload(item.file)
      setUploads((current) => current.map((file) =>
        file.key === item.key ? { ...file, uploaded, status: 'ready' } : file
      ))
    } catch (cause) {
      setUploads((current) => current.map((file) =>
        file.key === item.key
          ? { ...file, status: 'error', error: cause instanceof Error ? cause.message : 'Upload failed.' }
          : file
      ))
    }
  }

  const onApproval = async (approved: boolean, values: Record<string, string> = {}) => {
    if (!approval) return
    setRequestError(null)
    try {
      await approvalsApi.respond(approval.id, { approved, values })
      setApproval(null)
    } catch (cause) {
      setRequestError(cause instanceof Error ? cause.message : 'Unable to submit this approval.')
    }
  }

  const toggleTool = (id: string) => {
    setSelectedToolIds((current) =>
      current.includes(id) ? current.filter((toolId) => toolId !== id) : [...current, id]
    )
    if (id === 'deep_research') {
      setMode((current) => current === 'Chat' ? 'Research' : 'Chat')
    }
  }

  const toggleConnector = async (id: string) => {
    const connector = connectors.find((item) => item.id === id)
    if (!connector) return
    setRequestError(null)
    try {
      const updated = await connectorsApi.setEnabled(id, !connector.enabled)
      setConnectors((current) => current.map((item) =>
        item.id === id ? { ...item, enabled: updated.enabled } : item
      ))
    } catch (cause) {
      setRequestError(cause instanceof Error ? cause.message : 'Unable to update connector.')
    }
  }

  const addToProject = async (projectId: string) => {
    if (!chatId) {
      setRequestError('Send a message before adding this conversation to a project.')
      return
    }
    setRequestError(null)
    try {
      await projectsApi.addChat(projectId, chatId)
    } catch (cause) {
      setRequestError(cause instanceof Error ? cause.message : 'Unable to add this conversation.')
    }
  }

  return (
    <div className="chat-page">
      <div className="page-top">
        <div>
          <span className="status"><i /> {streaming ? 'Running' : 'Ready'}</span>
          <h1>{mode === 'Research' ? 'What should I research?' : messages.length ? 'Chat' : 'New chat'}</h1>
          <p>{mode === 'Research'
            ? 'Compare, analyze, and investigate with a source-backed brief.'
            : 'A focused workspace for your agent run.'}</p>
        </div>
      </div>

      {(optionsError || chatError || requestError) && (
        <div className="request-error request-banner" role="alert">
          <span>{optionsError ?? chatError ?? requestError}</span>
          {optionsError && <button className="quiet" onClick={() => setRetryOptions((count) => count + 1)}>Retry</button>}
        </div>
      )}

      <div className="chat-scroll" ref={scrollRef}>
        {chatLoading && <p className="empty">Loading conversation…</p>}
        {!chatLoading && chatError && (
          <div className="empty" role="alert">
            <p>{chatError}</p>
            <button className="quiet" onClick={() => {
              if (activeChatId) {
                setChatError(null)
                setChatLoading(true)
                chatApi.get(activeChatId).then((chat) => {
                  setChatId(chat.id)
                  setMessages(chat.messages.map(mapMessage))
                }).catch((cause: unknown) => {
                  setChatError(cause instanceof Error ? cause.message : 'Unable to load this conversation.')
                }).finally(() => setChatLoading(false))
              }
            }}>Retry</button>
          </div>
        )}
        {!chatLoading && !chatError && messages.length === 0 && (
          <div className="chat-empty">
            <Sparkles />
            <p>{optionsLoading ? 'Loading agents and tools…' : `Send a message to start a run${agent ? ` with ${agents.find((item) => item.id === agent)?.name ?? agent}` : ''}.`}</p>
          </div>
        )}

        {messages.map((message) => message.role === 'user' ? (
          <div className="message user" key={message.id}>
            <span className="avatar">{userName.slice(0, 2).toUpperCase()}</span>
            <div>
              <div className="meta"><b>{userName}</b><small>{message.time}</small></div>
              <p>{message.content}</p>
            </div>
          </div>
        ) : (
          <div className="message assistant" key={message.id}>
            <span className="assistant-mark"><Sparkles /></span>
            <div>
              <div className="meta">
                <b>NOVA</b>
                <span className="tag">{message.streaming ? 'Streaming' : agents.find((item) => item.id === agent)?.name ?? 'Agent'}</span>
                <small>{message.time}</small>
              </div>
              <p>{message.content || (message.streaming ? 'Working through the request…' : '')}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <b>Sources</b>
                  {message.sources.map((source, index) => (
                    <a key={source.id} href={source.url ?? undefined} target={source.url ? '_blank' : undefined} rel="noreferrer">
                      <span>{index + 1}</span>{source.title}
                    </a>
                  ))}
                </div>
              )}
              {!message.streaming && message.content && (
                <div className="message-actions">
                  <IconButton label="Copy" onClick={() => void navigator.clipboard.writeText(message.content)}><Copy /></IconButton>
                  <IconButton label="Edit prompt"><Pencil /></IconButton>
                  <IconButton label="Retry"><Zap /></IconButton>
                  <span />
                  <IconButton label="Like"><ThumbsUp /></IconButton>
                  <IconButton label="Dislike"><ThumbsDown /></IconButton>
                </div>
              )}
            </div>
          </div>
        ))}

        {events.length > 0 && <ActivityPanel events={events} open={activity} setOpen={setActivity} live={streaming} />}
        {approval && <ApprovalCard onResult={onApproval} approval={approval} />}
      </div>

      <div className="composer-area">
        {optionsLoading && <p className="muted">Loading chat options…</p>}
        <Composer
          input={input}
          setInput={setInput}
          streaming={streaming}
          onSend={send}
          onStop={() => void stop()}
          onUpload={upload}
          agents={agents}
          agent={agent}
          setAgent={setAgent}
          models={models}
          model={model}
          setModel={setModel}
          tools={tools}
          selectedToolIds={selectedToolIds}
          onToggleTool={toggleTool}
          connectors={connectors}
          onToggleConnector={(id) => void toggleConnector(id)}
          projects={projects}
          onAddToProject={(id) => void addToProject(id)}
          disabled={optionsLoading || Boolean(optionsError) || chatLoading || uploads.some((item) => item.status !== 'ready')}
          enterToSend={enterToSend ?? false}
        />
        {uploads.length > 0 && (
          <div className="uploads">
            {uploads.map((item) => (
              <div key={item.key}>
                <FileText />
                <span>{item.file.name}</span>
                {item.status === 'uploading' && <span>Uploading…</span>}
                {item.status === 'error' && (
                  <>
                    <span role="alert">{item.error}</span>
                    <button className="quiet" onClick={() => void retryUpload(item)}>Retry</button>
                  </>
                )}
                {item.status === 'ready' && <Check />}
                <button
                  className="icon-button"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => setUploads((current) => current.filter((file) => file.key !== item.key))}
                ><X /></button>
              </div>
            ))}
          </div>
        )}
        <small className="composer-hint">NOVA can make mistakes. Review important information.</small>
      </div>
    </div>
  )
}
