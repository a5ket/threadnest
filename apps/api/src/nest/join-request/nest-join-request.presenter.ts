import { Injectable } from '@nestjs/common'
import { NestJoinRequestSummary } from './types/nest-join-request.summary'

type NestJoinRequestUserView = Pick<NestJoinRequestSummary, 'id' | 'nest' | 'resolvedBy' | 'message' | 'status' | 'createdAt' | 'resolvedAt'>

@Injectable()
export class NestJoinRequestPresenter {
  toUserView(request: NestJoinRequestUserView) {
    return {
      id: request.id,
      nest: request.nest,
      resolvedBy: request.resolvedBy,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
    }
  }

  toNestView(request: NestJoinRequestSummary) {
    return {
      id: request.id,
      user: request.user,
      resolvedBy: request.resolvedBy,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
    }
  }
}
