'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUp,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FolderPlus,
  Paperclip,
  Pause,
  Plug,
  Plus,
  Wrench,
  X,
} from 'lucide-react'

export type Option = { id: string; name: string; description?: string }
export type ToolOption = Option & { enabled?: boolean }
export type ConnectorOption = { id: string; name: string; connected: boolean; enabled: boolean }

type Props = {
  input: string
  setInput: (v: string) => void
  streaming: boolean
  onSend: () => void
  onStop: () => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void

  // All of the following come from hooks -> services -> FastAPI (never hard-coded here)
  tools: ToolOption[]
  selectedToolIds: string[]
  onToggleTool: (id: string) => void

  agents: Option[]
  agent: string
  setAgent: (id: string) => void

  models: Option[]
  model: string
  setModel: (id: string) => void

  connectors: ConnectorOption[]
  onToggleConnector: (id: string) => void

  projects: Option[]
  onAddToProject: (projectId: string) => void
  disabled?: boolean
  enterToSend: boolean
}

type View = 'root' | 'agent' | 'model' | 'connectors' | 'project'

export function Composer(p: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('root')
  const wrapRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const close = () => {
    setOpen(false)
    setView('root')
  }

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Ctrl/Cmd + U -> file picker
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        fileRef.current?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [p.input])

  const isResearch = p.selectedToolIds.includes('deep_research')
  const activeTools = p.tools.filter((t) => p.selectedToolIds.includes(t.id))
  const agentName = p.agents.find((a) => a.id === p.agent)?.name
  const modelName = p.models.find((m) => m.id === p.model)?.name

  return (
    <div className="composer">
      {(activeTools.length > 0 || agentName || modelName) && (
        <div className="composer-chips" aria-label="Active selections">
          {agentName && <span className="chip mono">{agentName}</span>}
          {modelName && <span className="chip mono">{modelName}</span>}
          {activeTools.map((t) => (
            <span key={t.id} className="chip accent">
              {t.name}
              <button
                aria-label={`Disable ${t.name}`}
                onClick={() => p.onToggleTool(t.id)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        disabled={p.disabled}
        ref={textRef}
        rows={1}
        value={p.input}
        onChange={(e) => p.setInput(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            p.enterToSend &&
            !e.shiftKey &&
            !e.nativeEvent.isComposing &&
            e.keyCode !== 229
          ) {
            e.preventDefault()
            if (!p.streaming && !p.disabled) p.onSend()
          }
        }}
        placeholder={isResearch ? 'Ask a research question...' : 'Message NOVA...'}
      />

      <div className="composer-row">
        <div className="menu-wrap" ref={wrapRef}>
          <button
            className="icon-button"
            aria-label="Add and tools"
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={p.disabled}
            onClick={() => (open ? close() : setOpen(true))}
          >
            <Plus />
          </button>

          {open && (
            <div className="plus-menu" role="menu">
              {view === 'root' && (
                <>
                  <MenuItem
                    icon={<Paperclip />}
                    label="Add files or photos"
                    hint="Ctrl+U"
                    onClick={() => {
                      fileRef.current?.click()
                      close()
                    }}
                  />
                  {p.projects.length > 0 && (
                    <MenuItem
                      icon={<FolderPlus />}
                      label="Add to project"
                      chevron
                      onClick={() => setView('project')}
                    />
                  )}

                  <Divider />

                  <MenuItem
                    icon={<Bot />}
                    label="Agent"
                    hint={agentName}
                    chevron
                    onClick={() => setView('agent')}
                  />
                  <MenuItem
                    icon={<Cpu />}
                    label="Model"
                    hint={modelName}
                    chevron
                    onClick={() => setView('model')}
                  />
                  <MenuItem
                    icon={<Plug />}
                    label="Connectors"
                    chevron
                    onClick={() => setView('connectors')}
                  />

                  {p.tools.length > 0 && <Divider />}

                  <div className="menu-scroll">
                    {p.tools.map((t) => (
                      <MenuItem
                        key={t.id}
                        icon={<Wrench />}
                        label={t.name}
                        title={t.description}
                        disabled={t.enabled === false}
                        checked={p.selectedToolIds.includes(t.id)}
                        onClick={() => p.onToggleTool(t.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {view === 'agent' && (
                <SubView title="Agent" onBack={() => setView('root')}>
                  {p.agents.map((a) => (
                    <MenuItem
                      key={a.id}
                      label={a.name}
                      title={a.description}
                      checked={p.agent === a.id}
                      onClick={() => {
                        p.setAgent(a.id)
                        close()
                      }}
                    />
                  ))}
                </SubView>
              )}

              {view === 'model' && (
                <SubView title="Model" onBack={() => setView('root')}>
                  {p.models.map((m) => (
                    <MenuItem
                      key={m.id}
                      label={m.name}
                      title={m.description}
                      checked={p.model === m.id}
                      onClick={() => {
                        p.setModel(m.id)
                        close()
                      }}
                    />
                  ))}
                </SubView>
              )}

              {view === 'connectors' && (
                <SubView title="Connectors" onBack={() => setView('root')}>
                  {p.connectors.map((c) => (
                    <MenuItem
                      key={c.id}
                      label={c.name}
                      hint={c.connected ? undefined : 'Not connected'}
                      disabled={!c.connected}
                      checked={c.connected && c.enabled}
                      onClick={() => p.onToggleConnector(c.id)}
                    />
                  ))}
                  <Divider />
                  <Link href="/connectors" className="menu-item" onClick={close}>
                    <span className="menu-label">Manage connectors</span>
                  </Link>
                </SubView>
              )}

              {view === 'project' && (
                <SubView title="Add to project" onBack={() => setView('root')}>
                  {p.projects.map((pr) => (
                    <MenuItem
                      key={pr.id}
                      label={pr.name}
                      onClick={() => {
                        p.onAddToProject(pr.id)
                        close()
                      }}
                    />
                  ))}
                </SubView>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" multiple hidden onChange={p.onUpload} />
        </div>

        <button
          className="send"
          disabled={p.disabled}
          onClick={p.streaming ? p.onStop : p.onSend}
          aria-label={p.streaming ? 'Stop generation' : 'Send message'}
        >
          {p.streaming ? <Pause /> : <ArrowUp />}
        </button>
      </div>
    </div>
  )
}

/* ---------- small internal pieces ---------- */

function MenuItem(props: {
  label: string
  icon?: React.ReactNode
  hint?: string
  title?: string
  chevron?: boolean
  checked?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      role="menuitem"
      className="menu-item"
      title={props.title}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.icon && <span className="menu-icon">{props.icon}</span>}
      <span className="menu-label">{props.label}</span>
      {props.hint && <span className="menu-hint">{props.hint}</span>}
      {props.chevron && <ChevronRight className="menu-trail" />}
      {props.checked && <Check className="menu-check" />}
    </button>
  )
}

function SubView(props: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <>
      <button className="menu-item menu-back" onClick={props.onBack}>
        <ChevronLeft className="menu-icon" />
        <span className="menu-label">{props.title}</span>
      </button>
      <Divider />
      <div className="menu-scroll">{props.children}</div>
    </>
  )
}

const Divider = () => <div className="menu-divider" role="separator" />