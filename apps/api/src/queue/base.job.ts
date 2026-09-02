/**
 * Base class for every background job dispatched through the {@link QueueService}. Subclasses
 * declare `queueName` (which BullMQ queue this job runs on) and redeclare `props` as a
 * constructor parameter property with their own payload type — `type` is derived automatically.
 */
export abstract class BaseJob<P = unknown> {
  readonly type: string
  abstract readonly queueName: string
  readonly props: P

  /**
   * Derives a job's registered `type` string from its class name — PascalCase with a trailing
   * `Job` stripped.
   *
   * @param jobClass - The job class (not an instance) to derive a type string for.
   * @returns The job's registered type string.
   */
  static typeOf(jobClass: new (...args: any[]) => BaseJob) {
    return jobClass.name.replace(/Job$/, '')
  }

  constructor() {
    this.type = BaseJob.typeOf(this.constructor as new (...args: any[]) => BaseJob)
  }
}