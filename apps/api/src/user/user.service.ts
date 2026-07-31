import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UsernameTakenException } from './exceptions/username-taken.exception'
import { UserProfileRepository } from './user-profile.repository'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly profileRepo: UserProfileRepository,
    private readonly prisma: PrismaService
  ) { }
  async assertUserExists(userId: string) {
    await this.existsById(userId)
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
    return this.profileRepo.getByUserId(userId)
  }

  async getProfileByUsername(username: string) {
    return this.profileRepo.getByUsername(username)
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

    return this.profileRepo.update(userId, dto)
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
