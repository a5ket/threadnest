import Link from 'next/link'

export default function Unauthorized() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-lg font-semibold'>Sign in required</h1>
      <p className='text-sm text-muted-foreground'>You need to sign in to view this page.</p>
      <Link href='/login' className='text-sm text-primary underline'>
        Sign in
      </Link>
    </div>
  )
}
