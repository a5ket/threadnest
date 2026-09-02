import Link from 'next/link'

const LINKS = [
  { href: '/help', label: 'Help Center' },
  { href: '/content-policy', label: 'Content Policy' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' }
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
