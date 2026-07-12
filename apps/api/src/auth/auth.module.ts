import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { EmailModule } from 'src/email/email.module'
import { EventModule } from 'src/event/event.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UserModule } from 'src/user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RefreshTokenRepository } from './refresh-token.repository'
import { ConfirmationTokenRepository } from './confirmation-token.repository'

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule, SecurityModule, EventModule, UserModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository, ConfirmationTokenRepository],
  exports: [AuthService]
})
export class AuthModule { }
