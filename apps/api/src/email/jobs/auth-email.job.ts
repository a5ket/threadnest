import { BaseJob } from 'src/queue/base.job'

export abstract class AuthEmailJob<P extends { to: string; token: string } = { to: string; token: string }> extends BaseJob<P> {
  readonly queueName = 'email'
}
