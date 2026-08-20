import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { NestInviteSummary } from './types/nest-invite.summary'

type NestInviteUserView = Pick<NestInviteSummary, 'id' | 'nest' | 'invitedBy' | 'resolvedBy' | 'message' | 'status' | 'createdAt' | 'resolvedAt'>

@Injectable()
export class NestInvitePresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toUserView(invite: NestInviteUserView) {
    return {
      id: invite.id,
      nest: invite.nest,
      invitedBy: this.userPresenter.toReferenceView(invite.invitedBy),
      resolvedBy: invite.resolvedBy ? this.userPresenter.toReferenceView(invite.resolvedBy) : null,
      message: invite.message,
      status: invite.status,
      createdAt: invite.createdAt,
      resolvedAt: invite.resolvedAt,
    }
  }

  toNestView(invite: NestInviteSummary) {
    return {
      id: invite.id,
      user: this.userPresenter.toReferenceView(invite.user),
      invitedBy: this.userPresenter.toReferenceView(invite.invitedBy),
      resolvedBy: invite.resolvedBy ? this.userPresenter.toReferenceView(invite.resolvedBy) : null,
      message: invite.message,
      status: invite.status,
      createdAt: invite.createdAt,
      resolvedAt: invite.resolvedAt,
    }
  }
}
