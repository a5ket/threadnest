import { NestDiscoveryItem } from '@/features/nest/components/nest-discovery-item'
import { getNestsServer } from '@/features/nest/nest.server'
import { ThreadSearchResultItem } from '@/features/thread/components/thread-search-result-item'
import { searchThreadsServer } from '@/features/thread/thread.server'
import { UserSearchResultItem } from '@/features/user/components/user-search-result-item'
import { searchUsersServer } from '@/features/user/user.server'

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const search = q?.trim() || undefined

  const [nestPage, threads, users] = search
    ? await Promise.all([
        getNestsServer(undefined, search),
        searchThreadsServer(search),
        searchUsersServer(search)
      ])
    : [null, null, null]

  return (
    <div className='flex flex-col gap-6 p-6'>
      <h1 className='text-lg font-semibold'>Search</h1>

      <form className='flex items-center gap-2'>
        <input
          type='search'
          name='q'
          defaultValue={q}
          placeholder='Search nests, threads, and users...'
          className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
          autoFocus
        />
        <button type='submit' className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'>
          Search
        </button>
      </form>

      {!search && (
        <p className='text-sm text-muted-foreground'>Enter a search term to find nests, threads, and users.</p>
      )}

      {search && (
        <div className='flex flex-col gap-8'>
          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-semibold text-muted-foreground'>Nests</h2>
            {nestPage!.items.length === 0 && (
              <p className='text-sm text-muted-foreground'>No nests found.</p>
            )}
            {nestPage!.items.length > 0 && (
              <ul className='flex flex-col gap-3'>
                {nestPage!.items.map((nest) => (
                  <NestDiscoveryItem key={nest.id} nest={nest} />
                ))}
              </ul>
            )}
          </section>

          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-semibold text-muted-foreground'>Threads</h2>
            {threads!.length === 0 && (
              <p className='text-sm text-muted-foreground'>No threads found.</p>
            )}
            {threads!.length > 0 && (
              <ul className='flex flex-col gap-3'>
                {threads!.map((thread) => (
                  <ThreadSearchResultItem key={thread.id} thread={thread} />
                ))}
              </ul>
            )}
          </section>

          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-semibold text-muted-foreground'>Users</h2>
            {users!.length === 0 && (
              <p className='text-sm text-muted-foreground'>No users found.</p>
            )}
            {users!.length > 0 && (
              <ul className='flex flex-col gap-3'>
                {users!.map((user) => (
                  <UserSearchResultItem key={user.id} user={user} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
