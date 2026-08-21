'use client'

import { ModeratorIcon, PlatformIcon } from '@/common/components/authority-icons'
import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { useState } from 'react'

type DeleteConfirmVariant = 'default' | 'moderator' | 'platform'

interface DeleteConfirmButtonProps {
  onConfirm: () => void
  isPending: boolean
  title: string
  description: string
  label?: string
  confirmLabel?: string
  variant?: DeleteConfirmVariant
}

const VARIANT_STYLES: Record<DeleteConfirmVariant, string> = {
  default: 'text-destructive',
  moderator: 'text-moderator',
  platform: 'text-destructive'
}

export function DeleteConfirmButton({
  onConfirm,
  isPending,
  title,
  description,
  label = 'Delete',
  confirmLabel = 'Delete',
  variant = 'default'
}: DeleteConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button
        type='button'
        disabled={isPending}
        onClick={() => setConfirming(true)}
        className={`flex items-center gap-1 text-sm hover:underline disabled:opacity-50 ${VARIANT_STYLES[variant]}`}
      >
        {variant === 'moderator' && <ModeratorIcon />}
        {variant === 'platform' && <PlatformIcon />}
        {isPending ? 'Working...' : label}
      </button>

      <ConfirmDialog
        open={confirming}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onConfirm()
        }}
      />
    </>
  )
}
