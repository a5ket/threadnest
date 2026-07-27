import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common'
import type { Request, Response } from 'express'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { AuthCookieService } from './auth-cookie.service'
import { AuthService } from './auth.service'
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception'
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
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService
  ) { }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(dto)
    this.authCookieService.setTokens(response, result.accessToken, result.refreshToken)

    return result
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto)
    this.authCookieService.setTokens(response, result.accessToken, result.refreshToken)

    return result
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = dto.refreshToken ?? this.authCookieService.getRefreshToken(request)

    if (!refreshToken) {
      throw new InvalidRefreshTokenException()
    }

    const result = await this.authService.refresh(refreshToken)
    this.authCookieService.setTokens(response, result.accessToken, result.refreshToken)

    return result
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    await this.authService.logoutCurrentSession(user.id, user.sid)
    this.authCookieService.clearTokens(response)
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    await this.authService.logoutAllSessions(user.id)
    this.authCookieService.clearTokens(response)
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
