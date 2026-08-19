import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseInterceptors } from '@nestjs/common'
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
import { ChatNotFoundException } from '../exceptions/chat-not-found.exception'
import { CannotMessageBlockedUserException } from '../exceptions/cannot-message-blocked-user.exception'
import { MessageNotFoundException } from '../exceptions/message-not-found.exception'
import { ReplyTargetNotInChatException } from '../exceptions/reply-target-not-in-chat.exception'
import { MessageCreateDto } from './dto/message-create.dto'
import { MessageQueryDto } from './dto/message.query.dto'
import { MessageResponseDto } from './dto/message-response.dto'
import { MessageService } from './message.service'

@ApiTags('Chats')
@Controller('chats/:chatId/messages')
@AuthenticatedAndVerified()
@UseInterceptors(ResponseInterceptor)
export class MessageController {
  constructor(
    private readonly messages: MessageService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'chatMessageList', summary: 'List messages in a chat' })
  @ApiPaginatedResponse({ status: 200, description: 'Messages', type: MessageResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, ChatNotFoundException)
  list(
    @Param('chatId') chatId: string,
    @Query() query: MessageQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messages.listMessages(user.id, chatId, query)
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'chatMessageSend', summary: 'Send a message in a chat' })
  @ApiDataResponse({ status: 201, description: 'Message sent', type: MessageResponseDto })
  @ApiExceptionResponses(ValidationException, ChatNotFoundException, CannotMessageBlockedUserException, MessageNotFoundException, ReplyTargetNotInChatException)
  send(
    @Param('chatId') chatId: string,
    @Body() dto: MessageCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messages.sendMessage(user.id, chatId, dto)
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'chatMessageDelete', summary: 'Delete (unsend) a message' })
  @ApiResponse({ status: 204, description: 'Message deleted' })
  @ApiExceptionResponses(ChatNotFoundException, MessageNotFoundException, InsufficientPermissionsException)
  async remove(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.messages.deleteMessage(user.id, chatId, messageId)
  }
}
