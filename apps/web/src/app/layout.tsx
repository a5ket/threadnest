import { getMeServer } from '@/features/me/me.server'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'ThreadNest',
  description: 'Create and join communities around shared interests'
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const me = await getMeServer()

  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <Providers initialMe={me}>{children}</Providers>
      </body>
    </html>
  )
}
