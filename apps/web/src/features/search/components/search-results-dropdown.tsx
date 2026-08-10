import { Avatar } from '@/common/components/avatar'
import type { NestDiscoveryItem } from '@/features/nest/nest.types'
import type { ThreadSearchResult } from '@/features/thread/thread.types'
import type { UserSearchResult } from '@/features/user/user.types'
import Link from 'next/link'

interface SearchResultsDropdownProps {
  term: string
  nests: NestDiscoveryItem[]
  threads: ThreadSearchResult[]
  users: UserSearchResult[]
  isLoading: boolean
  hasResults: boolean
  onNavigate: () => void
}

function SearchSection({ label, empty, children }: { label: string, empty: boolean, children: React.ReactNode }) {
  if (empty) return null

  return (
    <div className='py-1'>
      <p className='px-3 py-1 text-xs font-semibold text-muted-foreground'>{label}</p>
      {children}
    </div>
  )
}

export function SearchResultsDropdown({ term, nests, threads, users, isLoading, hasResults, onNavigate }: SearchResultsDropdownProps) {
  return (
    <div className='max-h-[70vh] overflow-y-auto py-1'>
      {isLoading && (
        <p className='px-3 py-3 text-sm text-muted-foreground'>Searching...</p>
      )}

      {!isLoading && !hasResults && (
        <p className='px-3 py-3 text-sm text-muted-foreground'>
          {'No results for \''}
          {term}
          {'\''}
        </p>
      )}

      {!isLoading && (
        <>
          <SearchSection label='Nests' empty={nests.length === 0}>
            {nests.map((nest) => (
              <Link
                key={nest.id}
                href={`/n/${nest.slug}`}
                onClick={onNavigate}
                className='block px-3 py-2 text-sm hover:bg-muted'
              >
                <span className='font-medium'>{nest.name}</span>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {nest.memberCount}
                  {' members'}
                </span>
              </Link>
            ))}
          </SearchSection>

          <SearchSection label='Threads' empty={threads.length === 0}>
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/n/${thread.nest.slug}/t/${thread.slug}`}
                onClick={onNavigate}
                className='block px-3 py-2 text-sm hover:bg-muted'
              >
                <span className='font-medium'>{thread.title}</span>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {'in '}
                  {thread.nest.name}
                </span>
              </Link>
            ))}
          </SearchSection>

          <SearchSection label='Users' empty={users.length === 0}>
            {users.map((user) => (
              user.username && (
                <Link
                  key={user.id}
                  href={`/users/${user.username}`}
                  onClick={onNavigate}
                  className='flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted'
                >
                  <Avatar avatarUrl={user.avatarUrl} label={user.displayName ?? user.username} size={20} />
                  <span className='font-medium'>{user.displayName ?? user.username}</span>
                </Link>
              )
            ))}
          </SearchSection>

          {hasResults && (
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              onClick={onNavigate}
              className='block border-t border-border px-3 py-2 text-sm font-medium text-primary hover:underline'
            >
              See all results
            </Link>
          )}
        </>
      )}
    </div>
  )
}
