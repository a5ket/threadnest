import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ChatQueryDto } from './dto/chat.query.dto'
import { ChatNotFoundException } from './exceptions/chat-not-found.exception'
import { CHAT_POLICY_SUBJECT_SELECT } from './selects/chat.policy-subject.select'
import { chatSummarySelect } from './selects/chat.summary.select'

function directKeyFor(userIdA: string, userIdB: string) {
  return [userIdA, userIdB].sort().join(':')
}

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) { }

  async getById(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: CHAT_POLICY_SUBJECT_SELECT
    })

    if (!chat) {
      throw new ChatNotFoundException()
    }

    return chat
  }

  async getSummaryById(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: chatSummarySelect()
    })

    if (!chat) {
      throw new ChatNotFoundException()
    }

    return chat
  }

  async findDirect(userIdA: string, userIdB: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { directKey: directKeyFor(userIdA, userIdB) },
      select: chatSummarySelect()
    })

    return chat
  }

  async createDirect(userIdA: string, userIdB: string) {
    const directKey = directKeyFor(userIdA, userIdB)

    try {
      return await this.prisma.chat.create({
        data: {
          isGroup: false,
          directKey,
          participants: { create: [{ userId: userIdA }, { userId: userIdB }] }
        },
        select: chatSummarySelect()
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error, 'directKey')) {
        const existing = await this.findDirect(userIdA, userIdB)
        if (existing) return existing
      }

      throw error
    }
  }

  async list(viewerId: string, query: ChatQueryDto) {
    let cursorWhere: Prisma.ChatWhereInput = {}

    if (query.cursor) {
      try {
        const { date, id } = decodeCursor(query.cursor)
        cursorWhere = {
          OR: [
            { lastMessageAt: { lt: date } },
            { lastMessageAt: date, id: { lt: id } }
          ]
        }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const chats = await this.prisma.chat.findMany({
      where: {
        participants: { some: { userId: viewerId, archivedAt: query.archived ? { not: null } : null } },
        lastMessageAt: { not: null },
        ...cursorWhere
      },
      select: chatSummarySelect(),
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1
    })

    const hasMore = chats.length > query.limit
    const page = hasMore ? chats.slice(0, query.limit) : chats
    const last = page.at(-1)

    const nextCursor = last && hasMore && last.lastMessageAt ? encodeCursor(last.lastMessageAt, last.id) : null

    // Cleared chats stay hidden from the clearing participant until a message lands after their clearedAt -
    // Prisma can't express "sibling relation field > this row's own field" declaratively, so filter here.
    const items = page.filter((chat) => {
      const me = chat.participants.find((p) => p.userId === viewerId)
      return !me?.clearedAt || (chat.lastMessageAt && chat.lastMessageAt > me.clearedAt)
    })

    return { items, meta: { nextCursor, hasMore } }
  }

  async touchLastMessageAt(chatId: string, at: Date) {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: at }
    })
  }

  async listUnreadCandidates(viewerId: string) {
    return this.prisma.chatParticipant.findMany({
      where: { userId: viewerId, archivedAt: null, chat: { lastMessageAt: { not: null } } },
      select: { lastReadAt: true, clearedAt: true, chat: { select: { lastMessageAt: true } } }
    })
  }

  async setArchived(chatId: string, userId: string, archivedAt: Date | null) {
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { archivedAt }
    })
  }

  async clear(chatId: string, userId: string) {
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { clearedAt: new Date(), archivedAt: null }
    })
  }

  // Returns whether this call actually caught the participant up on unread content, so callers
  // can decide whether a read receipt is worth publishing - most calls are no-op re-reads.
  async markRead(chatId: string, userId: string, at: Date = new Date()): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { lastReadAt: true, chat: { select: { lastMessageAt: true } } }
    })

    const hadUnread = Boolean(
      participant?.chat.lastMessageAt
      && (!participant.lastReadAt || participant.lastReadAt < participant.chat.lastMessageAt)
    )

    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: at }
    })

    return hadUnread
  }
}
