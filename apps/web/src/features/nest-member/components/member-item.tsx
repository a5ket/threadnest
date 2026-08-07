'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { RoleBadge } from '@/common/components/role-badge'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
import { useUser } from '@/features/me/me.hooks'
import { NestMemberUpdateRoleDtoRole } from '@/generated/api/models'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useChangeMemberRole, useRemoveMember } from '../nest-member.hooks'
import type { NestMember } from '../nest-member.types'

interface MemberItemProps {
  nestSlug: string
  member: NestMember
  canRemoveMembers: boolean
  canManageMemberRoles: boolean
}

const ROLE_OPTIONS = [
  NestMemberUpdateRoleDtoRole.MEMBER,
  NestMemberUpdateRoleDtoRole.MODERATOR,
  NestMemberUpdateRoleDtoRole.OWNER
]

export function MemberItem({ nestSlug, member, canRemoveMembers, canManageMemberRoles }: MemberItemProps) {
  const router = useRouter()
  const currentUser = useUser()
  const [error, setError] = useState<string | null>(null)

  const removeMember = useRemoveMember({
    onSuccess: () => router.refresh(),
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_REMOVE_YOURSELF':
          setError('You can\'t remove yourself.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to remove this member.')
          break

        case 'MEMBER_NOT_FOUND':
          setError('This member is no longer in the nest.')
          router.refresh()
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  const changeRole = useChangeMemberRole({
    onSuccess: () => router.refresh(),
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_CHANGE_YOUR_OWN_ROLE':
          setError('You can\'t change your own role.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
        case 'CANNOT_MANAGE_HIGHER_ROLE_MEMBER':
          setError('You don\'t have permission to change this member\'s role.')
          break

        case 'CANNOT_ASSIGN_HIGHER_OR_EQUAL_ROLE':
          setError('You can\'t assign a role equal to or higher than your own.')
          break

        case 'MEMBER_ROLE_UNCHANGED':
          break

        case 'MEMBER_NOT_FOUND':
          setError('This member is no longer in the nest.')
          router.refresh()
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  const isSelf = member.user.id === currentUser?.id
  const isPending = removeMember.isPending || changeRole.isPending

  return (
    <li className='flex items-center justify-between gap-4 rounded-md border border-border p-3'>
      <div>
        <p className='flex items-center gap-2 text-sm font-medium'>
          <UserLink user={member.user} />
          <RoleBadge role={member.role} />
        </p>

        <p className='text-xs text-muted-foreground'>
          {'Joined '}
          {formatDateTime(member.createdAt)}
        </p>

        {error && (
          <p role='alert' className='mt-1 text-xs text-destructive'>
            {error}
          </p>
        )}
      </div>

      <div className='flex items-center gap-3'>
        {canManageMemberRoles && !isSelf && (
          <select
            value={member.role}
            disabled={isPending}
            onChange={(e) => {
              setError(null)
              changeRole.mutate({ nestSlug, userId: member.user.id, role: e.target.value as NestMemberUpdateRoleDtoRole })
            }}
            className='rounded-md border border-input bg-background px-2 py-1 text-sm disabled:opacity-50'
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        )}

        {canRemoveMembers && !isSelf && (
          <DeleteConfirmButton
            label='Remove'
            isPending={removeMember.isPending}
            onConfirm={() => {
              setError(null)
              removeMember.mutate({ nestSlug, userId: member.user.id })
            }}
          />
        )}
      </div>
    </li>
  )
}
