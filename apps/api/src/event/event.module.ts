import { Module } from '@nestjs/common'
import { EventBus } from './event-bus'
import { LocalEventBus } from './local-event-bus'

@Module({
  providers: [
    {
      provide: EventBus,
      useClass: LocalEventBus
    },
  ],
  exports: [EventBus]
})
export class EventModule { }
