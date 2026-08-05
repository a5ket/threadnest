import { NestStoreProvider } from '@/features/nest/components/nest-store-provider'
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

  return (
    <NestStoreProvider key={nestSlug} initialNest={nest}>
      {children}
    </NestStoreProvider>
  )
}
