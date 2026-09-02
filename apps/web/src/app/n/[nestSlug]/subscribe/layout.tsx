import { LogoMark } from '@/common/components/logo-mark'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

export default function NestSubscribeLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='flex h-14 shrink-0 items-center border-b border-border bg-canvas px-4'>
        <Link href='/' className='flex items-center gap-2 text-lg font-semibold text-foreground'>
          <LogoMark size={26} />
          ThreadNest
        </Link>
      </header>

      <main className='flex flex-1 justify-center bg-background'>
        {children}
      </main>
    </div>
  )
}
