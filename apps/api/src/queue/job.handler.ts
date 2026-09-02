import { BaseJob } from './base.job'

/**
 * Base class for background job handlers, auto-discovered at startup and routed to by job type.
 * A handler can cover multiple related job classes (`jobClasses`) — e.g. one handler for every
 * `AuthEmailJob` subtype — routed to the same `handle` implementation.
 */
export abstract class JobHandler<T extends BaseJob = BaseJob> {
  abstract readonly jobClasses: ReadonlyArray<new (...args: any[]) => T>

  /** The registered type strings this handler covers — see {@link BaseJob.typeOf}. */
  get jobTypes() {
    return this.jobClasses.map((jobClass) => BaseJob.typeOf(jobClass))
  }

  abstract handle(job: T): Promise<void>
}