import { env } from '@/config/env'

export function DemoBanner() {
  if (!env.demoMode) return null

  return (
    <div className='border-b border-border bg-muted px-4 py-2 text-center text-sm text-muted-foreground'>
      <span className='font-medium text-foreground'>Demo mode</span>
      {' — payments on this site are not real and exist for demonstration only.'}
    </div>
  )
}
