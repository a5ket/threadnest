export abstract class BaseJob<P = unknown> {
  readonly type: string
  abstract readonly queueName: string
  readonly props: P

  static typeOf(jobClass: new (...args: any[]) => BaseJob) {
    return jobClass.name.replace(/Job$/, '')
  }

  constructor() {
    this.type = BaseJob.typeOf(this.constructor as new (...args: any[]) => BaseJob)
  }
}