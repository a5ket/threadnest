import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, tokenHash: string, familyId: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, familyId, expiresAt },
      select: { id: true }
    })
  }

  async findByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, emailVerifiedAt: true }
        }
      }
    })
  }

  async revokeOne(id: string, userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }

  async revokeAll(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }

  async rotate(currentId: string, userId: string, newTokenHash: string, familyId: string, expiresAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      const newSession = await tx.refreshToken.create({
        data: { userId, tokenHash: newTokenHash, familyId, expiresAt },
        select: { id: true }
      })

      await tx.refreshToken.update({
        where: { id: currentId },
        data: { revokedAt: new Date(), replacedByTokenId: newSession.id }
      })

      return newSession
    })
  }
}
