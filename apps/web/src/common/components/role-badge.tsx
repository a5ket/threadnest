import type { UserReferenceDtoRole } from '@/generated/api/models'

const ROLE_LABELS: Partial<Record<NonNullable<UserReferenceDtoRole>, string>> = {
  OWNER: 'Owner',
  MODERATOR: 'Moderator'
}

export function RoleBadge({ role }: { role: UserReferenceDtoRole }) {
  if (!role) return null

  const label = ROLE_LABELS[role]
  if (!label) return null

  return (
    <span className='rounded-full bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground'>
      {label}
    </span>
  )
}
