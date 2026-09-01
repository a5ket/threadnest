import { getNestServer } from '@/features/nest/nest.server'
import { NestPayoutSettings } from '@/features/paywall/components/nest-payout-settings'
import { NestPaywallSettings } from '@/features/paywall/components/nest-paywall-settings'
import { notFound } from 'next/navigation'

export default async function NestMonetizationPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params
  const nest = await getNestServer(nestSlug)

  if (!nest || !nest.access.isOwner) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Monetization</h2>

      <NestPaywallSettings nestSlug={nestSlug} />
      <NestPayoutSettings nestSlug={nestSlug} />
    </div>
  )
}
