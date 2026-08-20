import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { NestJoinRequestSummary } from './types/nest-join-request.summary'

type NestJoinRequestUserView = Pick<NestJoinRequestSummary, 'id' | 'nest' | 'resolvedBy' | 'message' | 'status' | 'createdAt' | 'resolvedAt'>

@Injectable()
export class NestJoinRequestPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

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
