import { ChatListPageComponent } from '@/features/chat/components/chat-list-page'
import { getChatsServer } from '@/features/chat/chat.server'

export default async function ChatsPage() {
  const page = await getChatsServer()

  return (
    <div className='flex h-full flex-col'>
      <h1 className='border-b border-border p-4 text-lg font-semibold'>Chats</h1>
      <ChatListPageComponent initialPage={page} />
    </div>
  )
}
