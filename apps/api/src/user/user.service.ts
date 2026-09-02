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
import { UserPreferenceService } from './preferences/user-preference.service'
import { UserProfileRepository } from './user-profile.repository'
import { UserRepository } from './user.repository'
import { generateRandomUsername } from './username-generator'

const AVATAR_SIZE = 512

/**
 * Accounts and public profiles: credentials/email plumbing plus profile, avatar, and
 * username-generation logic.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly profileRepo: UserProfileRepository,
    private readonly preferences: UserPreferenceService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly imageProcessor: ImageProcessor
  ) { }

  /**
   * Replaces the stored `avatarKey` with a resolved `avatarUrl` and stamps on the
   * caller-supplied activity visibility.
   *
   * @param profile - Any profile-shaped object with an `avatarKey`.
   * @param activityVisible - Whether the viewer may see this profile's activity.
   */
  private toProfileView<T extends { avatarKey: string | null }>(profile: T, activityVisible = true) {
    const { avatarKey, ...rest } = profile
    return { ...rest, avatarUrl: avatarKey ? this.storage.getPublicUrl(avatarKey) : null, activityVisible }
  }

  /**
   * @param userId - The account to check.
   * @throws {UserNotFoundException} No user with this id.
   */
  async assertUserExists(userId: string) {
    if (!(await this.existsById(userId))) {
      throw new UserNotFoundException()
    }
  }

  /** @param userId - The account to check. */
  async existsById(userId: string) {
    return this.repo.exists(userId)
  }

  /** @param userId - The account to look up. */
  async findByIdWithEmail(userId: string) {
    return this.repo.findByIdWithEmail(userId)
  }

  /** @param email - The address to check. */
  async existsByEmail(email: string) {
    return this.repo.existsByEmail(email)
  }

  /** @param email - The address to look up. */
  async findByEmailWithCredentials(email: string) {
    return this.repo.findByEmailWithCredentials(email)
  }

  /** @param userId - The account to look up. */
  async getByIdWithCredentials(userId: string) {
    return this.repo.getByIdWithCredentials(userId)
  }

  /** @param email - The address to look up. */
  async getByEmail(email: string) {
    return this.repo.getByEmail(email)
  }

  /**
   * @param userId - The account to update.
   * @param passwordHash - Already hashed by the caller.
   * @param db - Optional transaction client.
   */
  async updatePassword(userId: string, passwordHash: string, db?: Database) {
    return this.repo.updatePassword(userId, passwordHash, db)
  }

  /**
   * @param userId - The account to mark verified.
   * @param db - Optional transaction client.
   */
  async markEmailVerified(userId: string, db?: Database) {
    return this.repo.markEmailVerified(userId, db)
  }

  /**
   * @param userId - The account to update.
   * @param email - The new, now-confirmed address.
   * @param db - Optional transaction client.
   */
  async updateEmail(userId: string, email: string, db?: Database) {
    return this.repo.updateEmail(userId, email, db)
  }

  /**
   * The caller's own profile — always includes activity, since there's no privacy concern
   * viewing your own.
   *
   * @param userId - The profile owner (and viewer).
   */
  async getProfile(userId: string) {
    return this.toProfileView(await this.profileRepo.getByUserId(userId))
  }

  /**
   * A profile by username. Activity is visible to the owner unconditionally, and to everyone
   * else only if the owner's preference allows it.
   *
   * @param username - The profile to look up.
   * @param viewerId - The viewer, if signed in; affects whether activity is shown.
   */
  async getProfileByUsername(username: string, viewerId?: string) {
    const profile = await this.profileRepo.getByUsername(username)
    const activityVisible = viewerId === profile.userId || (await this.preferences.get(profile.userId)).showActivityOnProfile

    return this.toProfileView(profile, activityVisible)
  }

  /** @param query - Search term plus pagination. */
  async search(query: UserQueryDto) {
    const page = await this.profileRepo.search(query)
    return { items: page.items.map((item) => this.toProfileView(item)), meta: page.meta }
  }

  /** @param userId - The account to look up. */
  async getProfileWithUser(userId: string) {
    return this.profileRepo.getWithUser(userId)
  }

  /**
   * @param userId - The profile owner.
   * @param dto - Fields to change; omitted fields are left as-is.
   * @throws {UsernameTakenException} `dto.username` is taken by someone else.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const taken = await this.profileRepo.isUsernameTaken(dto.username, userId)

      if (taken) {
        throw new UsernameTakenException()
      }
    }

    return this.toProfileView(await this.profileRepo.update(userId, dto))
  }

  /**
   * Processes and uploads the new avatar first, then deletes the old one — so a failed upload
   * never leaves the profile without any avatar at all.
   *
   * @param userId - The profile owner.
   * @param rawBuffer - The uploaded image, as-is (any format sharp can decode).
   */
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

  /**
   * Clears the avatar and deletes the underlying stored file, if one was set.
   *
   * @param userId - The profile owner.
   */
  async removeAvatar(userId: string) {
    const existing = await this.profileRepo.getByUserId(userId)
    const updated = await this.profileRepo.updateAvatarKey(userId, null)

    if (existing.avatarKey) {
      await this.storage.delete(existing.avatarKey)
    }

    return this.toProfileView(updated)
  }

  /**
   * Creates the user and its profile (with a freshly generated username) in one transaction.
   * Assumes the caller has already checked the email isn't taken.
   *
   * @param email - The new account's address.
   * @param passwordHash - Already hashed by the caller.
   * @returns The new user, with its profile attached.
   */
  async create(email: string, passwordHash: string) {
    const username = await this.generateUniqueUsername()

    return this.prisma.$transaction(async (tx) => {
      const user = await this.repo.create(email, passwordHash, tx)
      const profile = await this.profileRepo.create(user.id, username, tx)

      return { ...user, profile }
    })
  }

  /**
   * Retries random username generation up to 5 times to dodge a collision.
   *
   * @throws {InternalServerErrorException} Exhausted all attempts — should be astronomically
   *   rare given the generator's word-pair space.
   */
  private async generateUniqueUsername() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const username = generateRandomUsername()

      if (!(await this.profileRepo.isUsernameTaken(username))) {
        return username
      }
    }

    throw new InternalServerErrorException('Failed to generate unique username')
  }
}
