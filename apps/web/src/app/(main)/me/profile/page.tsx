import { ProfileSettingsPanel } from '@/features/me/components/profile-settings-panel'
import { getMeServer } from '@/features/me/me.server'
import { getUserProfileServer } from '@/features/user/user.server'
import { notFound } from 'next/navigation'

export default async function ProfileSettingsPage() {
  const me = await getMeServer()

  if (me.status !== 'signed-in') {
    notFound()
  }

  const profile = await getUserProfileServer(me.data.user.username)

  if (!profile) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-lg font-semibold'>Profile</h1>
      <ProfileSettingsPanel profile={profile} />
    </div>
  )
}
