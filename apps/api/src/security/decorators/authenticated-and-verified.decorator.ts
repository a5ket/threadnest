import { applyDecorators } from '@nestjs/common'
import { Authenticated } from './authenticated.decorator'
import { Verified } from './verified.decorator'

/** Requires a valid access token *and* a verified email — for routes only a fully onboarded user may call. */
export const AuthenticatedAndVerified = () => applyDecorators(
  Authenticated(),
  Verified()
)
