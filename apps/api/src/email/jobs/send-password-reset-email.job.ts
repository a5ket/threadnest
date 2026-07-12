import { AuthEmailJob } from './auth-email.job'

export class SendPasswordResetEmailJob extends AuthEmailJob {
  constructor(readonly props: { to: string; token: string }) {
    super()
  }
}
