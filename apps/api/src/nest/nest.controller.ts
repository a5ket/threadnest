import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestDetailResponseDto } from './dto/nest.detail-response.dto'
import { NestDiscoveryResponseDto } from './dto/nest-discovery-response.dto'
import { NestQueryDto } from './dto/nest.query.dto'
import { NestTransferOwnershipDto } from './dto/nest.transfer-ownership.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import { CannotTransferOwnershipToSelfException } from './exceptions/cannot-transfer-ownership-to-self.exception'
import { NestLimitReachedException } from './exceptions/nest-limit-reached.exception'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestSlugReservedException } from './exceptions/nest-slug-reserved.exception'
import { NestSlugTakenException } from './exceptions/nest-slug-taken.exception'
import { TargetUserNotMemberException } from './exceptions/target-user-not-member.exception'
import { NestService } from './nest.service'

@ApiTags('Nests')
@Controller('nests')
@UseInterceptors(ResponseInterceptor)
export class NestController {
  constructor(
    private readonly nests: NestService,
  ) { }

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'nestList', summary: 'Discover public nests (and private nests the current user is a member of)' })
  @ApiPaginatedResponse({ status: 200, description: 'Nests', type: NestDiscoveryResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  list(
    @Query() query: NestQueryDto,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.nests.listDiscoverable(query, user?.id)
  }

  @Post()
  @RateLimit({ limit: 5, ttlMs: 60 * 60_000 })
  @ApiOperation({ operationId: 'nestCreate', summary: 'Create a nest' })
  @ApiDataResponse({ status: 201, description: 'Nest created', type: NestDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestSlugReservedException, NestSlugTakenException, NestLimitReachedException)
  createNest(
    @Body() dto: NestCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.nests.create(user.id, dto)
  }

  @Get(':nestSlug')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    operationId: 'nestGetBySlug',
    summary: 'Get a nest by slug',
    description: 'Fields beyond id/name/slug/access are only included if the current user can view the nest.'
  })
  @ApiDataResponse({ status: 200, description: 'Nest', type: NestDetailResponseDto })
  @ApiExceptionResponses(NestNotFoundException)
  getBySlug(
    @Param('nestSlug') nestSlug: string,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.nests.getBySlug(nestSlug, user?.id ?? undefined)
  }

  @Patch(':nestSlug')
  @ApiOperation({ operationId: 'nestUpdate', summary: 'Update a nest\'s name and/or description' })
  @ApiDataResponse({ status: 200, description: 'Nest updated', type: NestDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestNotFoundException, InsufficientPermissionsException)
  update(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestUpdateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.nests.update(nestSlug, user.id, dto)
  }

  @Patch(':nestSlug/owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestTransferOwnership', summary: 'Transfer nest ownership to another member' })
  @ApiResponse({ status: 204, description: 'Ownership transferred' })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, CannotTransferOwnershipToSelfException, NestNotFoundException, InsufficientPermissionsException, TargetUserNotMemberException)
  async transferOwnership(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestTransferOwnershipDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.nests.transferOwnership(nestSlug, user.id, dto)
  }

  @Delete(':nestSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestDelete', summary: 'Delete a nest' })
  @ApiResponse({ status: 204, description: 'Nest deleted' })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  async deleteNest(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.nests.delete(nestSlug, user.id)
  }
}
