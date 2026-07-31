import Link from 'next/link'
import { PropsWithChildren } from 'react'

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='flex items-center justify-center border-b p-4'>
        <Link href='/'>
          {/* TODO: logo */}
          ThreadNest
        </Link>
      </header>

      <main className='flex flex-1 items-center justify-center'>
        {children}
      </main>
    </div>
  )
}
