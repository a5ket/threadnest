'use client'

import { BADGE_ACCENT_BORDER, Badge, type BadgeVariant } from '@/common/components/badge'
import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
import { getUserDisplayName } from '@/common/user-display-name'
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

const STATUS_VARIANTS: Record<Invite['status'], BadgeVariant> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'destructive',
  REVOKED: 'neutral',
  EXPIRED: 'neutral'
}

export function InviteItem({ nestSlug, invite }: InviteItemProps) {
  const router = useRouter()

  const revokeInvite = useRevokeInvite({
    onSuccess: () => router.refresh()
  })

  return (
    <li className={`flex items-center justify-between gap-4 rounded-lg border border-border border-l-4 bg-card p-3 ${BADGE_ACCENT_BORDER[STATUS_VARIANTS[invite.status]]}`}>
      <div>
        <p className='text-sm font-medium'><UserLink user={invite.user} /></p>
        <p className='mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
          <Badge variant={STATUS_VARIANTS[invite.status]} size='sm'>{STATUS_LABELS[invite.status]}</Badge>
          <span>
            {'invited by '}
            <UserLink user={invite.invitedBy} />
            {' · '}
            {formatDateTime(invite.createdAt)}
          </span>
        </p>
      </div>

      {invite.status === 'PENDING' && (
        <DeleteConfirmButton
          variant='moderator'
          label='Revoke'
          confirmLabel='Revoke invite'
          title={`Revoke ${getUserDisplayName(invite.user)}'s invite?`}
          description={'They won\'t be able to use this invite to join the nest anymore.'}
          isPending={revokeInvite.isPending}
          onConfirm={() => revokeInvite.mutate({ nestSlug, inviteId: invite.id })}
        />
      )}
    </li>
  )
}
