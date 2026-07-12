import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/auth.login.dto'
import { RefreshDto } from './dto/auth.refresh.dto'
import { RegisterDto } from './dto/auth.register.dto'
import { ConfirmEmailVerificationDto } from './dto/auth.confirm-email-verification.dto'
import { RequestPasswordResetDto } from './dto/auth.request-password-reset.dto'
import { ConfirmPasswordResetDto } from './dto/auth.confirm-password-reset.dto'

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken)
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthUser) {
    await this.authService.logoutCurrentSession(user.id, user.sid)
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthUser) {
    await this.authService.logoutAllSessions(user.id)
  }

  @Post('email-verification/request')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestEmailVerification(@CurrentUser() user: AuthUser) {
    await this.authService.requestEmailVerification(user.id)
  }

  @Post('email-verification/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    await this.authService.confirmEmailVerification(dto.token)
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email)
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    await this.authService.confirmPasswordReset(dto.token, dto.password)
  }

  @Post('email-change/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmailChange(@Body() dto: ConfirmEmailVerificationDto) {
    await this.authService.confirmEmailChange(dto.token)
  }
}
