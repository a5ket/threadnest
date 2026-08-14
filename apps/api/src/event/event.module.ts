import { Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { EventBus } from './event-bus'
import { EventStreamConsumer } from './event-stream.consumer'
import { RedisEventBus } from './redis-event-bus'
import { RedisStreamService } from './redis-stream.service'

@Module({
  imports: [DiscoveryModule],
  providers: [
    RedisStreamService,
    EventStreamConsumer,
    {
      provide: EventBus,
      useClass: RedisEventBus
    }
  ],
  exports: [EventBus]
})
export class EventModule { }
