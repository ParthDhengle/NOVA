'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { agentsApi } from '@/lib/api/agents'
import { modelsApi } from '@/lib/api/models'
import { settingsApi } from '@/lib/api/settings'
import type { Agent, AppSettings, Model } from '@/lib/api/types'
import { Toggle } from '@/components/common/Toggle'

const ACCENTS = ['#8ed8ff', '#b9a7ff', '#8ff0c2', '#ffc47a', '#ff9caa']

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([settingsApi.get(), agentsApi.list(), modelsApi.list()])
      .then(([savedSettings, availableAgents, availableModels]) => {
        setSettings(savedSettings)
        setAgents(availableAgents)
        setModels(availableModels)
      })
      .catch((cause: unknown) => setError(
        cause instanceof ApiError ? cause.message : 'Unable to load settings.'
      ))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, retry])

  useEffect(() => {
    if (!settings) return
    document.documentElement.dataset.theme = settings.theme.toLowerCase()
    document.documentElement.style.colorScheme =
      settings.theme === 'System' ? 'light dark' : settings.theme.toLowerCase()
    document.documentElement.style.setProperty('--accent', settings.accent_color)
  }, [settings])

  const update = async (patch: Partial<AppSettings>) => {
    if (!settings) return
    const previous = settings
    const next = { ...settings, ...patch }
    setSettings(next)
    setSaving(true)
    setError(null)
    try {
      setSettings(await settingsApi.save(next))
    } catch (cause) {
      setSettings(previous)
      setError(cause instanceof Error ? cause.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Settings</h1>
          <p>Configure appearance, chat behavior, privacy, and shortcuts.</p>
        </div>
      </header>

      {error && <div className="request-error request-banner" role="alert">
        <span>{error}</span><button className="quiet" onClick={() => setRetry((value) => value + 1)}>Retry</button>
      </div>}
      {saving && <p className="muted" role="status">Saving settings…</p>}
      {loading && <p className="muted">Loading settings…</p>}
      {!loading && settings && (
        <div className="settings-sections">
          <section className="panel">
            <div className="panel-title">Appearance</div>
            <div className="setting-row">
              <span><b>Theme</b><small>Choose how NOVA looks</small></span>
              <select
                value={settings.theme}
                onChange={(event) => {
                  if (['Dark', 'Light', 'System'].includes(event.target.value)) {
                    void update({ theme: event.target.value as AppSettings['theme'] })
                  }
                }}
                aria-label="Theme"
              >
                <option>Dark</option><option>Light</option><option>System</option>
              </select>
            </div>
            <div className="setting-row">
              <span><b>Accent color</b><small>Used for actions, focus, approvals, and highlights</small></span>
              <div className="swatches">
                {ACCENTS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{ background: color }}
                    className={settings.accent_color === color ? 'selected' : ''}
                    onClick={() => void update({ accent_color: color })}
                    aria-label={`Accent ${color}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">Chat</div>
            <div className="setting-row">
              <span><b>Enter to send</b><small>Press Enter to send messages</small></span>
              <Toggle checked={settings.enter_to_send} label="Enter to send" onChange={(value) => void update({ enter_to_send: value })} />
            </div>
            <div className="setting-row">
              <span><b>Default agent</b></span>
              <select
                value={settings.default_agent_id ?? ''}
                onChange={(event) => void update({ default_agent_id: event.target.value || null })}
              >
                <option value="">Use system default</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </div>
            <div className="setting-row">
              <span><b>Default model</b></span>
              <select
                value={settings.default_model_id ?? ''}
                onChange={(event) => void update({ default_model_id: event.target.value || null })}
              >
                <option value="">Use system default</option>
                {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
              </select>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">Privacy & data</div>
            <PrivacyToggle
              label="Chat history"
              checked={settings.chat_history_enabled}
              onChange={(value) => void update({ chat_history_enabled: value })}
            />
            <PrivacyToggle
              label="Improve the product"
              checked={settings.product_improvement_enabled}
              onChange={(value) => void update({ product_improvement_enabled: value })}
            />
            <PrivacyToggle
              label="Show source citations"
              checked={settings.source_citations_enabled}
              onChange={(value) => void update({ source_citations_enabled: value })}
            />
          </section>

          <section className="panel">
            <div className="panel-title">Keyboard shortcuts</div>
            <div className="shortcut"><span>Open command palette</span><kbd>⌘ K</kbd></div>
            <div className="shortcut"><span>New chat</span><kbd>⌘ N</kbd></div>
            <div className="shortcut"><span>Toggle sidebar</span><kbd>⌘ B</kbd></div>
          </section>
        </div>
      )}
    </div>
  )
}

function PrivacyToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="setting-row">
      <span><b>{label}</b><small>Manage this workspace preference</small></span>
      <Toggle checked={checked} label={label} onChange={onChange} />
    </div>
  )
}
