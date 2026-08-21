'use client'

import { PopularNestsWidget } from '@/features/nest/components/popular-nests-widget'
import type { NestDiscoveryItem } from '@/features/nest/nest.types'
import { useRightRailContent } from './right-rail-context'

interface AppRightrailProps {
  popularNests: NestDiscoveryItem[]
}

export function AppRightrail({ popularNests }: AppRightrailProps) {
  const content = useRightRailContent()

  if (content) return content

  return <PopularNestsWidget nests={popularNests} />
}
