import { BaseJob } from './base.job'

export abstract class JobHandler<T extends BaseJob = BaseJob> {
  abstract readonly jobClasses: ReadonlyArray<new (...args: any[]) => T>

  get jobTypes() {
    return this.jobClasses.map((jobClass) => BaseJob.typeOf(jobClass))
  }

  abstract handle(job: T): Promise<void>
}