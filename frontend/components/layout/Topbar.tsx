'use client'

import { useState } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { FeatureUnavailable } from '@/components/ui/FeatureUnavailable'
import type { Route } from '@/lib/types/route'

type Props = {
  route: Route
}

export function Topbar({ route }: Props) {
  const [showUnavailable, setShowUnavailable] = useState(false)

  const title = route === 'chat' ? 'Chat' : route[0].toUpperCase() + route.slice(1)

  return (
    <>
      <header className="topbar">
        <div className="breadcrumbs">
          <span>Workspace</span>
          <ChevronRight />
          <b>{title}</b>
        </div>

        <div className="top-actions">
          <button
            className="share"
            onClick={() => setShowUnavailable(true)}
          >
            <ShieldCheck />
            Share
          </button>
        </div>
      </header>

      <FeatureUnavailable
        open={showUnavailable}
        feature="Sharing"
        onClose={() => setShowUnavailable(false)}
      />
    </>
  )
}