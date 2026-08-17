import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { OwnershipTransferredEvent } from 'src/nest/events/ownership-transferred.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class OwnershipTransferredActionLogSubscriber extends NestActionLogEventSubscriber<OwnershipTransferredEvent> {
  readonly eventClass = OwnershipTransferredEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: OwnershipTransferredEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.previousOwnerId, props.newOwnerId, NestActionType.OWNERSHIP_TRANSFERRED, {})
  }
}
