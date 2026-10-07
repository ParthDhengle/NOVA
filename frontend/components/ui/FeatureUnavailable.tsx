'use client'

import { Info, X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  feature?: string
}

export function FeatureUnavailable({
  open,
  onClose,
  feature = 'This feature',
}: Props) {
  if (!open) return null

  return (
    <div className="feature-popup" role="status">
      <div className="feature-popup-icon">
        <Info size={18} />
      </div>

      <div className="feature-popup-content">
        <strong>Not available yet</strong>
        <span>{feature} is still being worked on.</span>
      </div>

      <button
        className="feature-popup-close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  )
}