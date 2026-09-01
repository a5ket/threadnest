import { NestStoreProvider } from '@/features/nest/components/nest-store-provider'
import { PrivateNestScreen } from '@/features/nest/components/private-nest-screen'
import { getNestServer } from '@/features/nest/nest.server'
import { NestPaywallGate } from '@/features/paywall/components/nest-paywall-gate'
import { notFound } from 'next/navigation'

export default async function NestGatedLayout({
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

  if (!nest.access.canViewNest) {
    if (nest.access.isPaywalled) {
      return (
        <NestPaywallGate
          nestSlug={nestSlug}
          nestName={nest.name}
          nestIconUrl={nest.iconUrl ?? null}
          description={nest.description ?? null}
          memberCount={nest.memberCount ?? null}
          threadCount={nest.threadCount ?? null}
          priceAmountCents={nest.access.paywallPriceAmountCents}
        />
      )
    }

    return <PrivateNestScreen nestSlug={nestSlug} name={nest.name} joinPolicy={nest.access.joinPolicy} />
  }

  return (
    <NestStoreProvider key={nestSlug} initialNest={nest}>
      {children}
    </NestStoreProvider>
  )
}
