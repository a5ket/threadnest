'use client'

import { ReportCreateDtoReason } from '@/generated/api/models'
import { useState } from 'react'

interface ReportDialogProps {
  open: boolean
  isPending: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (reason: ReportCreateDtoReason, details: string) => void
}

const REASON_LABELS: Record<ReportCreateDtoReason, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  MISINFORMATION: 'Misinformation',
  RULE_VIOLATION: 'Rule violation',
  OTHER: 'Other'
}

export function ReportDialog({ open, isPending, error, onCancel, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportCreateDtoReason>(ReportCreateDtoReason.SPAM)
  const [details, setDetails] = useState('')

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
      onClick={onCancel}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='report-dialog-title'
        className='w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='report-dialog-title' className='text-base font-semibold'>
          Report content
        </h2>

        <div className='mt-4 flex flex-col gap-3'>
          <label className='flex flex-col gap-1 text-sm'>
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportCreateDtoReason)}
              className='rounded-md border border-input bg-background px-3 py-2 text-sm'
            >
              {Object.values(ReportCreateDtoReason).map((value) => (
                <option key={value} value={value}>{REASON_LABELS[value]}</option>
              ))}
            </select>
          </label>

          <label className='flex flex-col gap-1 text-sm'>
            Details (optional)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
              className='rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
          </label>

          {error && (
            <p role='alert' className='text-xs text-destructive'>{error}</p>
          )}
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
          >
            Cancel
          </button>

          <button
            type='button'
            disabled={isPending}
            onClick={() => onSubmit(reason, details.trim())}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
          >
            {isPending ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}
