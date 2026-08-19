import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export const MESSAGE_SELECT = {
  id: true,
  chatId: true,
  senderId: true,
  content: true,
  replyToId: true,
  deletedAt: true,
  deletedById: true,
  createdAt: true,

  sender: { select: USER_REFERENCE_SELECT },

  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      deletedAt: true,
    }
  }
} satisfies Prisma.MessageSelect
