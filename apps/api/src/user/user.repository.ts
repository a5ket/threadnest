import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { USER_AUTH_SELECT } from './selects/user.auth.select'
import { UserNotFoundException } from './exceptions/user-not-found.exception'

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async exists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    return Boolean(user)
  }

  async findByIdWithEmail(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true }
    })
  }

  async existsByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    return Boolean(user)
  }

  async findByEmailWithCredentials(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_AUTH_SELECT
    })
  }

  async getByIdWithCredentials(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    return user
  }

  async updatePassword(userId: string, passwordHash: string, db: Database = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true }
    })
  }

  async markEmailVerified(userId: string, db: Database = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
      select: { id: true }
    })
  }

  async updateEmail(userId: string, email: string, db: Database = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { email, emailVerifiedAt: new Date() },
      select: { id: true }
    })
  }

  async create(email: string, passwordHash: string, db: Database = this.prisma) {
    return db.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true }
    })
  }
}