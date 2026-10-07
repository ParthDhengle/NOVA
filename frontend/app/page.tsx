'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { SearchPalette } from '@/components/layout/SearchPalette'
import { ChatPage } from '@/components/chat/ChatPage'
import { ProjectsPage } from '@/components/projects/ProjectsPage'
import { ConnectorsPage } from '@/components/connectors/ConnectorsPage'
import { PersonalizationPage } from '@/components/personalization/PersonalizationPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { routeFromPath, type Route } from '@/lib/types/route'
import { AuthGate, useAuth } from '@/components/auth/AuthProvider'

export default function Page() {
  const auth = useAuth()
  const [route, setRoute] = useState<Route>('chat')
  const [palette, setPalette] = useState(false)
  const [newChat, setNewChat] = useState(0)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [projectChatId, setProjectChatId] = useState<string | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  useEffect(() => {
    setRoute(routeFromPath())

    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setActiveChatId(null)
        setProjectChatId(null)
        setRoute('chat')
        window.history.pushState({}, '', '/chat')
        setNewChat((x) => x + 1)
      }
    }

    window.addEventListener('keydown', key)
    const onPopState = () => setRoute(routeFromPath())
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  const navigate = useCallback((r: Route) => {
    setRoute(r)
    window.history.pushState({}, '', r === 'chat' ? '/chat' : `/${r}`)
  }, [])
  const startNewChat = useCallback((projectId?: string) => {
    setActiveChatId(null)
    setProjectChatId(projectId ?? null)
    setNewChat((value) => value + 1)
    navigate('chat')
  }, [navigate])
  const selectChat = useCallback((id: string) => {
    setActiveChatId(id)
    setProjectChatId(null)
    navigate('chat')
  }, [navigate])
  const refreshHistory = useCallback(() => {
    setHistoryRefreshKey((value) => value + 1)
  }, [])

  return (
    <AuthGate>
      <main className="app-shell">
        <Sidebar
          route={route}
          navigate={navigate}
          activeChatId={activeChatId}
          historyRefreshKey={historyRefreshKey}
          onSelectChat={selectChat}
          user={auth.user}
          onSignOut={() => void auth.logout()}
          onNew={startNewChat}
          onSearch={() => setPalette(true)}
        />

        <section className="main-shell">
          <Topbar route={route} />

          <div className="content">
            <div hidden={route !== 'chat'}>
              <ChatPage
                newChat={newChat}
                activeChatId={activeChatId}
                projectId={projectChatId}
                userName={auth.user?.name ?? auth.user?.email ?? 'You'}
                onChatChanged={refreshHistory}
              />
            </div>
            {route === 'projects' && (
              <ProjectsPage
                onNewChat={startNewChat}
                onSelectChat={selectChat}
              />
            )}
            {route === 'connectors' && <ConnectorsPage />}
            {route === 'personalization' && <PersonalizationPage />}
            {route === 'settings' && <SettingsPage />}
          </div>
        </section>

        {palette && (
          <SearchPalette
            close={() => setPalette(false)}
            navigate={navigate}
            onSelectChat={selectChat}
            onNewChat={startNewChat}
          />
        )}
      </main>
    </AuthGate>
  )
}