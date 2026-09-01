import type { Socket } from 'socket.io-client'

// The full-page chats layout keeps every visible chat's room joined for the whole list at once,
// while an open ChatPanel joins its own chat too - both can want the same room simultaneously.
// The gateway's join/leave has no concept of "still wanted by someone else", so without this a
// panel unmounting (e.g. switching chats) would leave a room the list is still relying on.
// Ref-counted per socket so leave only actually happens once nothing wants the room anymore.
const refCounts = new WeakMap<Socket, Map<string, number>>()

export function joinChatRoom(socket: Socket, chatId: string) {
  const counts = refCounts.get(socket) ?? new Map<string, number>()
  refCounts.set(socket, counts)

  const count = (counts.get(chatId) ?? 0) + 1
  counts.set(chatId, count)

  if (count === 1) {
    socket.emit('chat:join', { chatId })
  }
}

export function leaveChatRoom(socket: Socket, chatId: string) {
  const counts = refCounts.get(socket)
  const count = (counts?.get(chatId) ?? 0) - 1

  if (!counts || count <= 0) {
    counts?.delete(chatId)
    socket.emit('chat:leave', { chatId })
    return
  }

  counts.set(chatId, count)
}
