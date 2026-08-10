'use client'

import { ReportCreateDtoReason } from '@/generated/api/models'
import { useState } from 'react'
import { useReportComment, useReportThread } from '../report.hooks'
import { ReportDialog } from './report-dialog'

type ReportTarget
  = | { type: 'thread', nestSlug: string, threadSlug: string }
    | { type: 'comment', commentId: string }

interface ReportButtonProps {
  target: ReportTarget
}

export function ReportButton({ target }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reportThread = useReportThread({
    onSuccess: () => {
      setOpen(false)
      setSubmitted(true)
    },
    onError: (err) => {
      setError(err.errorCode === 'ALREADY_REPORTED' ? 'You\'ve already reported this.' : 'Something went wrong. Please try again.')
    }
  })

  const reportComment = useReportComment({
    onSuccess: () => {
      setOpen(false)
      setSubmitted(true)
    },
    onError: (err) => {
      setError(err.errorCode === 'ALREADY_REPORTED' ? 'You\'ve already reported this.' : 'Something went wrong. Please try again.')
    }
  })

  const isPending = reportThread.isPending || reportComment.isPending

  if (submitted) {
    return <span className='text-xs text-muted-foreground'>Reported</span>
  }

  const handleSubmit = (reason: ReportCreateDtoReason, details: string) => {
    setError(null)
    const dto = { reason, details: details || undefined }

    if (target.type === 'thread') {
      reportThread.mutate({ nestSlug: target.nestSlug, threadSlug: target.threadSlug, ...dto })
    }
    else {
      reportComment.mutate({ commentId: target.commentId, ...dto })
    }
  }

  return (
    <>
      <button
        type='button'
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className='text-muted-foreground hover:underline'
      >
        Report
      </button>

      <ReportDialog
        open={open}
        isPending={isPending}
        error={error}
        onCancel={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}
