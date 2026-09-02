import { Injectable, OnModuleInit } from '@nestjs/common'
import { DiscoveryService } from '@nestjs/core'
import { BaseJob } from './base.job'
import { JobHandler } from './job.handler'
import { UnrecoverableError } from 'bullmq'

/**
 * Auto-discovers every {@link JobHandler} provider and routes dequeued BullMQ jobs to the
 * matching handler by job type — mirrors {@link EventStreamConsumer}'s discovery shape for the
 * event bus's subscribers.
 */
@Injectable()
export class QueueDispatcher implements OnModuleInit {
    private handlers = new Map<string, JobHandler>()

    constructor(private readonly discovery: DiscoveryService) { }

    /**
     * @throws {Error} Two registered handlers claim the same job type — a configuration mistake
     * caught at startup rather than silently dropping one handler.
     */
    onModuleInit() {
        for (const wrapper of this.discovery.getProviders()) {
            const instance: unknown = wrapper.instance

            if (instance instanceof JobHandler) {
                for (const jobType of instance.jobTypes) {
                    if (this.handlers.has(jobType)) {
                        throw new Error(`Duplicate handler registered for job type: ${jobType}`)
                    }

                    this.handlers.set(jobType, instance as JobHandler<BaseJob>)
                }
            }
        }
    }

    /**
     * Called by BullMQ's worker processor for each dequeued job.
     *
     * @param jobType - The job's registered type — see {@link BaseJob.typeOf}.
     * @param payload - The job's raw payload, cast to `BaseJob` and passed to the handler.
     * @throws {UnrecoverableError} No handler is registered for `jobType` — marked unrecoverable
     * so BullMQ doesn't retry a job that can never succeed.
     */
    async dispatch(jobType: string, payload: unknown) {
        const handler = this.handlers.get(jobType)

        if (!handler) {
            throw new UnrecoverableError(`No handler for job: ${jobType}`)
        }

        await handler.handle(payload as BaseJob)
    }

    /** @param jobType - The job type to check. */
    hasHandler(jobType: string) {
        return this.handlers.has(jobType)
    }
}


