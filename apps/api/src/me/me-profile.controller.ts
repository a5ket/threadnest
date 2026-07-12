import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { UpdateProfileDto } from 'src/user/dto/update-profile.dto'
import { UserService } from 'src/user/user.service'

@Controller('me/profile')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeProfileController {
  constructor(private readonly users: UserService) { }

  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto
  ) {
    return this.users.updateProfile(user.id, dto)
  }
}
