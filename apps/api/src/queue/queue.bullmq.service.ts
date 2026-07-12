import { getQueueToken } from '@nestjs/bullmq'
import { DiscoveryService, ModuleRef } from '@nestjs/core'
import { Queue } from 'bullmq'
import { BaseJob } from './base.job'
import { QueueDispatcher } from './queue.dispatcher'
import { QueueService } from './queue.service'
import { QueueDefinition } from './types/queue-definition'
import { EnqueueOptions } from './types/enqueue-options'
import { UnregisteredJobException } from './exceptions/unregistered-job.exception'

export class QueueBullmqService extends QueueService {
  private queues = new Map<string, Queue>

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly moduleRef: ModuleRef,
    private readonly dispatcher: QueueDispatcher
  ) {
    super()
  }

  onModuleInit() {
    const defs = this.discovery
      .getProviders()
      .filter((w) => w.token?.toString().startsWith('QUEUE_DEF_'))
      .map((w) => w.instance as QueueDefinition)

    for (const def of defs) {
      this.queues.set(def.name, this.moduleRef.get(getQueueToken(def.name), { strict: false }))
    }
  }

  async enqueue(job: BaseJob, options?: EnqueueOptions) {
    if (!this.dispatcher.hasHandler(job.type)) {
      throw new UnregisteredJobException(job.type)
    }

    const queue = this.queues.get(job.queueName)

    if (!queue) {
      throw new Error(`Unknown queue: ${job.queueName}`)
    }

    await queue.add(job.type, job.props, {
      attempts: options?.attempts ?? 3,
      backoff: options?.backoffMs ? { type: 'exponential', delay: options.backoffMs } : undefined,
      delay: options?.delayMs
    })
  }
}