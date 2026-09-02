import type { UserReferenceDtoRole } from '@/generated/api/models'
import { Badge, type BadgeVariant } from './badge'

const ROLE_LABELS: Partial<Record<NonNullable<UserReferenceDtoRole>, string>> = {
  OWNER: 'Owner',
  MODERATOR: 'Moderator'
}

const ROLE_VARIANTS: Partial<Record<NonNullable<UserReferenceDtoRole>, BadgeVariant>> = {
  OWNER: 'owner',
  MODERATOR: 'moderator'
}

export function RoleBadge({ role }: { role: UserReferenceDtoRole | undefined }) {
  if (!role) return null

  const label = ROLE_LABELS[role]
  if (!label) return null

  return (
    <Badge variant={ROLE_VARIANTS[role]} size='sm'>
      {label}
    </Badge>
  )
}
