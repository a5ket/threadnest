import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { VerifiedGuard } from 'src/security/guards/verified.guard'
import { ThreadCreateDto } from './dto/thread.create.dto'
import { ThreadQueryDto } from './dto/thread.query.dto'
import { ThreadUpdateDto } from './dto/thread.update.dto'
import { ThreadService } from './thread.service'

@Controller('nests/:nestSlug/threads')
@UseInterceptors(ResponseInterceptor)
export class NestThreadController {
  constructor(
    private readonly threads: ThreadService,
  ) { }

  @Get()
  @UseGuards(OptionalAuthGuard)
  listByNest(
    @Param('nestSlug') nestSlug: string,
    @Query() query: ThreadQueryDto,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.threads.listByNest(nestSlug, query, user?.id)
  }

  @Post()
  @UseGuards(AuthGuard, VerifiedGuard)
  create(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ThreadCreateDto,
  ) {
    return this.threads.createThread(nestSlug, user.id, dto)
  }

  @Get(':threadSlug')
  @UseGuards(OptionalAuthGuard)
  getBySlug(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.threads.getThread(nestSlug, threadSlug, user?.id)
  }

  @Patch(':threadSlug')
  @UseGuards(AuthGuard, VerifiedGuard)
  update(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ThreadUpdateDto,
  ) {
    return this.threads.updateThread(nestSlug, threadSlug, user.id, dto)
  }

  @Delete(':threadSlug')
  @UseGuards(AuthGuard, VerifiedGuard)
  remove(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.threads.deleteThread(nestSlug, threadSlug, user.id)
  }
}