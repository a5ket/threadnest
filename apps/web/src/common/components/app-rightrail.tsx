'use client'

import { PopularNestsWidget } from '@/features/nest/components/popular-nests-widget'
import type { NestDiscoveryItem } from '@/features/nest/nest.types'
import { SiteFooter } from './site-footer'
import { useRightRailContent, useRightRailHidden } from './right-rail-context'

interface AppRightrailProps {
  popularNests: NestDiscoveryItem[]
}

export function AppRightrail({ popularNests }: AppRightrailProps) {
  const hidden = useRightRailHidden()
  const content = useRightRailContent()

  if (hidden) return null

  return (
    <aside className='hidden w-80 shrink-0 bg-canvas p-4 lg:flex lg:flex-col'>
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background'>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {content ?? <PopularNestsWidget nests={popularNests} />}
        </div>
        <SiteFooter />
      </div>
    </aside>
  )
}
