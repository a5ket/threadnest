'use client'

import { PlatformReportCreateDtoReason, PlatformReportCreateDtoTargetType } from '@/generated/api/models'
import { useState } from 'react'
import { useCreatePlatformReport } from '@/features/platform-report/platform-report.hooks'

interface ReportMessageButtonProps {
  messageId: string
}

const REASON_LABELS: Record<PlatformReportCreateDtoReason, string> = {
  HARASSMENT: 'Harassment',
  ILLEGAL_CONTENT: 'Illegal content',
  BAN_EVASION: 'Ban evasion',
  SPAM_NETWORK: 'Spam',
  IMPERSONATION: 'Impersonation',
  PLATFORM_RULE_VIOLATION: 'Platform rule violation',
  OTHER: 'Other'
}

export function ReportMessageButton({ messageId }: ReportMessageButtonProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reason, setReason] = useState<PlatformReportCreateDtoReason>(PlatformReportCreateDtoReason.HARASSMENT)
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createReport = useCreatePlatformReport({
    onSuccess: () => {
      setOpen(false)
      setSubmitted(true)
    },
    onError: (err) => {
      setError(err.errorCode === 'ALREADY_REPORTED_TO_PLATFORM' ? 'You\'ve already reported this.' : 'Something went wrong. Please try again.')
    }
  })

  if (submitted) {
    return <span className='text-xs text-muted-foreground'>Reported</span>
  }

  return (
    <>
      <button type='button' onClick={() => setOpen(true)} className='text-xs text-muted-foreground hover:text-destructive hover:underline'>
        Report
      </button>

      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={() => setOpen(false)}>
          <div
            role='dialog'
            aria-modal='true'
            className='w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='text-base font-semibold'>Report message</h2>

            <div className='mt-4 flex flex-col gap-3'>
              <label className='flex flex-col gap-1 text-sm'>
                Reason
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as PlatformReportCreateDtoReason)}
                  className='rounded-md border border-input bg-background px-3 py-2 text-sm'
                >
                  {Object.values(PlatformReportCreateDtoReason).map((value) => (
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

              {error && <p role='alert' className='text-xs text-destructive'>{error}</p>}
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button type='button' onClick={() => setOpen(false)} className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'>
                Cancel
              </button>

              <button
                type='button'
                disabled={createReport.isPending}
                onClick={() => {
                  setError(null)
                  createReport.mutate({
                    targetType: PlatformReportCreateDtoTargetType.MESSAGE,
                    targetId: messageId,
                    reason,
                    details: details.trim() || undefined
                  })
                }}
                className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
              >
                {createReport.isPending ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
