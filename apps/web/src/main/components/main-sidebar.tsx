import { useMeNests } from '@/features/me/me.hooks'
import { NestReferenceItem } from '@/features/nest/components/nest-reference-item'
import Link from 'next/link'
import { CreateNestButton } from './create-nest-button'

export function MainSidebar() {
  const userNests = useMeNests()

  return (
    <div className='flex h-full flex-col gap-1 p-3'>
      <Link href='/discover' className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'>
        Discover
      </Link>

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
    </div>
  )
}
