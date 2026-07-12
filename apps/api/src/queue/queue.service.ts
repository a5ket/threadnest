import { BaseJob } from './base.job'
import { EnqueueOptions } from './types/enqueue-options'


export abstract class QueueService {
  abstract enqueue(job: BaseJob, options?: EnqueueOptions): Promise<void>
}
