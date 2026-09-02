import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
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
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { ChatService } from './chat.service'
import { ChatDetailResponseDto } from './dto/chat-detail-response.dto'
import { ChatQueryDto } from './dto/chat.query.dto'
import { ChatStartDto } from './dto/chat-start.dto'
import { ChatSummaryResponseDto } from './dto/chat-summary-response.dto'
import { ChatUnreadCountResponseDto } from './dto/chat-unread-count-response.dto'
import { CannotChatWithYourselfException } from './exceptions/cannot-chat-with-yourself.exception'
import { CannotMessageBlockedUserException } from './exceptions/cannot-message-blocked-user.exception'
import { ChatNotFoundException } from './exceptions/chat-not-found.exception'

/**
 * 1:1 chat lifecycle: list, start/resume, view, archive/unarchive, clear. Message-level
 * operations live in {@link MessageController}.
 */
@ApiTags('Chats')
@Controller('chats')
@AuthenticatedAndVerified()
@UseInterceptors(ResponseInterceptor)
export class ChatController {
  constructor(
    private readonly chats: ChatService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'chatList', summary: 'List the current user\'s chats' })
  @ApiPaginatedResponse({ status: 200, description: 'Chats', type: ChatSummaryResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  list(
    @Query() query: ChatQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chats.listChats(user.id, query)
  }

  @Get('unread-count')
  @ApiOperation({ operationId: 'chatUnreadCount', summary: 'Count chats with unread messages for the current user' })
  @ApiDataResponse({ status: 200, description: 'Unread count', type: ChatUnreadCountResponseDto })
  async unreadCount(
    @CurrentUser() user: AuthUser
  ) {
    return { count: await this.chats.getUnreadCount(user.id) }
  }

  @Post()
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'chatStart', summary: 'Start (or resume) a direct chat with another user' })
  @ApiDataResponse({ status: 201, description: 'Chat', type: ChatDetailResponseDto })
  @ApiExceptionResponses(ValidationException, UserNotFoundException, CannotChatWithYourselfException, CannotMessageBlockedUserException)
  start(
    @Body() dto: ChatStartDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chats.startDirectChat(user.id, dto.userId)
  }

  @Get(':chatId')
  @ApiOperation({ operationId: 'chatGet', summary: 'Get a chat by ID' })
  @ApiDataResponse({ status: 200, description: 'Chat', type: ChatDetailResponseDto })
  @ApiExceptionResponses(ChatNotFoundException)
  get(
    @Param('chatId') chatId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chats.getChat(user.id, chatId)
  }

  @Post(':chatId/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'chatArchive', summary: 'Archive a chat for the current user' })
  @ApiResponse({ status: 204, description: 'Chat archived' })
  @ApiExceptionResponses(ChatNotFoundException)
  async archive(
    @Param('chatId') chatId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.chats.archiveChat(user.id, chatId)
  }

  @Post(':chatId/unarchive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'chatUnarchive', summary: 'Unarchive a chat for the current user' })
  @ApiResponse({ status: 204, description: 'Chat unarchived' })
  @ApiExceptionResponses(ChatNotFoundException)
  async unarchive(
    @Param('chatId') chatId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.chats.unarchiveChat(user.id, chatId)
  }

  @Post(':chatId/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'chatClear', summary: 'Delete a chat for the current user only. It reappears, without the old history, if the other participant messages again' })
  @ApiResponse({ status: 204, description: 'Chat cleared' })
  @ApiExceptionResponses(ChatNotFoundException)
  async clear(
    @Param('chatId') chatId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.chats.clearChat(user.id, chatId)
  }
}
