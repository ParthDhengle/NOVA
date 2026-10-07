'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { personalizationApi } from '@/lib/api/personalization'
import type { Memory, Personalization } from '@/lib/api/types'
import { Toggle } from '@/components/common/Toggle'

export function PersonalizationPage() {
  const [preferences, setPreferences] = useState<Personalization | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([personalizationApi.get(), personalizationApi.listMemories()])
      .then(([data, items]) => {
        setPreferences(data)
        setMemories(items)
      })
      .catch((cause: unknown) => setError(
        cause instanceof ApiError ? cause.message : 'Unable to load personalization.'
      ))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, retry])

  const save = async (next: Personalization) => {
    setSaving(true)
    setError(null)
    try {
      setPreferences(await personalizationApi.save(next))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  const updateMemory = async (memory: Memory) => {
    const text = window.prompt('Edit memory', memory.text)?.trim()
    if (!text || text === memory.text) return
    try {
      const updated = await personalizationApi.updateMemory(memory.id, text)
      setMemories((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update memory.')
    }
  }

  const addMemory = async () => {
    const text = window.prompt('What should NOVA remember?')?.trim()
    if (!text) return
    try {
      const memory = await personalizationApi.createMemory(text)
      setMemories((current) => [...current, memory])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to add memory.')
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      await personalizationApi.deleteMemory(id)
      setMemories((current) => current.filter((memory) => memory.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete memory.')
    }
  }

  const clearMemory = async () => {
    if (!window.confirm('Clear all saved memories?')) return
    try {
      await personalizationApi.clearMemories()
      setMemories([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to clear memory.')
    }
  }

  const setValue = <K extends keyof Personalization>(
    key: K,
    value: Personalization[K]
  ) => {
    setPreferences((current) => current ? { ...current, [key]: value } : current)
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Your preferences</span>
          <h1>Personalization</h1>
          <p>Make NOVA respond the way you work best.</p>
        </div>
        <button
          className="primary"
          disabled={!preferences || saving}
          onClick={() => preferences && void save(preferences)}
        >
          <Check /> {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {error && <div className="request-error request-banner" role="alert">
        <span>{error}</span><button className="quiet" onClick={() => setRetry((value) => value + 1)}>Retry</button>
      </div>}
      {loading && <p className="muted">Loading personalization…</p>}
      {!loading && preferences && (
        <div className="two-col">
          <section className="panel">
            <div className="panel-title"><Sparkles /> AI instructions</div>
            <p className="muted">How should the AI respond?</p>
            <textarea
              value={preferences.instructions}
              onChange={(event) => setValue('instructions', event.target.value)}
            />
            <button className="primary" disabled={saving} onClick={() => void save(preferences)}>
              {saving ? 'Saving…' : 'Save instructions'}
            </button>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Sparkles /> Memory <span className="count">{memories.length}</span>
              <Toggle
                checked={preferences.memory_enabled}
                label="Enable memory"
                onChange={(value) => {
                  const next = { ...preferences, memory_enabled: value }
                  setPreferences(next)
                  void save(next)
                }}
              />
            </div>
            {memories.map((memory) => (
              <div className="memory-row" key={memory.id}>
                <span>
                  {memory.text}
                  <small>Added {new Date(memory.created_at).toLocaleDateString()}</small>
                </span>
                <span>
                  <button className="icon-button" aria-label="Edit memory" onClick={() => void updateMemory(memory)}><Pencil /></button>
                  <button className="icon-button" aria-label="Delete memory" onClick={() => void deleteMemory(memory.id)}><Trash2 /></button>
                </span>
              </div>
            ))}
            {memories.length === 0 && <p className="empty">No saved memories.</p>}
            <button className="quiet full" onClick={() => void addMemory()}><Plus /> Add memory</button>
            <button className="danger full" disabled={memories.length === 0} onClick={() => void clearMemory()}>Clear all memory</button>
          </section>

          <section className="panel">
            <div className="panel-title">Response preferences</div>
            <PreferenceSelect
              label="Response length"
              help="Choose your default preference"
              value={preferences.response_length}
              options={['Concise', 'Balanced', 'Detailed']}
              onChange={(value) => setValue('response_length', value as Personalization['response_length'])}
            />
            <PreferenceSelect
              label="Tone"
              help="Choose your default preference"
              value={preferences.tone}
              options={['Professional', 'Friendly', 'Direct']}
              onChange={(value) => setValue('tone', value as Personalization['tone'])}
            />
            <PreferenceSelect
              label="Technical depth"
              help="Choose your default preference"
              value={preferences.technical_depth}
              options={['Simple', 'Advanced', 'Expert']}
              onChange={(value) => setValue('technical_depth', value as Personalization['technical_depth'])}
            />
            <label className="setting-row">
              <span><b>Language</b><small>Choose your default preference</small></span>
              <input value={preferences.language} onChange={(event) => setValue('language', event.target.value)} />
            </label>
          </section>
        </div>
      )}
    </div>
  )
}

function PreferenceSelect({
  label,
  help,
  value,
  options,
  onChange,
}: {
  label: string
  help: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="setting-row">
      <span><b>{label}</b><small>{help}</small></span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}
