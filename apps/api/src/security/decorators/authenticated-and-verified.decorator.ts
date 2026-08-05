import { applyDecorators } from '@nestjs/common'
import { Authenticated } from './authenticated.decorator'
import { Verified } from './verified.decorator'

export const AuthenticatedAndVerified = () => applyDecorators(
  Authenticated(),
  Verified()
)
