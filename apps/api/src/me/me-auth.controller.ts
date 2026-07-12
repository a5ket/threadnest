import { Body, Controller, HttpCode, HttpStatus, Patch, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthService } from 'src/auth/auth.service'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { VerifiedGuard } from 'src/security/guards/verified.guard'
import { ChangeEmailDto } from './dto/me-auth.change-email.dto'
import { ChangePasswordDto } from './dto/me-auth.change-password.dto'

@Controller('me/auth')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeAuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Patch('password')
    @UseGuards(VerifiedGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(
        @CurrentUser() user: AuthUser,
        @Body() dto: ChangePasswordDto
    ) {
        await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword)
    }

    @Patch('email')
    @UseGuards(VerifiedGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async changeEmail(
        @CurrentUser() user: AuthUser,
        @Body() dto: ChangeEmailDto
    ) {
        await this.authService.requestEmailChange(user.id, dto.email)
    }
}