import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { Prisma } from 'generated/prisma/client'

@Injectable()
export class TransactionManager {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  run<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback)
  }
}