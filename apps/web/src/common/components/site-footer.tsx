import Link from 'next/link'

const LINKS = [
  { href: '/about', label: 'About' },
  { href: '/careers', label: 'Careers' },
  { href: '/press', label: 'Press' },
  { href: '/guidelines', label: 'Guidelines' },
  { href: '/advertise', label: 'Advertise' }
]

export function SiteFooter() {
  return (
    <div className='flex flex-col gap-2 p-4 text-xs text-muted-foreground'>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className='hover:underline'>
            {link.label}
          </Link>
        ))}
      </div>

      <span>ThreadNest © 2026</span>
    </div>
  )
}
