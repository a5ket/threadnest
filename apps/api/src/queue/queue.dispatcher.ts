import { Injectable, OnModuleInit } from '@nestjs/common'
import { DiscoveryService } from '@nestjs/core'
import { BaseJob } from './base.job'
import { JobHandler } from './job.handler'
import { UnrecoverableError } from 'bullmq'

@Injectable()
export class QueueDispatcher implements OnModuleInit {
    private handlers = new Map<string, JobHandler>()

    constructor(private readonly discovery: DiscoveryService) { }

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

    async dispatch(jobType: string, payload: unknown) {
        const handler = this.handlers.get(jobType)

        if (!handler) {
            throw new UnrecoverableError(`No handler for job: ${jobType}`)
        }

        await handler.handle(payload as BaseJob)
    }

    hasHandler(jobType: string) {
        return this.handlers.has(jobType)
    }
}


