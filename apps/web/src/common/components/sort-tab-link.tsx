import Link from 'next/link'

interface SortTabLinkProps {
  href: string
  active: boolean
  children: React.ReactNode
}

export function SortTabLink({ href, active, children }: SortTabLinkProps) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm font-medium ${active ? 'border-foreground text-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}
    >
      {children}
    </Link>
  )
}
