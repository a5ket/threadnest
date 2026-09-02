import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { NotificationUnseenCountResponseDto } from 'src/notification/dto/notification-unseen-count-response.dto'
import { NotificationResponseDto } from 'src/notification/dto/notification-response.dto'
import { NotificationQueryDto } from 'src/notification/dto/notification.query.dto'
import { NotificationNotFoundException } from 'src/notification/exceptions/notification-not-found.exception'
import { NotificationService } from 'src/notification/notification.service'

/** The current user's notifications: list, unseen count, and mark read/seen. */
@ApiTags('Notifications')
@Controller('/me/notifications')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeNotificationController {
  constructor(
    private readonly notifications: NotificationService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meNotificationList', summary: 'List notifications for the current user' })
  @ApiPaginatedResponse({ status: 200, description: 'Notifications', type: NotificationResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  list(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.notifications.listForUser(user.id, query)
  }

  @Get('unseen-count')
  @ApiOperation({ operationId: 'meNotificationUnseenCount', summary: 'Count notifications the current user has not seen yet' })
  @ApiDataResponse({ status: 200, description: 'Unseen count', type: NotificationUnseenCountResponseDto })
  async unseenCount(
    @CurrentUser() user: AuthUser
  ) {
    return { count: await this.notifications.getUnseenCount(user.id) }
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNotificationMarkAllRead', summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204, description: 'Notifications marked as read' })
  async markAllRead(
    @CurrentUser() user: AuthUser
  ) {
    await this.notifications.markAllAsRead(user.id)
  }

  @Patch('seen')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNotificationMarkSeen', summary: 'Mark all notifications as seen (clears the unseen count, independent of read state)' })
  @ApiResponse({ status: 204, description: 'Notifications marked as seen' })
  async markSeen(
    @CurrentUser() user: AuthUser
  ) {
    await this.notifications.markAllAsSeen(user.id)
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNotificationMarkRead', summary: 'Mark a notification as read' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiExceptionResponses(NotificationNotFoundException)
  async markRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.notifications.markAsRead(notificationId, user.id)
  }
}
