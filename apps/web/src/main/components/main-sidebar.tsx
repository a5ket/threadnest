import { useMeNests, useUser } from '@/features/me/me.hooks'
import { NestReferenceItem } from '@/features/nest/components/nest-reference-item'
import Link from 'next/link'
import { CreateNestButton } from './create-nest-button'

export function MainSidebar() {
  const userNests = useMeNests()
  const user = useUser()

  return (
    <div className='flex h-full flex-col gap-1 p-3'>
      <Link href='/' className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'>
        Home
      </Link>

      <Link href='/discover' className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'>
        Discover
      </Link>

      {user && (
        <Link href='/me/saved' className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'>
          Saved
        </Link>
      )}

      {user?.platformAccess.isModerator && (
        <Link href='/admin' className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'>
          Admin
        </Link>
      )}

      <div className='mt-4 flex items-center justify-between px-3'>
        <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Nests</span>
        <CreateNestButton />
      </div>

      <div className='flex flex-col gap-0.5'>
        {userNests.map((nest) => <NestReferenceItem key={nest.slug} nest={nest} />)}

        {userNests.length === 0 && (
          <p className='px-3 py-2 text-sm text-muted-foreground'>No nests yet.</p>
        )}
      </div>

      <div className='mt-5 flex flex-col gap-1.5 px-3'>
        <Link href='/help' className='text-xs text-muted-foreground hover:underline'>Help Center</Link>
        <Link href='/content-policy' className='text-xs text-muted-foreground hover:underline'>Content Policy</Link>
        <Link href='/privacy' className='text-xs text-muted-foreground hover:underline'>Privacy Policy</Link>
        <Link href='/terms' className='text-xs text-muted-foreground hover:underline'>Terms of Service</Link>
      </div>
    </div>
  )
}
