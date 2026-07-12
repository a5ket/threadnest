import { Module } from '@nestjs/common'
import { UserPresenter } from './user.presenter'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'
import { UserProfileRepository } from './user-profile.repository'
import { UserPolicy } from './user.policy'
import { UserController } from './user.controller'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [UserController],
  providers: [UserService, UserPresenter, UserRepository, UserProfileRepository, UserPolicy],
  exports: [UserService, UserPresenter, UserProfileRepository]
})
export class UserModule { }
