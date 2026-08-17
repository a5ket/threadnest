import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { NestSettingsUpdatedEvent } from 'src/nest/settings/events/nest-settings-updated.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class SettingsUpdatedActionLogSubscriber extends NestActionLogEventSubscriber<NestSettingsUpdatedEvent> {
  readonly eventClass = NestSettingsUpdatedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: NestSettingsUpdatedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.userId, null, NestActionType.SETTINGS_UPDATED, {})
  }
}
