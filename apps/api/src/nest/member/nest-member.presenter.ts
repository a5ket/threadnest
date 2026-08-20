import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { UserPresenter } from 'src/user/user.presenter'
import { UserSummary } from 'src/user/types/user.summary'

interface NestMemberView {
  user: UserSummary
  role: NestMemberRole
  createdAt: Date
}

@Injectable()
export class NestMemberPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toView(member: NestMemberView) {
    return {
      user: this.userPresenter.toReferenceView(member.user),
      role: member.role,
      createdAt: member.createdAt,
    }
  }
}
