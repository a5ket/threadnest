import { Body, Controller, HttpCode, HttpStatus, Patch, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from 'src/auth/auth.service'
import { EmailTakenException } from 'src/auth/exceptions/email-taken.exception'
import { InvalidCredentialsException } from 'src/auth/exceptions/invalid-credentials.exception'
import { SamePasswordException } from 'src/auth/exceptions/same-password.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { Verified } from 'src/security/decorators/verified.decorator'
import { ChangeEmailDto } from './dto/me-auth.change-email.dto'
import { ChangePasswordDto } from './dto/me-auth.change-password.dto'

@ApiTags('Me')
@Controller('me/auth')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeAuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Patch('password')
    @Verified()
    @RateLimit({ limit: 5, ttlMs: 60_000 })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ operationId: 'meAuthChangePassword', summary: 'Change the current user\'s password' })
    @ApiResponse({ status: 204, description: 'Password changed' })
    @ApiExceptionResponses(ValidationException, InvalidCredentialsException, SamePasswordException)
    async changePassword(
        @CurrentUser() user: AuthUser,
        @Body() dto: ChangePasswordDto
    ) {
        await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword)
    }

    @Patch('email')
    @Verified()
    @RateLimit({ limit: 5, ttlMs: 60_000 })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        operationId: 'meAuthChangeEmail',
        summary: 'Request an email change for the current user',
        description: 'Sends a confirmation link to the new email address. The address isn\'t updated until the link is confirmed.'
    })
    @ApiResponse({ status: 204, description: 'Confirmation email sent to the new address' })
    @ApiExceptionResponses(ValidationException, EmailTakenException)
    async changeEmail(
        @CurrentUser() user: AuthUser,
        @Body() dto: ChangeEmailDto
    ) {
        await this.authService.requestEmailChange(user.id, dto.email)
    }
}