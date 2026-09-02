import { BaseJob } from './base.job'
import { EnqueueOptions } from './types/enqueue-options'


/**
 * Abstract enqueue side of the background job system — domain services depend on this rather than
 * a concrete implementation directly, so tests can substitute a mock without touching BullMQ/Redis.
 */
export abstract class QueueService {
  /**
   * @param job - The job to enqueue.
   * @param options - Retry/backoff/delay overrides.
   * @throws {UnregisteredJobException} No handler is registered for `job.type`.
   */
  abstract enqueue(job: BaseJob, options?: EnqueueOptions): Promise<void>
}
