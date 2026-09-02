import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { AlreadyReportedToPlatformException } from './exceptions/already-reported-to-platform.exception'
import { PlatformReportAlreadyResolvedException } from './exceptions/platform-report-already-resolved.exception'
import { PlatformReportNotFoundException } from './exceptions/platform-report-not-found.exception'
import { PlatformReportTargetNotFoundException } from './exceptions/platform-report-target-not-found.exception'
import { PlatformReportCreateDto } from './dto/platform-report-create.dto'
import { PlatformReportQueryDto } from './dto/platform-report.query.dto'
import { PlatformReportResponseDto } from './dto/platform-report-response.dto'
import { PlatformReportService } from './platform-report.service'

/** Platform-level content reports: any user can file one, moderators triage the queue. */
@ApiTags('Platform Reports')
@Controller('platform/reports')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class PlatformReportController {
  constructor(
    private readonly reports: PlatformReportService
  ) { }

  @Post()
  @AuthenticatedAndVerified()
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'platformReportCreate', summary: 'Report a nest, user, thread, or comment to platform moderators' })
  @ApiDataResponse({ status: 201, description: 'Report filed', type: PlatformReportResponseDto })
  @ApiExceptionResponses(ValidationException, PlatformReportTargetNotFoundException, AlreadyReportedToPlatformException)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: PlatformReportCreateDto,
  ) {
    return this.reports.report(user.id, dto)
  }

  @Get()
  @ApiOperation({ operationId: 'platformReportList', summary: 'List platform-level reports' })
  @ApiDataResponse({ status: 200, description: 'Reports', type: PlatformReportResponseDto, isArray: true })
  @ApiExceptionResponses(ValidationException, InsufficientPermissionsException)
  list(
    @Query() query: PlatformReportQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reports.listQueue(user.id, query.status)
  }

  @Post(':reportId/resolve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'platformReportResolve', summary: 'Mark a platform report as resolved (action was taken)' })
  @ApiResponse({ status: 204, description: 'Report resolved' })
  @ApiExceptionResponses(PlatformReportNotFoundException, PlatformReportAlreadyResolvedException, InsufficientPermissionsException)
  async resolve(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.reports.resolve(reportId, user.id)
  }

  @Post(':reportId/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'platformReportDismiss', summary: 'Dismiss a platform report (no action needed)' })
  @ApiResponse({ status: 204, description: 'Report dismissed' })
  @ApiExceptionResponses(PlatformReportNotFoundException, PlatformReportAlreadyResolvedException, InsufficientPermissionsException)
  async dismiss(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.reports.dismiss(reportId, user.id)
  }
}
