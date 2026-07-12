import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthGuard } from './guards/auth.guard'
import { OptionalAuthGuard } from './guards/optional-auth.guard'
import { VerifiedGuard } from './guards/verified.guard'

@Module({
  imports: [JwtModule],
  providers: [AuthGuard, OptionalAuthGuard, VerifiedGuard],
  exports: [AuthGuard, OptionalAuthGuard, VerifiedGuard]
})
export class SecurityModule { }
