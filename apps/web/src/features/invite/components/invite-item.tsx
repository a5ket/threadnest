'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
import { useRevokeInvite } from '@/features/invite/invite.hooks'
import type { Invite } from '@/features/invite/invite.types'
import { useRouter } from 'next/navigation'

interface InviteItemProps {
  nestSlug: string
  invite: Invite
}

const STATUS_LABELS: Record<Invite['status'], string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired'
}

export function InviteItem({ nestSlug, invite }: InviteItemProps) {
  const router = useRouter()

  const revokeInvite = useRevokeInvite({
    onSuccess: () => router.refresh()
  })

  return (
    <li className='flex items-center justify-between gap-4 rounded-md border border-border p-3'>
      <div>
        <p className='text-sm font-medium'><UserLink user={invite.user} /></p>
        <p className='text-xs text-muted-foreground'>
          {STATUS_LABELS[invite.status]}
          {' · invited by '}
          <UserLink user={invite.invitedBy} />
          {' · '}
          {formatDateTime(invite.createdAt)}
        </p>
      </div>

      {invite.status === 'PENDING' && (
        <DeleteConfirmButton
          label='Revoke'
          isPending={revokeInvite.isPending}
          onConfirm={() => revokeInvite.mutate({ nestSlug, inviteId: invite.id })}
        />
      )}
    </li>
  )
}
