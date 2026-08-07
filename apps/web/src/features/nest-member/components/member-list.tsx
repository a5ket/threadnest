import { MemberItem } from './member-item'
import type { NestMember } from '../nest-member.types'

interface MemberListProps {
  nestSlug: string
  members: NestMember[]
  canRemoveMembers: boolean
  canManageMemberRoles: boolean
}

export function MemberList({ nestSlug, members, canRemoveMembers, canManageMemberRoles }: MemberListProps) {
  return (
    <ul className='flex flex-col gap-3'>
      {members.map((member) => (
        <MemberItem
          key={member.user.id}
          nestSlug={nestSlug}
          member={member}
          canRemoveMembers={canRemoveMembers}
          canManageMemberRoles={canManageMemberRoles}
        />
      ))}

      {members.length === 0 && (
        <p className='text-sm text-muted-foreground'>No members yet.</p>
      )}
    </ul>
  )
}
