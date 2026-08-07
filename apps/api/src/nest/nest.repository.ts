import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_SUMMARY_SELECT } from './selects/nest.summary.select'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestSlugTakenException } from './exceptions/nest-slug-taken.exception'

@Injectable()
export class NestRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: NestCreateDto, db: Database = this.prisma) {
    try {
      return await db.nest.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          memberCount: 1,
        },
        select: NEST_SUMMARY_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error, 'slug')) {
        throw new NestSlugTakenException()
      }

      throw error
    }
  }

  async getBySlug(nestSlug: string) {
    const nest = await this.prisma.nest.findUnique({
      where: { slug: nestSlug },
      select: NEST_SUMMARY_SELECT
    })

    if (!nest) {
      throw new NestNotFoundException()
    }

    return nest
  }

  async updateMetadata(nestId: string, dto: NestUpdateDto, db: Database = this.prisma) {
    try {
      return await db.nest.update({
        where: {
          id: nestId
        },
        data: {
          name: dto.name,
          description: dto.description
        },
        select: NEST_SUMMARY_SELECT
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestNotFoundException()
      }
      throw error
    }
  }

  async adjustMemberCount(
    nestId: string,
    delta: number,
    db: Database = this.prisma,
  ) {
    await db.nest.update({
      where: { id: nestId },
      data: {
        memberCount: {
          increment: delta,
        },
      },
    })
  }

  async delete(nestId: string) {
    try {
      await this.prisma.nest.delete({
        where: { id: nestId }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestNotFoundException()
      }

      throw error
    }
  }

  async adjustThreadCount(
    nestId: string,
    delta: number,
    db: Database = this.prisma,
  ) {
    await db.nest.update({
      where: { id: nestId },
      data: {
        threadCount: {
          increment: delta,
        },
      },
    })
  }

  async slugExists(nestSlug: string) {
    const nest = await this.prisma.nest.findUnique({
      where: {
        slug: nestSlug
      },
      select: {
        id: true
      }
    })
    return Boolean(nest)
  }
}
