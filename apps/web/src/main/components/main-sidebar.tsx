import { BriefcaseIcon, InfoIcon, MegaphoneIcon, ChecklistIcon, TagIcon } from '@/common/components/footer-link-icons'
import { useMeNests, useUser } from '@/features/me/me.hooks'
import { NestReferenceItem } from '@/features/nest/components/nest-reference-item'
import Link from 'next/link'
import { CreateNestButton } from './create-nest-button'

function HomeIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
      <path d='M3 9.5L10 3l7 6.5' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M5 8.5V16a1 1 0 001 1h3v-4.5h2V17h3a1 1 0 001-1V8.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

function DiscoverIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
      <circle cx='10' cy='10' r='7' />
      <path d='M12.5 7.5l-1.8 4.2-4.2 1.8 1.8-4.2z' strokeLinejoin='round' />
    </svg>
  )
}

function SavedIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
      <path d='M5.5 3.5h9a.5.5 0 01.5.5v12.5l-5-3-5 3V4a.5.5 0 01.5-.5z' strokeLinejoin='round' />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
      <path d='M10 2.5l6.2 2.3v4.4c0 4.2-2.7 7-6.2 8.3-3.5-1.3-6.2-4.1-6.2-8.3V4.8L10 2.5Z' strokeLinejoin='round' />
    </svg>
  )
}

const NAV_LINK_CLASS = 'flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted'

export function MainSidebar() {
  const userNests = useMeNests()
  const user = useUser()

  return (
    <div className='flex h-full flex-col gap-1 p-3'>
      <Link href='/' className={NAV_LINK_CLASS}>
        <HomeIcon />
        Home
      </Link>

      <Link href='/discover' className={NAV_LINK_CLASS}>
        <DiscoverIcon />
        Discover
      </Link>

      {user && (
        <Link href='/me/saved' className={NAV_LINK_CLASS}>
          <SavedIcon />
          Saved
        </Link>
      )}

      {user?.platformAccess.isModerator && (
        <Link href='/admin' className={NAV_LINK_CLASS}>
          <AdminIcon />
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

      <div className='mt-5 flex flex-col gap-1.5 border-t border-divider px-3 pt-4'>
        <Link href='/about' className='flex items-center gap-2 text-xs text-muted-foreground hover:underline'>
          <InfoIcon />
          About
        </Link>
        <Link href='/careers' className='flex items-center gap-2 text-xs text-muted-foreground hover:underline'>
          <BriefcaseIcon />
          Careers
        </Link>
        <Link href='/press' className='flex items-center gap-2 text-xs text-muted-foreground hover:underline'>
          <MegaphoneIcon />
          Press
        </Link>
        <Link href='/guidelines' className='flex items-center gap-2 text-xs text-muted-foreground hover:underline'>
          <ChecklistIcon />
          Guidelines
        </Link>
        <Link href='/advertise' className='flex items-center gap-2 text-xs text-muted-foreground hover:underline'>
          <TagIcon />
          Advertise
        </Link>
      </div>
    </div>
  )
}
