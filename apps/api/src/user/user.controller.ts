import { Controller, Get, Param, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { UserProfileResponseDto } from './dto/user-profile-response.dto'
import { UserNotFoundException } from './exceptions/user-not-found.exception'
import { UserService } from './user.service'

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly user: UserService) { }

  @Get(':username')
  @ApiOperation({ operationId: 'userGetByUsername', summary: 'Get a user\'s profile by username' })
  @ApiDataResponse({ status: 200, description: 'User profile', type: UserProfileResponseDto })
  @ApiExceptionResponses(UserNotFoundException)
  getByUsername(@Param('username') username: string) {
    return this.user.getProfileByUsername(username)
  }
}
