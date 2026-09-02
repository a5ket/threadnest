import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from 'generated/prisma/client'
import { AppConfig } from 'src/app.config'

/**
 * The application's Prisma client, extended with typed helpers for recognizing specific Postgres
 * error codes — used throughout the repository layer to turn a raw constraint violation into a
 * meaningful domain exception instead of a generic 500.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(config: ConfigService<AppConfig>) {
    super({ adapter: new PrismaPg({ connectionString: config.getOrThrow('databaseUrl', { infer: true }) }) })
  }

  async onModuleInit() {
    await this.$connect()
  }

  /**
   * Recognizes Postgres unique-constraint violations (`P2002`), optionally narrowed to one
   * specific field. The target field can surface in either of two shapes depending on how the
   * query was built: `error.meta.target` (a string or array of column names) for most queries, or
   * a `driverAdapterError` with a nested `constraint.fields` array — checked as a fallback since
   * the `@prisma/adapter-pg` driver adapter doesn't always populate `target`.
   *
   * @param error - The caught value to check.
   * @param field - Narrow to a violation on this specific column; omit to match any unique
   * constraint violation regardless of field.
   * @returns Whether `error` is a unique-constraint violation (on `field`, if given).
   */
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

  /**
   * Recognizes Prisma's "record to update/delete not found" error (`P2025`) — thrown when an
   * `update`/`delete`/`updateMany` targets a row that doesn't exist (or doesn't match a `where`
   * clause scoping it to the caller).
   *
   * @param error - The caught value to check.
   * @returns Whether `error` is a record-not-found error.
   */
  isRecordNotFoundError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    )
  }
}
