import { ThreadStoreProvider } from '@/features/thread/components/thread-store-provider'
import { getThreadServer } from '@/features/thread/thread.server'
import { notFound } from 'next/navigation'

export default async function ThreadLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ nestSlug: string, threadSlug: string }>
}) {
  const { nestSlug, threadSlug } = await params
  const thread = await getThreadServer(nestSlug, threadSlug)

  if (!thread) {
    notFound()
  }

  return (
    <ThreadStoreProvider key={threadSlug} initialThread={thread}>
      {children}
    </ThreadStoreProvider>
  )
}
