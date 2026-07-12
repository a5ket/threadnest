import { Request } from 'express'
import { AuthUser } from './auth.user'

export type AuthenticatedRequest = Request & {
  user?: AuthUser
}