import { SortTabLink } from '@/common/components/sort-tab-link'
import { NestDiscoveryList } from '@/features/nest/components/nest-discovery-list'
import { getNestsServer } from '@/features/nest/nest.server'
import { NestListSortBy } from '@/generated/api/models'

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ sort?: string, q?: string }>
}) {
  const { sort, q } = await searchParams
  const sortBy = sort === 'members' ? NestListSortBy.memberCount : NestListSortBy.createdAt
  const search = q?.trim() || undefined

  const page = await getNestsServer(sortBy, search)
  const sortQuery = q ? `&q=${encodeURIComponent(q)}` : ''

  return (
    <div className='flex flex-col gap-6 p-6'>
      <h1 className='text-lg font-semibold'>Discover nests</h1>

      <form className='flex items-center gap-2'>
        {sort && <input type='hidden' name='sort' value={sort} />}
        <input
          type='search'
          name='q'
          defaultValue={q}
          placeholder='Search nests...'
          className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
        />
        <button type='submit' className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'>
          Search
        </button>
      </form>

      <div className='flex items-center gap-2'>
        <SortTabLink href={q ? `/discover?q=${encodeURIComponent(q)}` : '/discover'} active={sort !== 'members'}>
          New
        </SortTabLink>
        <SortTabLink href={`/discover?sort=members${sortQuery}`} active={sort === 'members'}>
          Most members
        </SortTabLink>
      </div>

      <NestDiscoveryList sortBy={sortBy} search={search} initialPage={page} />
    </div>
  )
}
