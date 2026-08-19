import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformThreadRemovedEvent } from '../../events/platform-thread-removed.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformThreadRemovedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformThreadRemovedEvent> {
  readonly eventClass = PlatformThreadRemovedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformThreadRemovedEvent) {
    const { props } = event

    await this.actionLogs.create(props.removedById, props.authorId, props.nestId, PlatformActionType.THREAD_REMOVED, {
      threadSlug: props.threadSlug,
      threadTitle: props.threadTitle,
      nestSlug: props.nestSlug,
      nestName: props.nestName
    })
  }
}
