import { AuthEmailJob } from './auth-email.job'

type Props = { to: string; token: string; newEmail: string }

export class SendEmailChangeEmailJob extends AuthEmailJob<Props> {
  constructor(readonly props: Props) {
    super()
  }
}
