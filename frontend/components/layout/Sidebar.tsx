'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronRight,
  FolderKanban,
  Link2,
  LogOut,
  Pin,
  Plus,
  Search,
  Settings2,
} from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { chatApi } from '@/lib/api/chat'
import type { Chat, User } from '@/lib/api/types'
import type { Route } from '@/lib/types/route'

type Props = {
  route: Route
  navigate: (r: Route) => void
  activeChatId: string | null
  historyRefreshKey: number
  onSelectChat: (id: string) => void
  user: User | null
  onSignOut: () => void
  onNew: () => void
  onSearch: () => void
}

const NAV: [Route, string, React.ElementType][] = [
  ['projects', 'Projects', FolderKanban],
  ['connectors', 'MCP / Connectors', Link2],
]
const GROUPS = ['Today', 'Yesterday', 'Previous 7 days', 'Earlier']

function groupFor(chat: Chat): string {
  const date = new Date(chat.updated_at)
  if (Number.isNaN(date.getTime())) return 'Earlier'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const daysAgo = Math.floor((today.getTime() - day.getTime()) / 86_400_000)
  if (daysAgo <= 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return 'Previous 7 days'
  return 'Earlier'
}

export function Sidebar({
  route,
  navigate,
  activeChatId,
  historyRefreshKey,
  onSelectChat,
  user,
  onSignOut,
  onNew,
  onSearch,
}: Props) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    chatApi.list()
      .then(setChats)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : 'Unable to load chat history.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload, historyRefreshKey, retryCount])

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><span /></span>
        NOVA
      </div>

      <button className="new-chat" onClick={onNew}>
        <Plus /> New chat
      </button>

      <div className="history">
        <p className="eyebrow">Workspace</p>
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`side-nav ${route === id ? 'active' : ''}`}
            onClick={() => navigate(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
        <button className="search-button" onClick={onSearch}>
          <Search /> Search
        </button>
        <div className="section-heading">
          <span className="eyebrow">Chat history</span>
        </div>
        {loading && <p className="history-state">Loading history…</p>}
        {error && (
          <div className="history-state" role="alert">
            <span>{error}</span>
            <button className="quiet" onClick={() => setRetryCount((count) => count + 1)}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && chats.length === 0 && (
          <p className="history-state">No conversations yet.</p>
        )}
        {!loading && !error && GROUPS.map((group) => {
          const groupedChats = chats.filter((chat) => groupFor(chat) === group)
          if (groupedChats.length === 0) return null
          return (
            <div key={group}>
              <span className="history-group">{group}</span>
              {groupedChats.map((chat) => (
                <button
                  key={chat.id}
                  className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <span>
                    {chat.pinned && <Pin />}
                    {chat.title}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      <div className="sidebar-bottom">
        <button className="side-nav" onClick={() => navigate('settings')}>
          <Settings2 /> Settings
        </button>
        <button className="account-button" onClick={() => navigate('personalization')}>
          <span className="avatar">{user?.name?.slice(0, 2).toUpperCase() ?? 'U'}</span>
          <span>
            <b>{user?.username ?? user?.email}</b>
            <small>{user?.email}</small>
          </span>
          <ChevronRight />
        </button>
        <button className="side-nav" onClick={onSignOut}>
          <LogOut /> Sign out
        </button>
      </div>
    </aside>
  )
}
