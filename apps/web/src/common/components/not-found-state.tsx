import Link from 'next/link'

interface NotFoundStateProps {
  title: string
  description: string
  backHref?: string
  backLabel?: string
}

export function NotFoundState({ title, description, backHref = '/', backLabel = 'Go home' }: NotFoundStateProps) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center'>
      <svg viewBox='0 0 100 100' fill='none' className='h-20 w-20 text-muted-foreground' aria-hidden='true'>
        <polygon points='50,8 86.4,29 86.4,71 50,92 13.6,71 13.6,29' stroke='currentColor' strokeWidth={4} strokeLinejoin='round' strokeDasharray='10 8' opacity={0.5} />
        <circle cx='50' cy='46' r='4' fill='currentColor' />
        <path d='M50 58 V64' stroke='currentColor' strokeWidth={4} strokeLinecap='round' />
      </svg>

      <div className='flex flex-col gap-1.5'>
        <h1 className='text-lg font-semibold'>{title}</h1>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>

      <Link
        href={backHref}
        className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'
      >
        {backLabel}
      </Link>
    </div>
  )
}
