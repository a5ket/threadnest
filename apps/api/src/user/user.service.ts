import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { ImageProcessor } from 'src/storage/image-processor'
import { StorageService } from 'src/storage/storage.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UserQueryDto } from './dto/user.query.dto'
import { UsernameTakenException } from './exceptions/username-taken.exception'
import { UserNotFoundException } from './exceptions/user-not-found.exception'
import { UserProfileRepository } from './user-profile.repository'
import { UserRepository } from './user.repository'

const AVATAR_SIZE = 512

@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly profileRepo: UserProfileRepository,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly imageProcessor: ImageProcessor
  ) { }

  private toProfileView<T extends { avatarKey: string | null }>(profile: T) {
    const { avatarKey, ...rest } = profile
    return { ...rest, avatarUrl: avatarKey ? this.storage.getPublicUrl(avatarKey) : null }
  }
  async assertUserExists(userId: string) {
    if (!(await this.existsById(userId))) {
      throw new UserNotFoundException()
    }
  }

  async existsById(userId: string) {
    return this.repo.exists(userId)
  }

  async findByIdWithEmail(userId: string) {
    return this.repo.findByIdWithEmail(userId)
  }

  async existsByEmail(email: string) {
    return this.repo.existsByEmail(email)
  }

  async findByEmailWithCredentials(email: string) {
    return this.repo.findByEmailWithCredentials(email)
  }

  async getByIdWithCredentials(userId: string) {
    return this.repo.getByIdWithCredentials(userId)
  }

  async getByEmail(email: string) {
    return this.repo.getByEmail(email)
  }

  async updatePassword(userId: string, passwordHash: string, db?: Database) {
    return this.repo.updatePassword(userId, passwordHash, db)
  }

  async markEmailVerified(userId: string, db?: Database) {
    return this.repo.markEmailVerified(userId, db)
  }

  async updateEmail(userId: string, email: string, db?: Database) {
    return this.repo.updateEmail(userId, email, db)
  }

  async getProfile(userId: string) {
    return this.toProfileView(await this.profileRepo.getByUserId(userId))
  }

  async getProfileByUsername(username: string) {
    return this.toProfileView(await this.profileRepo.getByUsername(username))
  }

  async search(query: UserQueryDto) {
    const page = await this.profileRepo.search(query)
    return { items: page.items.map((item) => this.toProfileView(item)), meta: page.meta }
  }

  async getProfileWithUser(userId: string) {
    return this.profileRepo.getWithUser(userId)
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const taken = await this.profileRepo.isUsernameTaken(dto.username, userId)

      if (taken) {
        throw new UsernameTakenException()
      }
    }

    return this.toProfileView(await this.profileRepo.update(userId, dto))
  }

  async updateAvatar(userId: string, rawBuffer: Buffer) {
    const existing = await this.profileRepo.getByUserId(userId)
    const processed = await this.imageProcessor.toSquareWebp(rawBuffer, AVATAR_SIZE)
    const key = `avatars/${userId}/${randomBytes(8).toString('hex')}.webp`

    await this.storage.upload(key, processed, 'image/webp')
    const updated = await this.profileRepo.updateAvatarKey(userId, key)

    if (existing.avatarKey) {
      await this.storage.delete(existing.avatarKey)
    }

    return this.toProfileView(updated)
  }

  async removeAvatar(userId: string) {
    const existing = await this.profileRepo.getByUserId(userId)
    const updated = await this.profileRepo.updateAvatarKey(userId, null)

    if (existing.avatarKey) {
      await this.storage.delete(existing.avatarKey)
    }

    return this.toProfileView(updated)
  }

  async create(email: string, passwordHash: string) {
    const username = await this.generateUniqueUsername()

    return this.prisma.$transaction(async (tx) => {
      const user = await this.repo.create(email, passwordHash, tx)
      const profile = await this.profileRepo.create(user.id, username, tx)

      return { ...user, profile }
    })
  }

  private async generateUniqueUsername() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const username = `u_${randomBytes(5).toString('hex')}`

      if (!(await this.profileRepo.isUsernameTaken(username))) {
        return username
      }
    }

    throw new InternalServerErrorException('Failed to generate unique username')
  }
}
