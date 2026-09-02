import { NestStoreProvider } from '@/features/nest/components/nest-store-provider'
import { PrivateNestScreen } from '@/features/nest/components/private-nest-screen'
import { getNestServer, getNestsServer } from '@/features/nest/nest.server'
import { NestPaywallGate } from '@/features/paywall/components/nest-paywall-gate'
import { NestListSortBy } from '@/generated/api/models'
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
    const otherNests = await getNestsServer(NestListSortBy.memberCount)
    const recommendedNests = otherNests.items.filter((item) => item.slug !== nestSlug && !item.isMember).slice(0, 4)

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
          recommendedNests={recommendedNests}
        />
      )
    }

    return (
      <PrivateNestScreen
        nestSlug={nestSlug}
        name={nest.name}
        nestIconUrl={nest.iconUrl ?? null}
        joinPolicy={nest.access.joinPolicy}
        recommendedNests={recommendedNests}
      />
    )
  }

  return (
    <NestStoreProvider key={nestSlug} initialNest={nest}>
      {children}
    </NestStoreProvider>
  )
}
