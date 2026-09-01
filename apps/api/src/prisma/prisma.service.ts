import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from 'generated/prisma/client'
import { AppConfig } from 'src/app.config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(config: ConfigService<AppConfig>) {
    super({ adapter: new PrismaPg({ connectionString: config.getOrThrow('databaseUrl', { infer: true }) }) })
  }

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
    if (typeof target === 'string') return target === field
    if (Array.isArray(target)) return target.includes(field)

    const driverAdapterError = error.meta?.driverAdapterError as { cause?: { constraint?: { fields?: unknown } } } | undefined
    const fields = driverAdapterError?.cause?.constraint?.fields

    return Array.isArray(fields) && fields.some((f) => typeof f === 'string' && f.replace(/"/g, '') === field)
  }

  isRecordNotFoundError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    )
  }
}
