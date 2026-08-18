import { NestStoreProvider } from '@/features/nest/components/nest-store-provider'
import { NestDeletedScreen } from '@/features/nest/components/nest-deleted-screen'
import { PrivateNestScreen } from '@/features/nest/components/private-nest-screen'
import { getNestServer } from '@/features/nest/nest.server'
import { notFound } from 'next/navigation'

export default async function NestLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params
  const nest = await getNestServer(nestSlug)

  if (!nest) {
    notFound()
  }

  if (nest.isDeleted) {
    return <NestDeletedScreen nestName={nest.name} />
  }

  if (!nest.access.canViewNest) {
    return <PrivateNestScreen nestSlug={nestSlug} name={nest.name} joinPolicy={nest.access.joinPolicy} />
  }

  return (
    <NestStoreProvider key={nestSlug} initialNest={nest}>
      {children}
    </NestStoreProvider>
  )
}
