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

/** @param ms - Milliseconds to wait. */
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * @param error - The caught value; not necessarily an `Error` instance.
 * @returns A loggable message string either way.
 */
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * @param fields - A Redis Streams entry's flat `[key, value, key, value, ...]` field array.
 * @returns The parsed JSON payload stored under the `payload` field.
 * @throws {Error} No `payload` field is present — an entry this consumer never wrote itself.
 */
function parsePayload(fields: string[]): unknown {
  const index = fields.indexOf('payload')

  if (index === -1 || fields[index + 1] === undefined) {
    throw new Error('Malformed stream entry: missing payload field')
  }

  return JSON.parse(fields[index + 1])
}

/**
 * Consume side of the Redis Streams event bus — mirrors {@link QueueDispatcher}'s shape:
 * auto-discovers every {@link EventSubscriber} provider via Nest's `DiscoveryService` and runs one
 * `XREADGROUP` consumer-group polling loop per subscriber, each on its own dedicated Redis
 * connection (`BLOCK` ties up whatever connection issues it). A periodic `XAUTOCLAIM` sweep
 * reclaims entries a crashed/stalled consumer left pending, and drops "poison" messages that have
 * failed past {@link MAX_DELIVERY_ATTEMPTS} rather than retrying them forever.
 */
@Injectable()
export class EventStreamConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventStreamConsumer.name)
  private readonly subscriptions: Subscription[] = []
  private reclaimTimer?: NodeJS.Timeout

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly streams: RedisStreamService
  ) { }

  /** Discovers every registered {@link EventSubscriber} and starts a polling loop for each. */
  async onModuleInit() {
    const subscribers = this.discovery.getProviders()
      .map((wrapper) => wrapper.instance as unknown)
      .filter((instance): instance is EventSubscriber => instance instanceof EventSubscriber)

    for (const subscriber of subscribers) {
      await this.startSubscription(subscriber)
    }

    this.reclaimTimer = setInterval(() => void this.reclaimStalePending(), RECLAIM_INTERVAL_MS)
  }

  /** Stops every polling loop and closes its dedicated Redis connection, for a clean shutdown. */
  async onModuleDestroy() {
    if (this.reclaimTimer) clearInterval(this.reclaimTimer)

    await Promise.all(this.subscriptions.map(async (subscription) => {
      subscription.stopped = true
      await subscription.connection.quit()
    }))
  }

  /** @param subscriber - The subscriber to start polling for. */
  private async startSubscription(subscriber: EventSubscriber) {
    const stream = this.streams.streamKey(BaseEvent.typeOf(subscriber.eventClass))
    const group = subscriber.groupName

    await this.ensureGroup(stream, group)

    const subscription: Subscription = { stream, group, subscriber, connection: this.streams.createConnection(), stopped: false }
    this.subscriptions.push(subscription)

    void this.runLoop(subscription)
  }

  /**
   * Creates the consumer group starting from the beginning of the stream, creating the stream
   * itself too if it doesn't exist yet (`MKSTREAM`). Idempotent — a `BUSYGROUP` error (the group
   * already exists, e.g. from a previous process run) is swallowed rather than thrown.
   *
   * @param stream - The stream key.
   * @param group - The consumer group name.
   */
  private async ensureGroup(stream: string, group: string) {
    try {
      await this.streams.commands.xgroup('CREATE', stream, group, '0', 'MKSTREAM')
    } catch (error) {
      if (!errorMessage(error).includes('BUSYGROUP')) {
        throw error
      }
    }
  }

  /**
   * The core polling loop: blocks on `XREADGROUP` for new entries, processes each one, and
   * repeats until {@link Subscription.stopped} is set. A read error logs and backs off for
   * {@link BLOCK_MS} before retrying, rather than crashing the loop.
   *
   * @param subscription - The subscription to poll.
   */
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

  /**
   * Reconstructs the typed event from the raw entry and hands it to the subscriber's `handle`.
   * Only acknowledges (`XACK`) on success — a failed handler leaves the entry pending, so it's
   * picked up again by {@link reclaimForSubscription} rather than silently lost. A handler failure
   * is logged, not rethrown, so one bad entry doesn't kill the polling loop.
   *
   * @param subscription - The subscription the entry belongs to.
   * @param id - The stream entry's id, used to acknowledge it.
   * @param fields - The raw entry fields.
   */
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

  /** Runs {@link reclaimForSubscription} across every active subscription, on {@link RECLAIM_INTERVAL_MS}. */
  private async reclaimStalePending() {
    await Promise.all(this.subscriptions.map((subscription) => this.reclaimForSubscription(subscription)))
  }

  /**
   * Claims entries that have sat pending (unacknowledged) for longer than {@link RECLAIM_IDLE_MS}
   * — typically because the consumer that originally read them crashed before acking. An entry
   * that has already failed more than {@link MAX_DELIVERY_ATTEMPTS} times is acknowledged and
   * dropped instead of retried again, so one permanently-failing event can't block the stream forever.
   *
   * @param subscription - The subscription to reclaim stale entries for.
   */
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

  /**
   * @param stream - The stream key.
   * @param group - The consumer group name.
   * @param id - The entry to check.
   * @returns How many times this entry has been delivered (via `XPENDING`'s delivery-count field),
   * or `1` if it has no pending-entry record (shouldn't happen for an entry reached via `XAUTOCLAIM`).
   */
  private async deliveryCount(stream: string, group: string, id: string) {
    const pending = await this.streams.commands.xpending(stream, group, id, id, 1) as [string, string, number, number][]
    return pending[0]?.[3] ?? 1
  }
}
