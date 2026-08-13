import { getUserDisplayName } from '@/common/user-display-name'
import { NotificationResponseDtoType } from '@/generated/api/models'
import type { Notification } from './notification.types'

export interface NotificationContent {
  text: string
  href: string
}

export function getNotificationContent(notification: Notification): NotificationContent {
  const actorName = notification.actor ? getUserDisplayName(notification.actor) : 'Someone'
  const data = notification.data

  switch (data.type) {
    case NotificationResponseDtoType.THREAD_REPLY:
      return {
        text: `${actorName} replied to your thread "${data.threadTitle}"`,
        href: `/n/${data.nestSlug}/t/${data.threadSlug}/c/${data.commentId}`
      }
    case NotificationResponseDtoType.COMMENT_REPLY:
      return {
        text: `${actorName} replied to your comment in "${data.threadTitle}"`,
        href: `/n/${data.nestSlug}/t/${data.threadSlug}/c/${data.commentId}`
      }
    case NotificationResponseDtoType.JOIN_REQUEST_APPROVED:
      return {
        text: `${actorName} approved your request to join ${data.nestName}`,
        href: `/n/${data.nestSlug}`
      }
    case NotificationResponseDtoType.JOIN_REQUEST_REJECTED:
      return {
        text: `${actorName} rejected your request to join ${data.nestName}`,
        href: `/n/${data.nestSlug}`
      }
    case NotificationResponseDtoType.NEST_INVITE_RECEIVED:
      return {
        text: `${actorName} invited you to join ${data.nestName}`,
        href: `/n/${data.nestSlug}`
      }
    case NotificationResponseDtoType.BANNED_FROM_NEST:
      return {
        text: `${actorName} banned you from ${data.nestName}`,
        href: `/n/${data.nestSlug}`
      }
    case NotificationResponseDtoType.OWNERSHIP_TRANSFERRED:
      return {
        text: `${actorName} made you the owner of ${data.nestName}`,
        href: `/n/${data.nestSlug}`
      }
    case NotificationResponseDtoType.REPORT_RESOLVED:
      return {
        text: `Your report on "${data.threadTitle}" was ${data.status === 'RESOLVED' ? 'resolved' : 'dismissed'}`,
        href: `/n/${data.nestSlug}/t/${data.threadSlug}`
      }
    case NotificationResponseDtoType.CONTENT_REMOVED:
      return {
        text: `Your ${data.targetType === 'THREAD' ? 'thread' : 'comment'} in "${data.threadTitle}" was removed`,
        href: `/n/${data.nestSlug}/t/${data.threadSlug}`
      }
  }
}
