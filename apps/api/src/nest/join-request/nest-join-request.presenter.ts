import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { NestJoinRequestSummary } from './types/nest-join-request.summary'

type NestJoinRequestUserView = Pick<NestJoinRequestSummary, 'id' | 'nest' | 'resolvedBy' | 'message' | 'status' | 'createdAt' | 'resolvedAt'>

@Injectable()
export class NestJoinRequestPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * For the requester's own request list.
   *
   * @param request - The join request to present.
   */
  toUserView(request: NestJoinRequestUserView) {
    return {
      id: request.id,
      nest: request.nest,
      resolvedBy: request.resolvedBy ? this.userPresenter.toReferenceView(request.resolvedBy) : null,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
    }
  }

  /**
   * For the nest's incoming-requests list — includes the requesting user.
   *
   * @param request - The join request to present.
   */
  toNestView(request: NestJoinRequestSummary) {
    return {
      id: request.id,
      user: this.userPresenter.toReferenceView(request.user),
      resolvedBy: request.resolvedBy ? this.userPresenter.toReferenceView(request.resolvedBy) : null,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
    }
  }
}
