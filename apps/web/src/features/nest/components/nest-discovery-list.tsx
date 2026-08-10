'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useNestList } from '@/features/nest/nest.hooks'
import type { NestListPage } from '@/features/nest/nest.server'
import type { NestListSortBy } from '@/generated/api/models'
import { NestDiscoveryItem } from './nest-discovery-item'

interface NestDiscoveryListProps {
  sortBy: NestListSortBy
  search: string | undefined
  initialPage: NestListPage
}

export function NestDiscoveryList({ sortBy, search, initialPage }: NestDiscoveryListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNestList(sortBy, search, initialPage)
  const nests = data.pages.flatMap((page) => page.items)

  return (
    <ul className='flex flex-col gap-3 pb-6'>
      {nests.map((nest) => (
        <NestDiscoveryItem key={nest.id} nest={nest} />
      ))}

      {nests.length === 0 && (
        <p className='text-sm text-muted-foreground'>No nests found.</p>
      )}

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && nests.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </ul>
  )
}
