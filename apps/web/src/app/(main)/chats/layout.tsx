import { ChatsLayoutShell } from '@/features/chat/components/chats-layout-shell'
import { getChatsServer } from '@/features/chat/chat.server'

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const page = await getChatsServer()

  return <ChatsLayoutShell initialPage={page}>{children}</ChatsLayoutShell>
}
