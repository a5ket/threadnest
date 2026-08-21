import { getUserProfileServer } from '@/features/user/user.server'
import { getUserActivityServer } from '@/features/user/user-activity.server'
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

  const initialActivity = profile.activityVisible ? await getUserActivityServer(username) : null

  return <UserProfileView profile={profile} initialActivity={initialActivity} />
}
