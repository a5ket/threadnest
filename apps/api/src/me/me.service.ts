import { Injectable } from '@nestjs/common'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { NestMemberService } from 'src/nest/member/nest-member.service'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { UserService } from 'src/user/user.service'
import { MeBootstrapDataDto } from './dto/me.bootstrap-response.dto'

@Injectable()
export class MeService {
  constructor(
    private readonly user: UserService,
    private readonly nestMember: NestMemberService
  ) { }

  async getBootstrapData(userId: string): Promise<MeBootstrapDataDto> {
    try {
      const [userProfile, userNests] = await Promise.all([
        this.user.getProfileWithUser(userId),
        this.nestMember.listMembershipReferencesByUser(userId)
      ])

      const user = userProfile.user

      return {
        user: {
          id: user.id,
          email: user.email,
          username: userProfile.username,
          avatarUrl: userProfile.avatarUrl,
          emailVerified: Boolean(user.emailVerifiedAt)
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
