import Link from 'next/link'

export function NestDeletedScreen({ nestName }: { nestName: string }) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-lg font-semibold'>{nestName}</h1>
      <p className='text-sm text-muted-foreground'>This nest has been deleted.</p>
      <Link href='/' className='text-sm text-primary underline'>
        Go home
      </Link>
    </div>
  )
}
