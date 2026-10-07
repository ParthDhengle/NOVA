'use client'

import { Activity, ChevronDown } from 'lucide-react'
import type { AgentEvent } from '@/lib/api/types'

type Props = {
  events: AgentEvent[]
  open: boolean
  setOpen: (v: boolean) => void
  live: boolean
}

export function ActivityPanel({ events, open, setOpen, live }: Props) {
  return (
    <div className="activity">
      <button className="activity-head" onClick={() => setOpen(!open)}>
        <span>
          <Activity /> Agent activity {live && <><i className="live-dot" /> Live</>}
        </span>
        <ChevronDown className={open ? 'rotate' : ''} />
      </button>
      {open && (
        <div className="activity-body">
          {events.map((e, i) => (
            <div className="event" key={`${e.type}-${i}`}>
              <span className={e.type === 'tool_start' ? 'running' : 'done'}>
                {e.type === 'tool_start' ? '→' : '✓'}
              </span>
              <div>
                <b>{e.agent || e.tool || e.type.replaceAll('_', ' ')}</b>
                <small>
                  {e.message || e.tool || 'Event received from agent runtime'}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}