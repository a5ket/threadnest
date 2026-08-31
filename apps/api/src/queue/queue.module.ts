import { BullModule, Processor, WorkerHost } from '@nestjs/bullmq'
import { DynamicModule, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DiscoveryModule } from '@nestjs/core'
import { Job } from 'bullmq'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { QueueBullmqService } from './queue.bullmq.service'
import { QueueConfig } from './queue.config'
import { QueueDispatcher } from './queue.dispatcher'
import { QueueService } from './queue.service'
import { queueDefinitionToken } from './queue.tokens'

function createQueueProcessor(name: string) {
  const context = `${name}QueueProcessor`

  @Processor(name)
  class GenericQueueProcessor extends WorkerHost {
    constructor(
      private readonly dispatcher: QueueDispatcher,
      @InjectPinoLogger(context) private readonly logger: PinoLogger
    ) {
      super()
    }

    async process(job: Job) {
      try {
        await this.dispatcher.dispatch(job.name, job.data)
      } catch (error) {
        this.logger.error({ err: error as Error, jobType: job.name, jobId: job.id }, 'Job failed')
        throw error
      }
    }
  }

  Object.defineProperty(GenericQueueProcessor, 'name', { value: context })

  return GenericQueueProcessor
}

const registeredQueues = new Set<string>()

@Module({
  imports: [
    DiscoveryModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<QueueConfig>) => {
        return {
          connection: {
            host: config.getOrThrow('redisHost', { infer: true }),
            port: config.getOrThrow('redisPort', { infer: true })
          }
        }
      }
    })
  ],
  providers: [
    {
      provide: QueueService,
      useClass: QueueBullmqService
    },
    QueueDispatcher
  ],
  exports: [QueueService, QueueDispatcher]
})
export class QueueModule {
  static forFeature(name: string): DynamicModule {
    if (registeredQueues.has(name)) {
      throw new Error(`Queue "${name}" is already registered`)
    }
    registeredQueues.add(name)

    return {
      module: QueueFeatureModule,
      imports: [QueueModule, BullModule.registerQueue({ name })],
      providers: [
        { provide: queueDefinitionToken(name), useValue: { name } },
        createQueueProcessor(name)
      ],
      exports: [QueueModule, BullModule, queueDefinitionToken(name)],
      global: true,
    }
  }
}

@Module({})
class QueueFeatureModule { }