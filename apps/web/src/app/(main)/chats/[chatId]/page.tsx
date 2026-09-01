import { ChatPanel } from '@/features/chat/components/chat-panel'
import { getChatServer, getMessagesServer } from '@/features/chat/chat.server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ChatPageProps {
  params: Promise<{ chatId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params

  const chat = await getChatServer(chatId)

  if (!chat) {
    notFound()
  }

  const messages = await getMessagesServer(chatId)

  return (
    <div className='flex h-full flex-col'>
      <Link href='/chats' className='border-b border-border p-3 text-sm text-muted-foreground hover:underline lg:hidden'>
        ← Back to chats
      </Link>

      <div className='min-h-0 flex-1'>
        <ChatPanel chatId={chatId} initialMessages={messages} />
      </div>
    </div>
  )
}
