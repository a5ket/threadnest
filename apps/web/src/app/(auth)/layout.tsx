import { LogoMark } from '@/common/components/logo-mark'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex min-h-screen'>
      <div className='relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex'>
        <div className='pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10' />

        <Link href='/' className='relative flex items-center gap-2 text-lg font-semibold [&_svg]:text-primary-foreground'>
          <LogoMark size={28} />
          ThreadNest
        </Link>

        <div className='relative flex flex-col gap-4'>
          <h2 className='max-w-sm text-3xl font-semibold leading-tight'>
            Where communities gather around what they care about.
          </h2>
          <p className='max-w-sm text-sm text-primary-foreground/80'>
            Create nests, start threads, and build spaces your members actually want to be in.
          </p>
        </div>

        <p className='relative text-xs text-primary-foreground/60'>
          © 2026 ThreadNest
        </p>
      </div>

      <div className='flex flex-1 flex-col'>
        <header className='flex h-14 shrink-0 items-center border-b border-border bg-canvas px-4 lg:hidden'>
          <Link href='/' className='flex items-center gap-2 text-lg font-semibold text-foreground'>
            <LogoMark size={26} />
            ThreadNest
          </Link>
        </header>

        <main className='flex flex-1 items-center justify-center bg-background p-6'>
          {children}
        </main>
      </div>
    </div>
  )
}
