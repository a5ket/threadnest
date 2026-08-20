import { FeedList } from '@/features/feed/components/feed-list'
import { getFeedServer } from '@/features/feed/feed.server'
import Link from 'next/link'

export default async function Home() {
  const page = await getFeedServer()

  if (!page) {
    return (
      <div className='flex flex-col items-center gap-4 p-12 text-center'>
        <h1 className='text-lg font-semibold'>Welcome to ThreadNest</h1>
        <p className='text-sm text-muted-foreground'>Sign in and join a nest to see its threads here.</p>
        <div className='flex gap-3'>
          <Link href='/login' className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'>
            Sign in
          </Link>
          <Link href='/discover' className='rounded-md border border-input px-4 py-2 text-sm'>
            Discover nests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <h1 className='text-lg font-semibold'>Your feed</h1>

      <FeedList initialPage={page} />
    </div>
  )
}
