import { Avatar } from '@/common/components/avatar'
import type { UserSearchResult } from '@/features/user/user.types'
import Link from 'next/link'

interface UserSearchResultItemProps {
  user: UserSearchResult
}

export function UserSearchResultItem({ user }: UserSearchResultItemProps) {
  const label = user.displayName ?? user.username ?? 'Deleted user'

  if (!user.username) {
    return (
      <li className='flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm'>
        <Avatar avatarUrl={user.avatarUrl} label={label} size={32} />
        <span className='text-sm text-muted-foreground'>{label}</span>
      </li>
    )
  }

  return (
    <li className='flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm'>
      <Avatar avatarUrl={user.avatarUrl} label={label} size={32} />

      <Link href={`/users/${user.username}`} className='hover:underline'>
        <span className='text-sm font-medium'>{label}</span>
        {user.displayName && (
          <span className='ml-2 text-xs text-muted-foreground'>
            @
            {user.username}
          </span>
        )}
      </Link>
    </li>
  )
}
