import { SavedThreadList } from '@/features/saved-thread/components/saved-thread-list'
import { getSavedThreadsServer } from '@/features/saved-thread/saved-thread.server'

export default async function SavedThreadsPage() {
  const page = await getSavedThreadsServer()

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-lg font-semibold'>Saved threads</h1>

      <SavedThreadList initialPage={page} />
    </div>
  )
}
