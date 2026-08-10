import { Body, Controller, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { ReportCreateDto } from './dto/report-create.dto'
import { ReportResponseDto } from './dto/report-response.dto'
import { AlreadyReportedException } from './exceptions/already-reported.exception'
import { ReportService } from './report.service'

@ApiTags('Reports')
@Controller('nests/:nestSlug/threads/:threadSlug/reports')
@UseInterceptors(ResponseInterceptor)
export class NestThreadReportController {
  constructor(
    private readonly reports: ReportService,
  ) { }

  @Post()
  @AuthenticatedAndVerified()
  @ApiOperation({ operationId: 'nestThreadReportCreate', summary: 'Report a thread' })
  @ApiDataResponse({ status: 201, description: 'Report filed', type: ReportResponseDto })
  @ApiExceptionResponses(ValidationException, NestNotFoundException, ThreadNotFoundException, AlreadyReportedException, InsufficientPermissionsException)
  create(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReportCreateDto,
  ) {
    return this.reports.reportThread(nestSlug, threadSlug, user.id, dto)
  }
}
