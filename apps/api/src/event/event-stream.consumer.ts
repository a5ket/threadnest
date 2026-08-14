import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { DiscoveryService } from '@nestjs/core'
import type Redis from 'ioredis'
import { BaseEvent } from './base.event'
import { EventSubscriber } from './event-subscriber'
import { RedisStreamService } from './redis-stream.service'

const BLOCK_MS = 5_000
const BATCH_SIZE = 10
const CONSUMER_NAME = `worker-${process.pid}`
const RECLAIM_INTERVAL_MS = 30_000
const RECLAIM_IDLE_MS = 60_000
const MAX_DELIVERY_ATTEMPTS = 5

interface Subscription {
  stream: string
  group: string
  subscriber: EventSubscriber
  connection: Redis
  stopped: boolean
}

type StreamEntry = [id: string, fields: string[]]
type ReadGroupResponse = [stream: string, entries: StreamEntry[]][] | null

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function parsePayload(fields: string[]): unknown {
  const index = fields.indexOf('payload')

  if (index === -1 || fields[index + 1] === undefined) {
    throw new Error('Malformed stream entry: missing payload field')
  }

  return JSON.parse(fields[index + 1])
}

// Mirrors QueueDispatcher: auto-discovers EventSubscriber providers and runs one consumer-group loop per subscriber.
@Injectable()
export class EventStreamConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventStreamConsumer.name)
  private readonly subscriptions: Subscription[] = []
  private reclaimTimer?: NodeJS.Timeout

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly streams: RedisStreamService
  ) { }

  async onModuleInit() {
    const subscribers = this.discovery.getProviders()
      .map((wrapper) => wrapper.instance as unknown)
      .filter((instance): instance is EventSubscriber => instance instanceof EventSubscriber)

    for (const subscriber of subscribers) {
      await this.startSubscription(subscriber)
    }

    this.reclaimTimer = setInterval(() => void this.reclaimStalePending(), RECLAIM_INTERVAL_MS)
  }

  async onModuleDestroy() {
    if (this.reclaimTimer) clearInterval(this.reclaimTimer)

    await Promise.all(this.subscriptions.map(async (subscription) => {
      subscription.stopped = true
      await subscription.connection.quit()
    }))
  }

  private async startSubscription(subscriber: EventSubscriber) {
    const stream = this.streams.streamKey(BaseEvent.typeOf(subscriber.eventClass))
    const group = subscriber.groupName

    await this.ensureGroup(stream, group)

    const subscription: Subscription = { stream, group, subscriber, connection: this.streams.createConnection(), stopped: false }
    this.subscriptions.push(subscription)

    void this.runLoop(subscription)
  }

  private async ensureGroup(stream: string, group: string) {
    try {
      await this.streams.commands.xgroup('CREATE', stream, group, '0', 'MKSTREAM')
    } catch (error) {
      if (!errorMessage(error).includes('BUSYGROUP')) {
        throw error
      }
    }
  }

  private async runLoop(subscription: Subscription) {
    const { stream, group, connection } = subscription

    while (!subscription.stopped) {
      let response: ReadGroupResponse

      try {
        response = await connection.xreadgroup(
          'GROUP', group, CONSUMER_NAME,
          'COUNT', BATCH_SIZE,
          'BLOCK', BLOCK_MS,
          'STREAMS', stream, '>'
        ) as ReadGroupResponse
      } catch (error) {
        if (subscription.stopped) return

        this.logger.error(`Read failed for ${stream}/${group}: ${errorMessage(error)}`)
        await sleep(BLOCK_MS)
        continue
      }

      if (!response) continue

      for (const [, entries] of response) {
        for (const [id, fields] of entries) {
          await this.processEntry(subscription, id, fields)
        }
      }
    }
  }

  private async processEntry(subscription: Subscription, id: string, fields: string[]) {
    const { stream, group, subscriber } = subscription

    try {
      const event = new subscriber.eventClass(parsePayload(fields))
      await subscriber.handle(event)
      await this.streams.commands.xack(stream, group, id)
    } catch (error) {
      this.logger.error(`Handler failed for ${stream}/${group} (id=${id}): ${errorMessage(error)}`)
    }
  }

  private async reclaimStalePending() {
    await Promise.all(this.subscriptions.map((subscription) => this.reclaimForSubscription(subscription)))
  }

  private async reclaimForSubscription(subscription: Subscription) {
    const { stream, group } = subscription

    try {
      const [, entries] = await this.streams.commands.xautoclaim(
        stream, group, CONSUMER_NAME, RECLAIM_IDLE_MS, '0', 'COUNT', BATCH_SIZE
      ) as [string, StreamEntry[], string[]]

      for (const [id, fields] of entries) {
        const deliveryCount = await this.deliveryCount(stream, group, id)

        if (deliveryCount > MAX_DELIVERY_ATTEMPTS) {
          this.logger.error(`Dropping poison message ${stream}/${group} (id=${id}) after ${deliveryCount} attempts`)
          await this.streams.commands.xack(stream, group, id)
          continue
        }

        await this.processEntry(subscription, id, fields)
      }
    } catch (error) {
      this.logger.error(`Reclaim failed for ${stream}/${group}: ${errorMessage(error)}`)
    }
  }

  private async deliveryCount(stream: string, group: string, id: string) {
    const pending = await this.streams.commands.xpending(stream, group, id, id, 1) as [string, string, number, number][]
    return pending[0]?.[3] ?? 1
  }
}
