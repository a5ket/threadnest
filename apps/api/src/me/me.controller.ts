import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { MeService } from './me.service'
import { MeBootstrapDataDto } from './dto/me.bootstrap-response.dto'

@ApiTags('Me')
@Controller('me')
@UseInterceptors(ResponseInterceptor)
@Authenticated()
export class MeController {
    constructor(
        private readonly me: MeService
    ) { }

    @Get()
    @ApiOperation({
        operationId: 'meBootstrap',
        summary: 'Get bootstrap data for the current user',
        description: 'Returns the authenticated user profile and the list of nests they are a member of.'
    })
    @ApiDataResponse({ status: 200, description: 'Bootstrap data', type: MeBootstrapDataDto })
    @ApiExceptionResponses(UserNotFoundException)
    async getBootstrapData(
        @CurrentUser() user: AuthUser
    ): Promise<MeBootstrapDataDto> {
        return this.me.getBootstrapData(user.id)
    }
}
