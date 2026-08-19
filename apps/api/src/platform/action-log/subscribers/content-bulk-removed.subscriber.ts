import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformContentBulkRemovedEvent } from '../../events/platform-content-bulk-removed.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformContentBulkRemovedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformContentBulkRemovedEvent> {
  readonly eventClass = PlatformContentBulkRemovedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformContentBulkRemovedEvent) {
    const { props } = event

    await this.actionLogs.create(props.removedById, props.userId, null, PlatformActionType.CONTENT_BULK_REMOVED, {
      threadsRemoved: props.threadsRemoved,
      commentsRemoved: props.commentsRemoved
    })
  }
}
