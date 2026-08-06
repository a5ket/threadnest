import { Injectable } from '@nestjs/common'
import { NestInviteSummary } from './types/nest-invite.summary'

type NestInviteUserView = Pick<NestInviteSummary, 'id' | 'nest' | 'invitedBy' | 'resolvedBy' | 'message' | 'status' | 'createdAt' | 'resolvedAt'>

@Injectable()
export class NestInvitePresenter {
  toUserView(invite: NestInviteUserView) {
    return {
      id: invite.id,
      nest: invite.nest,
      invitedBy: invite.invitedBy,
      resolvedBy: invite.resolvedBy,
      message: invite.message,
      status: invite.status,
      createdAt: invite.createdAt,
      resolvedAt: invite.resolvedAt,
    }
  }

  toNestView(invite: NestInviteSummary) {
    return {
      id: invite.id,
      user: invite.user,
      invitedBy: invite.invitedBy,
      resolvedBy: invite.resolvedBy,
      message: invite.message,
      status: invite.status,
      createdAt: invite.createdAt,
      resolvedAt: invite.resolvedAt,
    }
  }
}
