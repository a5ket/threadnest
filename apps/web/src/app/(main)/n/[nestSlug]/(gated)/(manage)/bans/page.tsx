import { BanList } from '@/features/nest-ban/components/ban-list'
import { getNestBansServer } from '@/features/nest-ban/nest-ban.server'
import { getNestServer } from '@/features/nest/nest.server'
import { notFound } from 'next/navigation'

export default async function NestBansPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, bans] = await Promise.all([
    getNestServer(nestSlug),
    getNestBansServer(nestSlug)
  ])

  if (!nest || !nest.access.canManageBans) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Bans</h2>

      <BanList nestSlug={nestSlug} bans={bans} />
    </div>
  )
}
