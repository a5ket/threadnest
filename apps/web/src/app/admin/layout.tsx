import { AdminHeader } from '@/admin/components/admin-header'
import { getMeServer } from '@/features/me/me.server'
import { forbidden, unauthorized } from 'next/navigation'
import { PropsWithChildren } from 'react'

export default async function AdminLayout({ children }: PropsWithChildren) {
  const me = await getMeServer()

  if (me.status !== 'signed-in') {
    unauthorized()
  }

  if (!me.data.user.platformAccess.isModerator) {
    forbidden()
  }

  return (
    <div className='flex h-screen flex-col'>
      <AdminHeader />
      <main className='min-h-0 flex-1 overflow-y-auto'>
        {children}
      </main>
    </div>
  )
}
