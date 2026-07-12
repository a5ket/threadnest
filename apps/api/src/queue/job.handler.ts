import { BaseJob } from './base.job'

export abstract class JobHandler<T extends BaseJob = BaseJob> {
  abstract readonly jobClass: new (...args: any[]) => T

  get jobType() {
    return BaseJob.typeOf(this.jobClass)
  }

  abstract handle(job: T): Promise<void>
}