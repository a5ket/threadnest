import { MemberList } from '@/features/nest-member/components/member-list'
import { getNestMembersServer } from '@/features/nest-member/nest-member.server'
import { getNestServer } from '@/features/nest/nest.server'
import { notFound } from 'next/navigation'

export default async function NestMembersPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, members] = await Promise.all([
    getNestServer(nestSlug),
    getNestMembersServer(nestSlug)
  ])

  if (!nest || !nest.access.canViewMembers) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Members</h2>

      <MemberList
        nestSlug={nestSlug}
        members={members}
        canRemoveMembers={nest.access.canRemoveMembers}
        canManageMemberRoles={nest.access.canManageMemberRoles}
        canTransferOwnership={nest.access.canTransferOwnership}
      />
    </div>
  )
}
