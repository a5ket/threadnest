import { NestSettingsForm } from '@/features/nest/components/nest-settings-form'
import { getNestServer } from '@/features/nest/nest.server'
import { getNestSettingsServer } from '@/features/nest/nest-settings.server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NestSettingsPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, settings] = await Promise.all([
    getNestServer(nestSlug),
    getNestSettingsServer(nestSlug)
  ])

  if (!nest || !settings) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to nest
      </Link>

      <h1 className='text-lg font-semibold'>
        {nest.name}
        {' settings'}
      </h1>

      <NestSettingsForm nestSlug={nestSlug} settings={settings} readOnly={!nest.access.canManageSettings} />
    </div>
  )
}
