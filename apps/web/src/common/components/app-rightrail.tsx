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
    <aside className='hidden w-80 shrink-0 flex-col bg-background p-4 lg:flex'>
      <div className='min-h-0 flex-1 overflow-y-auto rounded-lg bg-card'>
        {content ?? <PopularNestsWidget nests={popularNests} />}
      </div>
      <SiteFooter />
    </aside>
  )
}
