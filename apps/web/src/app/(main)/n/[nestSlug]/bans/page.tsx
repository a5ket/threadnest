import { BanList } from '@/features/nest-ban/components/ban-list'
import { getNestBansServer } from '@/features/nest-ban/nest-ban.server'
import { getNestServer } from '@/features/nest/nest.server'
import Link from 'next/link'
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
    <div className='flex flex-col gap-6 p-6'>
      <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to nest
      </Link>

      <h1 className='text-lg font-semibold'>
        {nest.name}
        {' bans'}
      </h1>

      <BanList nestSlug={nestSlug} bans={bans} />
    </div>
  )
}
