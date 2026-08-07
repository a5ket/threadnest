import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { UpdateProfileDto } from 'src/user/dto/update-profile.dto'
import { UserProfileResponseDto } from 'src/user/dto/user-profile-response.dto'
import { UsernameTakenException } from 'src/user/exceptions/username-taken.exception'
import { UserService } from 'src/user/user.service'

@ApiTags('Me')
@Controller('me/profile')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeProfileController {
  constructor(private readonly users: UserService) { }

  @Get()
  @ApiOperation({ operationId: 'meProfileGet', summary: 'Get the current user\'s profile' })
  @ApiDataResponse({ status: 200, description: 'Profile', type: UserProfileResponseDto })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'meProfileUpdate', summary: 'Update the current user\'s profile' })
  @ApiDataResponse({ status: 200, description: 'Updated profile', type: UserProfileResponseDto })
  @ApiExceptionResponses(ValidationException, UsernameTakenException)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto
  ) {
    return this.users.updateProfile(user.id, dto)
  }
}
