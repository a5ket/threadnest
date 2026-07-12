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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { VerifiedGuard } from 'src/security/guards/verified.guard'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestTransferOwnershipDto } from './dto/nest.transfer-ownership.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import { NestService } from './nest.service'

@Controller('nests')

@UseInterceptors(ResponseInterceptor)
export class NestController {
  constructor(
    private readonly nests: NestService,
  ) { }

  @Post()
  @UseGuards(AuthGuard, VerifiedGuard)
  createNest(
    @Body() dto: NestCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.nests.create(user.id, dto)
  }

  @Get(':nestSlug')
  @UseGuards(OptionalAuthGuard)
  getBySlug(
    @Param('nestSlug') nestSlug: string,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.nests.getBySlug(nestSlug, user?.id ?? undefined)
  }

  @Patch(':nestSlug')
  @UseGuards(AuthGuard, VerifiedGuard)
  update(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestUpdateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.nests.update(nestSlug, user.id, dto)
  }

  @Patch(':nestSlug/owner')
  @UseGuards(AuthGuard, VerifiedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async transferOwnership(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestTransferOwnershipDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.nests.transferOwnership(nestSlug, user.id, dto)
  }

  @Delete(':nestSlug')
  @UseGuards(AuthGuard, VerifiedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNest(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.nests.delete(nestSlug, user.id)
  }
}