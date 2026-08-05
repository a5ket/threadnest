import { Body, Controller, HttpCode, HttpStatus, Patch, UseInterceptors } from '@nestjs/common'
import { AuthService } from 'src/auth/auth.service'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { Verified } from 'src/security/decorators/verified.decorator'
import { ChangeEmailDto } from './dto/me-auth.change-email.dto'
import { ChangePasswordDto } from './dto/me-auth.change-password.dto'

@Controller('me/auth')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeAuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Patch('password')
    @Verified()
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(
        @CurrentUser() user: AuthUser,
        @Body() dto: ChangePasswordDto
    ) {
        await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword)
    }

    @Patch('email')
    @Verified()
    @HttpCode(HttpStatus.NO_CONTENT)
    async changeEmail(
        @CurrentUser() user: AuthUser,
        @Body() dto: ChangeEmailDto
    ) {
        await this.authService.requestEmailChange(user.id, dto.email)
    }
}