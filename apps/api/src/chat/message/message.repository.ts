import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { MessageCreateDto } from './dto/message-create.dto'
import { MessageQueryDto } from './dto/message.query.dto'
import { MessageNotFoundException } from '../exceptions/message-not-found.exception'
import { MESSAGE_SELECT } from './selects/message.select'

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) { }

  async getById(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: MESSAGE_SELECT
    })

    if (!message) {
      throw new MessageNotFoundException()
    }

    return message
  }

  async create(chatId: string, senderId: string, dto: MessageCreateDto) {
    return this.prisma.message.create({
      data: {
        chatId,
        senderId,
        content: dto.content,
        replyToId: dto.replyToId
      },
      select: MESSAGE_SELECT
    })
  }

  async list(chatId: string, viewerClearedAt: Date | null, query: MessageQueryDto) {
    let cursorWhere: Prisma.MessageWhereInput = {}

    if (query.cursor) {
      try {
        const { date, id } = decodeCursor(query.cursor)
        cursorWhere = {
          OR: [
            { createdAt: { lt: date } },
            { createdAt: date, id: { lt: id } }
          ]
        }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        ...(viewerClearedAt ? { createdAt: { gt: viewerClearedAt } } : {}),
        ...cursorWhere
      },
      select: MESSAGE_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1
    })

    const hasMore = messages.length > query.limit
    const items = hasMore ? messages.slice(0, query.limit) : messages
    const last = items.at(-1)

    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.id) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  async softDelete(messageId: string, deletedById: string) {
    try {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date(), deletedById }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new MessageNotFoundException()
      }

      throw error
    }
  }
}
