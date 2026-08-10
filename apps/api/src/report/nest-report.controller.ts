import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { ReportResponseDto } from './dto/report-response.dto'
import { ReportQueryDto } from './dto/report.query.dto'
import { ReportAlreadyResolvedException } from './exceptions/report-already-resolved.exception'
import { ReportNotFoundException } from './exceptions/report-not-found.exception'
import { ReportService } from './report.service'

@ApiTags('Reports')
@Controller('nests/:nestSlug/reports')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestReportController {
  constructor(
    private readonly reports: ReportService,
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestReportList', summary: 'List content reports for a nest' })
  @ApiDataResponse({ status: 200, description: 'Reports', type: ReportResponseDto, isArray: true })
  @ApiExceptionResponses(ValidationException, NestNotFoundException, InsufficientPermissionsException)
  list(
    @Param('nestSlug') nestSlug: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reports.listQueue(nestSlug, user.id, query.status)
  }

  @Post(':reportId/resolve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestReportResolve', summary: 'Mark a report as resolved (action was taken)' })
  @ApiResponse({ status: 204, description: 'Report resolved' })
  @ApiExceptionResponses(NestNotFoundException, ReportNotFoundException, ReportAlreadyResolvedException, InsufficientPermissionsException)
  async resolve(
    @Param('nestSlug') nestSlug: string,
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.reports.resolve(nestSlug, reportId, user.id)
  }

  @Post(':reportId/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestReportDismiss', summary: 'Dismiss a report (no action needed)' })
  @ApiResponse({ status: 204, description: 'Report dismissed' })
  @ApiExceptionResponses(NestNotFoundException, ReportNotFoundException, ReportAlreadyResolvedException, InsufficientPermissionsException)
  async dismiss(
    @Param('nestSlug') nestSlug: string,
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.reports.dismiss(nestSlug, reportId, user.id)
  }
}
