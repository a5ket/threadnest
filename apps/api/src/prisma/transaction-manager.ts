import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { Prisma } from 'generated/prisma/client'

/**
 * Thin wrapper around Prisma's interactive transactions — exists mainly so services depend on an
 * injectable class rather than calling `prisma.$transaction` directly, keeping transaction
 * boundaries testable/mockable like any other collaborator.
 */
@Injectable()
export class TransactionManager {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  /**
   * @param callback - Receives the transaction client; every repository call inside it should be
   * passed this `tx` (as their optional `db` parameter) to participate in the same transaction.
   * @returns The callback's return value, once the transaction commits.
   */
  run<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback)
  }
}