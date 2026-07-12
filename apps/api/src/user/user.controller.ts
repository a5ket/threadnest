import { Controller, Get, Param, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { UserService } from './user.service'

@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly user: UserService) { }

  @Get(':username')
  getByUsername(@Param('username') username: string) {
    return this.user.getProfileByUsername(username)
  }
}
