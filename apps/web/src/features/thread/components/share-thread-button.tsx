'use client'

import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { useState } from 'react'

interface ShareThreadButtonProps {
  nestSlug: string
  threadSlug: string
  isWalled: boolean
  walledMessage: string
}

function ShareIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
      <path d='M10 2.5v9M10 2.5l-3 3M10 2.5l3 3' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M4 10v5.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V10' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export function ShareThreadButton({ nestSlug, threadSlug, isWalled, walledMessage }: ShareThreadButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    const url = `${window.location.origin}/n/${nestSlug}/t/${threadSlug}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        type='button'
        onClick={() => (isWalled ? setConfirming(true) : copyLink())}
        className='flex items-center gap-1 text-sm text-muted-foreground hover:underline'
      >
        <ShareIcon />
        {copied ? 'Copied!' : 'Share'}
      </button>

      <ConfirmDialog
        open={confirming}
        title='Share this link?'
        description={walledMessage}
        confirmLabel='Copy link anyway'
        onConfirm={() => {
          setConfirming(false)
          copyLink()
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
