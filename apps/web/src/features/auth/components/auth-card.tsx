import { PropsWithChildren } from 'react'

export function AuthCard({ children }: PropsWithChildren) {
  return (
    <div className='w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm'>
      {children}
    </div>
  )
}
