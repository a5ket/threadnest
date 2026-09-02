import { BaseJob } from 'src/queue/base.job'

/**
 * Base class for transactional auth emails (verification, password reset, email change) — all
 * run on the `email` queue.
 */
export abstract class AuthEmailJob<P extends { to: string; token: string } = { to: string; token: string }> extends BaseJob<P> {
  readonly queueName = 'email'
}
