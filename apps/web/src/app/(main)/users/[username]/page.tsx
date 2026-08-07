import { getUserProfileServer } from '@/features/user/user.server'
import { UserProfileView } from '@/features/user/components/user-profile-view'
import { notFound } from 'next/navigation'

export default async function UserProfilePage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const profile = await getUserProfileServer(username)

  if (!profile) {
    notFound()
  }

  return <UserProfileView profile={profile} />
}
