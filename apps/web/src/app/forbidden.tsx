import Link from 'next/link'

export default function Forbidden() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-lg font-semibold'>Access denied</h1>
      <p className='text-sm text-muted-foreground'>You don&apos;t have permission to view this page.</p>
      <Link href='/' className='text-sm text-primary underline'>
        Go home
      </Link>
    </div>
  )
}
