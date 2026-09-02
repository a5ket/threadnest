import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { UserPolicySubject } from './types/user.policy-subject'

@Injectable()
export class UserPolicy {
  /**
   * A profile is visible to its owner unconditionally, and to anyone else only if the owner has
   * left it public.
   *
   * @param subject - The profile being viewed.
   * @param actorId - The viewer, if signed in.
   * @throws {InsufficientPermissionsException} Private profile viewed by someone other than its owner.
   */
  assertCanReadUserProfile(subject: UserPolicySubject, actorId?: string): Promise<void> {
    if (subject.isPublic || actorId === subject.userId) {
      return Promise.resolve()
    }

    throw new InsufficientPermissionsException()
  }
}