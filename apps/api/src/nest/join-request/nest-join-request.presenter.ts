import { Injectable } from '@nestjs/common'
import { NestJoinRequestSummary } from './types/nest-join-request.summary'

@Injectable()
export class NestJoinRequestPresenter {
  toUserView(request: NestJoinRequestSummary) {
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