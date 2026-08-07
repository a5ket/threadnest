'use client'

import { useRouter } from 'next/navigation'
import { BanItem } from './ban-item'
import { BanUserForm } from './ban-user-form'
import type { NestBan } from '../nest-ban.types'

interface BanListProps {
  nestSlug: string
  bans: NestBan[]
}

export function BanList({ nestSlug, bans }: BanListProps) {
  const router = useRouter()

  return (
    <div className='flex flex-col gap-4'>
      <BanUserForm nestSlug={nestSlug} onBanned={() => router.refresh()} />

      <ul className='flex flex-col gap-3'>
        {bans.map((ban) => (
          <BanItem key={ban.user.id} nestSlug={nestSlug} ban={ban} />
        ))}

        {bans.length === 0 && (
          <p className='text-sm text-muted-foreground'>No banned users.</p>
        )}
      </ul>
    </div>
  )
}
