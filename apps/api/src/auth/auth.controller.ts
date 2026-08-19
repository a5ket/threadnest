import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { AuthCookieService } from './auth-cookie.service'
import { AuthService } from './auth.service'
import { EmailTakenException } from './exceptions/email-taken.exception'
import { InvalidAccessTokenException } from './exceptions/invalid-access-token.exception'
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception'
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception'
import { MissingAccessTokenException } from './exceptions/missing-access-token.exception'
import { RefreshTokenExpiredException } from './exceptions/refresh-token-expired.exception'
import { SamePasswordException } from './exceptions/same-password.exception'
import { TokenAlreadyRedeemedException } from './exceptions/token-already-redeemed.exception'
import { TokenExpiredException } from './exceptions/token-expired.exception'
import { TokenNotFoundException } from './exceptions/token-not-found.exception'
import { TokenSupersededException } from './exceptions/token-superseded.exception'
import { AuthTokensDto } from './dto/auth.tokens.dto'
import { LoginDto } from './dto/auth.login.dto'
import { RefreshDto } from './dto/auth.refresh.dto'
import { RegisterDto } from './dto/auth.register.dto'
import { ConfirmEmailVerificationDto } from './dto/auth.confirm-email-verification.dto'
import { RequestPasswordResetDto } from './dto/auth.request-password-reset.dto'
import { ConfirmPasswordResetDto } from './dto/auth.confirm-password-reset.dto'

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService
  ) { }

  @Post('register')
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'authRegister', summary: 'Register a new account', description: 'Creates a user and starts a session. Tokens are also set as httpOnly cookies.' })
  @ApiDataResponse({ status: 201, description: 'Account created', type: AuthTokensDto })
  @ApiExceptionResponses(ValidationException)
  @ApiExceptionResponses(EmailTakenException)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(dto)
    this.authCookieService.setTokens(response, result.accessToken, result.refreshToken)

    return result
  }

  @Post('login')
  @RateLimit({ limit: 5, ttlMs: 60_000, blockDurationMs: 15 * 60_000 })
  @ApiOperation({ operationId: 'authLogin', summary: 'Log in with email and password', description: 'Starts a session. Tokens are also set as httpOnly cookies.' })
  @ApiDataResponse({ status: 201, description: 'Authenticated', type: AuthTokensDto })
  @ApiExceptionResponses(ValidationException)
  @ApiExceptionResponses(InvalidCredentialsException)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto)
    this.authCookieService.setTokens(response, result.accessToken, result.refreshToken)

    return result
  }

  @Post('refresh')
  @ApiOperation({
    operationId: 'authRefresh',
    summary: 'Rotate the refresh token and issue a new access token',
    description: 'Accepts the refresh token from the request body or the `refresh_token` cookie. Rotated tokens are also set as httpOnly cookies.'
  })
  @ApiDataResponse({ status: 201, description: 'New token pair issued', type: AuthTokensDto })
  @ApiExceptionResponses(InvalidRefreshTokenException, RefreshTokenExpiredException)
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
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'authLogout', summary: 'Log out the current session' })
  @ApiResponse({ status: 204, description: 'Session revoked, cookies cleared' })
  @ApiExceptionResponses(MissingAccessTokenException, InvalidAccessTokenException)
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    await this.authService.logoutCurrentSession(user.id, user.sid)
    this.authCookieService.clearTokens(response)
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'authLogoutAll', summary: 'Log out all sessions for the current user' })
  @ApiResponse({ status: 204, description: 'All sessions revoked, cookies cleared' })
  @ApiExceptionResponses(MissingAccessTokenException, InvalidAccessTokenException)
  async logoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    await this.authService.logoutAllSessions(user.id)
    this.authCookieService.clearTokens(response)
  }

  @Post('email-verification/request')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'authRequestEmailVerification', summary: 'Request an email verification link for the current user' })
  @ApiResponse({ status: 204, description: 'Verification email sent' })
  @ApiExceptionResponses(MissingAccessTokenException, InvalidAccessTokenException)
  async requestEmailVerification(@CurrentUser() user: AuthUser) {
    await this.authService.requestEmailVerification(user.id)
  }

  @Post('email-verification/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'authConfirmEmailVerification', summary: 'Confirm an email verification token' })
  @ApiResponse({ status: 204, description: 'Email verified' })
  @ApiExceptionResponses(ValidationException)
  @ApiExceptionResponses(TokenNotFoundException, TokenSupersededException, TokenAlreadyRedeemedException, TokenExpiredException)
  async confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    await this.authService.confirmEmailVerification(dto.token)
  }

  @Post('password-reset/request')
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'authRequestPasswordReset', summary: 'Request a password reset email', description: 'Always returns 204, whether or not the email is registered.' })
  @ApiResponse({ status: 204, description: 'Password reset email sent, if the account exists' })
  @ApiExceptionResponses(ValidationException)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email)
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'authConfirmPasswordReset', summary: 'Confirm a password reset token and set a new password' })
  @ApiResponse({ status: 204, description: 'Password updated' })
  @ApiExceptionResponses(ValidationException)
  @ApiExceptionResponses(SamePasswordException, TokenNotFoundException, TokenSupersededException, TokenAlreadyRedeemedException, TokenExpiredException)
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    await this.authService.confirmPasswordReset(dto.token, dto.password)
  }

  @Post('email-change/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'authConfirmEmailChange', summary: 'Confirm a pending email change token' })
  @ApiResponse({ status: 204, description: 'Email updated' })
  @ApiExceptionResponses(ValidationException)
  @ApiExceptionResponses(TokenNotFoundException, TokenSupersededException, TokenAlreadyRedeemedException, TokenExpiredException)
  async confirmEmailChange(@Body() dto: ConfirmEmailVerificationDto) {
    await this.authService.confirmEmailChange(dto.token)
  }
}
