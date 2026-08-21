'use client'

import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { RoleBadge } from '@/common/components/role-badge'
import { Select } from '@/common/components/select'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
import { getUserDisplayName } from '@/common/user-display-name'
import { useUser } from '@/features/me/me.hooks'
import { useTransferOwnership } from '@/features/nest/nest.hooks'
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
  canTransferOwnership: boolean
}

const ROLE_OPTIONS = [
  NestMemberUpdateRoleDtoRole.MEMBER,
  NestMemberUpdateRoleDtoRole.MODERATOR,
  NestMemberUpdateRoleDtoRole.OWNER
]

export function MemberItem({ nestSlug, member, canRemoveMembers, canManageMemberRoles, canTransferOwnership }: MemberItemProps) {
  const router = useRouter()
  const currentUser = useUser()
  const [error, setError] = useState<string | null>(null)
  const [confirmingTransfer, setConfirmingTransfer] = useState(false)

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

  const transferOwnership = useTransferOwnership({
    onSuccess: () => router.refresh(),
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_TRANSFER_OWNERSHIP_TO_SELF':
          setError('You can\'t transfer ownership to yourself.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to transfer ownership.')
          break

        case 'TARGET_USER_NOT_MEMBER':
          setError('This user is no longer a member of the nest.')
          router.refresh()
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  const isSelf = member.user.id === currentUser?.id
  const isPending = removeMember.isPending || changeRole.isPending || transferOwnership.isPending

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
          <Select
            value={member.role}
            disabled={isPending}
            onChange={(role) => {
              setError(null)
              changeRole.mutate({ nestSlug, userId: member.user.id, role })
            }}
            options={ROLE_OPTIONS.map((role) => ({ value: role, label: role }))}
            className='w-32'
          />
        )}

        {canTransferOwnership && !isSelf && member.role !== NestMemberUpdateRoleDtoRole.OWNER && (
          <>
            <button
              type='button'
              disabled={isPending}
              onClick={() => setConfirmingTransfer(true)}
              className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
            >
              Make owner
            </button>

            <ConfirmDialog
              open={confirmingTransfer}
              title={`Make ${getUserDisplayName(member.user)} the owner?`}
              description={'You\'ll be demoted to moderator. This can\'t be undone by you alone — the new owner would need to transfer it back.'}
              confirmLabel='Make owner'
              onCancel={() => setConfirmingTransfer(false)}
              onConfirm={() => {
                setConfirmingTransfer(false)
                setError(null)
                transferOwnership.mutate({ nestSlug, userId: member.user.id })
              }}
            />
          </>
        )}

        {canRemoveMembers && !isSelf && (
          <DeleteConfirmButton
            variant='moderator'
            label='Remove'
            confirmLabel='Remove member'
            title={`Remove ${getUserDisplayName(member.user)}?`}
            description={'They\'ll lose access to this nest and will need to rejoin to get it back.'}
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
