import Link from 'next/link'

export default function NestNotFound() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-lg font-semibold'>Nest not found</h1>
      <p className='text-sm text-muted-foreground'>This nest doesn&apos;t exist, or you can&apos;t view it.</p>
      <Link href='/' className='text-sm text-primary underline'>
        Go home
      </Link>
    </div>
  )
}
