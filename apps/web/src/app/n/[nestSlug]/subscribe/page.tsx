import { getNestServer } from '@/features/nest/nest.server'
import { NestCheckoutPage } from '@/features/paywall/components/nest-checkout-page'
import { notFound, redirect } from 'next/navigation'

export default async function NestSubscribePage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params
  const nest = await getNestServer(nestSlug)

  if (!nest) {
    notFound()
  }

  if (!nest.access.isPaywalled) {
    notFound()
  }

  if (nest.access.canViewNest) {
    redirect(`/n/${nestSlug}`)
  }

  return (
    <NestCheckoutPage
      nestSlug={nestSlug}
      nestName={nest.name}
      nestIconUrl={nest.iconUrl ?? null}
      priceAmountCents={nest.access.paywallPriceAmountCents}
    />
  )
}
