import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-lg font-semibold'>Page not found</h1>
      <p className='text-sm text-muted-foreground'>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href='/' className='text-sm text-primary underline'>
        Go home
      </Link>
    </div>
  )
}
