import Link from 'next/link'

export function CreateNestButton() {
  return (
    <Link
      href='/n/new'
      aria-label='Create a nest'
      className='rounded-md px-1.5 py-0.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
    >
      +
    </Link>
  )
}
