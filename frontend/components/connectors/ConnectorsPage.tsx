'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronRight, Link2, Plus, X } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { connectorsApi } from '@/lib/api/connectors'
import type { Connector } from '@/lib/api/types'
import { IconButton } from '@/components/ui/IconButton'

export function ConnectorsPage() {
  const [items, setItems] = useState<Connector[]>([])
  const [selected, setSelected] = useState<Connector | null>(null)
  const [catalog, setCatalog] = useState<Connector[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    connectorsApi.list()
      .then(setItems)
      .catch((cause: unknown) => setError(
        cause instanceof ApiError ? cause.message : 'Unable to load connectors.'
      ))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, retry])

  const openCatalog = async () => {
    setAdding(true)
    setCatalogLoading(true)
    setActionError(null)
    try {
      setCatalog(await connectorsApi.catalog())
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to load available connectors.')
    } finally {
      setCatalogLoading(false)
    }
  }

  const toggle = async (connector: Connector) => {
    setActionError(null)
    try {
      const updated = connector.status === 'connected'
        ? await connectorsApi.disconnect(connector.id)
        : await connectorsApi.connect(connector.id)
      if (updated.authorization_url) {
        window.location.assign(updated.authorization_url)
        return
      }
      setItems((current) => current.some((item) => item.id === updated.id)
        ? current.map((item) => item.id === updated.id ? updated : item)
        : [...current, updated])
      setCatalog((current) => current.map((item) => item.id === updated.id ? updated : item))
      setAdding(false)
      setSelected(updated)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to update connector.')
    }
  }

  const remove = async (connector: Connector) => {
    if (!window.confirm(`Remove ${connector.name}?`)) return
    setActionError(null)
    try {
      await connectorsApi.remove(connector.id)
      setItems((current) => current.filter((item) => item.id !== connector.id))
      setSelected(null)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to remove connector.')
    }
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Integrations</span>
          <h1>MCP & Connectors</h1>
          <p>Give agents controlled access to the tools your team already uses.</p>
        </div>
        <button className="primary" onClick={() => void openCatalog()}>
          <Plus /> Add connector
        </button>
      </header>

      {error && <div className="request-error request-banner" role="alert">
        <span>{error}</span><button className="quiet" onClick={() => setRetry((value) => value + 1)}>Retry</button>
      </div>}
      {actionError && <p className="request-error" role="alert">{actionError}</p>}
      {loading && <p className="muted">Loading connectors…</p>}
      {!loading && !error && items.length === 0 && <p className="empty">No connectors are configured yet.</p>}

      <div className="connector-grid">
        {items.map((connector) => (
          <button className="connector-card" key={connector.id} onClick={() => {
            setAdding(false)
            setSelected(connector)
          }}>
            <span className="connector-logo"><Link2 /></span>
            <div>
              <h3>{connector.name}</h3>
              <p>{connector.description}</p>
              <span className={connector.status === 'connected' ? 'connected' : ''}>
                {connector.status === 'connected' ? 'Connected' : 'Not connected'} · {connector.tools.length} tools
              </span>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>

      {(selected || adding) && (
        <div className="detail-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{adding ? 'Available connectors' : 'Connector detail'}</span>
              <h2>{adding ? 'Add a connector' : `${selected?.name} MCP`}</h2>
              {selected && <span className={selected.status === 'connected' ? 'connected' : ''}>{selected.status}</span>}
            </div>
            <IconButton label="Close" onClick={() => {
              setSelected(null)
              setAdding(false)
              setActionError(null)
            }}><X /></IconButton>
          </div>
          {adding ? (
            catalogLoading ? <p className="muted">Loading available connectors…</p>
              : catalog.length === 0 ? <p className="empty">No additional connectors are available.</p>
                : <div className="tool-list">
                  {catalog.map((connector) => (
                    <div className="setting-row" key={connector.id}>
                      <span><b>{connector.name}</b><small>{connector.description}</small></span>
                      <button className="quiet" onClick={() => void toggle(connector)}>Connect</button>
                    </div>
                  ))}
                </div>
          ) : selected && (
            <>
              <p>{selected.description}</p>
              <h3>Tools</h3>
              <div className="tool-list">{selected.tools.map((tool) => <code key={tool}>{tool}</code>)}</div>
              <h3>Permissions</h3>
              <div className="permission-list">
                {selected.permissions.map((permission) => (
                  <span key={permission}><Check />{permission}</span>
                ))}
              </div>
              <div className="panel-actions">
                <button className="quiet" onClick={() => void toggle(selected)}>
                  {selected.status === 'connected' ? 'Disconnect' : 'Connect'}
                </button>
                <button className="danger" onClick={() => void remove(selected)}>Remove connector</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
