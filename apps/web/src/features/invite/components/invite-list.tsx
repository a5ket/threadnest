'use client'

import { useRouter } from 'next/navigation'
import { CreateInviteForm } from './create-invite-form'
import { InviteItem } from './invite-item'
import type { Invite } from '@/features/invite/invite.types'

interface InviteListProps {
  nestSlug: string
  invites: Invite[]
}

export function InviteList({ nestSlug, invites }: InviteListProps) {
  const router = useRouter()

  return (
    <div className='flex flex-col gap-4'>
      <CreateInviteForm nestSlug={nestSlug} onCreated={() => router.refresh()} />

      <ul className='flex flex-col gap-3'>
        {invites.map((invite) => (
          <InviteItem key={invite.id} nestSlug={nestSlug} invite={invite} />
        ))}

        {invites.length === 0 && (
          <p className='text-sm text-muted-foreground'>No invites yet.</p>
        )}
      </ul>
    </div>
  )
}
