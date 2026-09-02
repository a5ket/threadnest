import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ChatQueryDto } from './dto/chat.query.dto'
import { ChatNotFoundException } from './exceptions/chat-not-found.exception'
import { CHAT_POLICY_SUBJECT_SELECT } from './selects/chat.policy-subject.select'
import { chatSummarySelect } from './selects/chat.summary.select'

/**
 * Order-independent key for a 1:1 chat between two users, backed by a DB unique constraint on
 * `directKey` — this is what makes {@link ChatRepository.createDirect} race-safe.
 *
 * @param userIdA - One participant, in either order.
 * @param userIdB - The other participant, in either order.
 * @returns A stable key identical regardless of argument order.
 */
function directKeyFor(userIdA: string, userIdB: string) {
  return [userIdA, userIdB].sort().join(':')
}

/** Persistence for chats and chat participants. */
@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param chatId - The chat to fetch.
   * @returns The minimal policy-subject shape (participants only) used for access checks.
   * @throws {ChatNotFoundException} No chat with this id.
   */
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

  /**
   * @param chatId - The chat to fetch.
   * @returns The presenter-ready shape: participants, latest message, and metadata.
   * @throws {ChatNotFoundException} No chat with this id.
   */
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

  /**
   * @param userIdA - One participant, in either order.
   * @param userIdB - The other participant, in either order.
   * @returns The existing 1:1 chat between these two users, or `null` if none exists yet.
   */
  async findDirect(userIdA: string, userIdB: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { directKey: directKeyFor(userIdA, userIdB) },
      select: chatSummarySelect()
    })

    return chat
  }

  /**
   * Creates the 1:1 chat between two users. Race-safe: if a concurrent call already created it
   * (caught via the `directKey` unique constraint), returns that existing chat instead of
   * throwing or creating a duplicate.
   *
   * @param userIdA - One participant, in either order.
   * @param userIdB - The other participant, in either order.
   * @returns The newly created chat, or the pre-existing one if a race was detected.
   */
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

  /**
   * Lists the viewer's chats (archived or active, per `query.archived`), newest activity first.
   * Chats with no messages yet are excluded — a chat only appears once someone has sent
   * something. A chat the viewer cleared stays hidden from them until a new message lands after
   * their `clearedAt`; that filter is applied in-memory after the DB page is fetched, since
   * Prisma can't express "sibling relation field > this row's own field" declaratively — this can
   * make a page shorter than `query.limit` even when `hasMore` is true.
   *
   * @param viewerId - The user whose chats to list.
   * @param query - Pagination cursor/limit and the archived/active filter.
   * @returns A cursor-paginated page of chat summaries.
   * @throws {InvalidCursorException} `query.cursor` is malformed.
   */
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

  /**
   * Bumps the chat's `lastMessageAt`, called after a new message is sent. This is what makes the
   * chat sortable in {@link list} and eligible for the unread/preview logic — a chat with no
   * messages has `lastMessageAt: null` and is excluded from listings entirely.
   *
   * @param chatId - The chat to touch.
   * @param at - The new message's timestamp.
   */
  async touchLastMessageAt(chatId: string, at: Date) {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: at }
    })
  }

  /**
   * @param viewerId - The user to fetch unread candidates for.
   * @returns Every non-archived chat participation with activity, for the caller to filter
   * in-memory (clear/read timestamps can't be compared to a sibling relation's field in a single
   * Prisma query).
   */
  async listUnreadCandidates(viewerId: string) {
    return this.prisma.chatParticipant.findMany({
      where: { userId: viewerId, archivedAt: null, chat: { lastMessageAt: { not: null } } },
      select: { lastReadAt: true, clearedAt: true, chat: { select: { lastMessageAt: true } } }
    })
  }

  /**
   * @param chatId - The chat to (un)archive.
   * @param userId - The participant whose archive state to change.
   * @param archivedAt - The archive timestamp, or `null` to unarchive.
   */
  async setArchived(chatId: string, userId: string, archivedAt: Date | null) {
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { archivedAt }
    })
  }

  /**
   * Sets the participant's clear cutoff to now and un-archives them — clearing an archived chat
   * implicitly restores it to the active list, since there's nothing left worth hiding it for.
   *
   * @param chatId - The chat to clear.
   * @param userId - The participant clearing it.
   */
  async clear(chatId: string, userId: string) {
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { clearedAt: new Date(), archivedAt: null }
    })
  }

  /**
   * @param chatId - The chat being read.
   * @param userId - The participant reading it.
   * @param at - The read timestamp.
   * @returns Whether the participant actually had unread content before this call, so callers can
   * decide whether a read receipt is worth publishing — most calls are no-op re-reads.
   */
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
