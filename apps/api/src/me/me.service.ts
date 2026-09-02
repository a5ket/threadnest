import { Injectable } from '@nestjs/common'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { NestMemberService } from 'src/nest/member/nest-member.service'
import { PlatformAccess } from 'src/platform/platform.access'
import { StorageService } from 'src/storage/storage.service'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { UserService } from 'src/user/user.service'
import { MeBootstrapDataDto } from './dto/me.bootstrap-response.dto'

/** Assembles the signed-in user's app-bootstrap payload from several domains in one call. */
@Injectable()
export class MeService {
  constructor(
    private readonly user: UserService,
    private readonly nestMember: NestMemberService,
    private readonly platformAccess: PlatformAccess,
    private readonly storage: StorageService
  ) { }

  /**
   * @param userId - The signed-in user, from their access token.
   * @returns Account info, nest memberships, and platform access level, gathered in parallel.
   * @throws {InvalidAccessTokenException} `userId` doesn't resolve to a user — an otherwise-valid
   * token can outlive its account (e.g. after deletion), so this is treated as an invalid session
   * rather than surfacing a 404 for an account the client thinks it's signed into.
   */
  async getBootstrapData(userId: string): Promise<MeBootstrapDataDto> {
    try {
      const [userProfile, userNests, platformAccess] = await Promise.all([
        this.user.getProfileWithUser(userId),
        this.nestMember.listMembershipReferencesByUser(userId),
        this.platformAccess.getContext(userId)
      ])

      const user = userProfile.user

      return {
        user: {
          id: user.id,
          email: user.email,
          username: userProfile.username,
          avatarUrl: userProfile.avatarKey ? this.storage.getPublicUrl(userProfile.avatarKey) : null,
          emailVerified: Boolean(user.emailVerifiedAt),
          platformAccess
        },
        nests: userNests
      }
    }
    catch (error) {
      // A valid token can outlive its user (deleted account); treat as invalid session, not 404.
      if (error instanceof UserNotFoundException) {
        throw new InvalidAccessTokenException()
      }

      throw error
    }
  }
}
