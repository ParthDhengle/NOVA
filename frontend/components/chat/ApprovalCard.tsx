'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { Approval } from '@/lib/api/types'

type Props = {
  approval: Approval
  onResult: (ok: boolean, values?: Record<string, string>) => void
}

export function ApprovalCard({ approval, onResult }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const setValue = (label: string, value: string) => {
    setValues((current) => ({ ...current, [label]: value }))
  }

  return (
    <div className="approval">
      <div className="approval-title">
        <ShieldCheck /> {approval.title}
      </div>
      <p>{approval.description}</p>
      <strong>Action</strong>
      <p className="mono">{approval.action}</p>
      {approval.fields?.map((field) => (
        <label className="approval-field" key={field.label}>
          <span>{field.label}</span>
          {field.type === 'select' ? (
            <select
              value={values[field.label] ?? ''}
              onChange={(event) => setValue(field.label, event.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => <option key={option}>{option}</option>)}
            </select>
          ) : (
            <input
              value={values[field.label] ?? ''}
              onChange={(event) => setValue(field.label, event.target.value)}
            />
          )}
        </label>
      ))}
      <div className="approval-actions">
        <button type="button" className="quiet" onClick={() => onResult(false, values)}>
          Reject
        </button>
        <button type="button" className="primary" onClick={() => onResult(true, values)}>
          Approve
        </button>
      </div>
    </div>
  )
}