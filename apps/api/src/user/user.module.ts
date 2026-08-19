import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UserSuspensionPresenter } from './suspension/user-suspension.presenter'
import { UserSuspensionRepository } from './suspension/user-suspension.repository'
import { UserSuspensionService } from './suspension/user-suspension.service'
import { UserController } from './user.controller'
import { UserPolicy } from './user.policy'
import { UserPresenter } from './user.presenter'
import { UserProfileRepository } from './user-profile.repository'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserPresenter,
    UserRepository,
    UserProfileRepository,
    UserPolicy,
    UserSuspensionRepository,
    UserSuspensionPresenter,
    UserSuspensionService
  ],
  exports: [UserService, UserPresenter, UserProfileRepository, UserSuspensionPresenter, UserSuspensionService]
})
export class UserModule { }
