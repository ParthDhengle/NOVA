'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Search, Zap } from 'lucide-react'
import { searchApi } from '@/lib/api/search'
import type { SearchResult } from '@/lib/api/types'
import type { Route } from '@/lib/types/route'

type Props = {
  close: () => void
  navigate: (r: Route) => void
  onSelectChat: (id: string) => void
  onNewChat: () => void
}

const COMMANDS: [string, Route][] = [
  ['New Chat', 'chat'],
  ['Open Projects', 'projects'],
  ['Open Connectors', 'connectors'],
  ['Open Personalization', 'personalization'],
  ['Open Settings', 'settings'],
]

export function SearchPalette({ close, navigate, onSelectChat, onNewChat }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    searchApi.search(query.trim(), controller.signal)
      .then(setResults)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Search failed.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [query, retryCount])

  const selectResult = (result: SearchResult) => {
    close()
    if (result.type === 'chat') {
      onSelectChat(result.resource_id)
      navigate('chat')
    } else if (result.type === 'project') {
      navigate('projects')
    } else if (result.type === 'connector') {
      navigate('connectors')
    }
  }

  return (
    <div className="overlay" onMouseDown={close}>
      <div className="palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input">
          <Search />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations and commands"
          />
          <kbd>ESC</kbd>
        </div>

        {query ? (
          <div className="palette-list">
            {loading && <p className="empty">Searching…</p>}
            {error && (
              <p className="request-error" role="alert">
                {error} <button className="quiet" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
              </p>
            )}
            {!loading && !error && results.map((result) => (
              <button key={`${result.type}-${result.id}`} onClick={() => selectResult(result)}>
                <MessageSquare />{result.title}<small>{result.type}</small>
              </button>
            ))}
            {!loading && !error && results.length === 0 && <p className="empty">No results found.</p>}
          </div>
        ) : (
          <div className="palette-list">
            {COMMANDS.map(([label, route]) => (
              <button key={label} onClick={() => {
                close()
                if (route === 'chat') onNewChat()
                else navigate(route)
              }}>
                <Zap />{label}<small>Command</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
