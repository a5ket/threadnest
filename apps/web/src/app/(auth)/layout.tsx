import { LogoMark } from '@/common/components/logo-mark'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex min-h-screen'>
      <div className='relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 p-10 text-white lg:flex'>
        <div className='pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl' />
        <div className='pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/10 blur-3xl' />
        <div className='pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl' />

        <Link href='/' className='relative flex items-center gap-2 text-lg font-semibold [&_svg]:text-white'>
          <LogoMark size={28} />
          ThreadNest
        </Link>

        <div className='relative flex flex-col gap-4'>
          <h2 className='max-w-sm text-3xl font-semibold leading-tight'>
            Where communities gather around what they care about.
          </h2>
          <p className='max-w-sm text-sm text-white/80'>
            Create nests, start threads, and build spaces your members actually want to be in.
          </p>
        </div>

        <p className='relative text-xs text-white/60'>
          © 2026 ThreadNest
        </p>
      </div>

      <div className='flex flex-1 flex-col'>
        <header className='flex h-14 shrink-0 items-center border-b border-border bg-background px-4 lg:hidden'>
          <Link href='/' className='flex items-center gap-2 text-lg font-semibold text-foreground'>
            <LogoMark size={26} />
            ThreadNest
          </Link>
        </header>

        <main className='flex flex-1 items-center justify-center p-6'>
          {children}
        </main>
      </div>
    </div>
  )
}
