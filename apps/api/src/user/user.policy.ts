import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { UserPolicySubject } from './types/user.policy-subject'

@Injectable()
export class UserPolicy {
  assertCanReadUserProfile(subject: UserPolicySubject, actorId?: string): Promise<void> {
    if (subject.isPublic || actorId === subject.userId) {
      return Promise.resolve()
    }

    throw new InsufficientPermissionsException()
  }
}