import { Injectable, OnModuleInit } from '@nestjs/common'
import { Prisma, PrismaClient } from 'generated/prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }

  isUniqueConstraintError(error: unknown, field?: string) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false
    }

    if (!field) {
      return true
    }

    const target = error.meta?.target

    if (typeof target === 'string') {
      return target === field
    }

    return Array.isArray(target) && target.includes(field)
  }

  isRecordNotFoundError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    )
  }
}
