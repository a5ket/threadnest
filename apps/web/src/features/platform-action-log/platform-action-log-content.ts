import { getUserDisplayName } from '@/common/user-display-name'
import { PlatformActionLogResponseDtoType } from '@/generated/api/models'
import type { PlatformActionLogEntry } from './platform-action-log.types'

export interface PlatformActionLogContent {
  text: string
  href: string
}

export function getPlatformActionLogContent(log: PlatformActionLogEntry): PlatformActionLogContent {
  const actorName = getUserDisplayName(log.actor)
  const targetName = log.target ? getUserDisplayName(log.target) : 'a user'
  const targetHref = log.target?.profile ? `/users/${log.target.profile.username}` : '/admin'
  const data = log.data

  switch (data.type) {
    case PlatformActionLogResponseDtoType.ROLE_GRANTED:
      return {
        text: `${actorName} granted ${targetName} the ${data.role} role`,
        href: targetHref
      }
    case PlatformActionLogResponseDtoType.ROLE_CHANGED:
      return {
        text: `${actorName} changed ${targetName}'s role to ${data.newRole}`,
        href: targetHref
      }
    case PlatformActionLogResponseDtoType.ROLE_REVOKED:
      return {
        text: `${actorName} revoked ${targetName}'s platform role`,
        href: targetHref
      }
    case PlatformActionLogResponseDtoType.USER_SUSPENDED:
      return {
        text: `${actorName} suspended ${targetName} — ${data.reason}`,
        href: targetHref
      }
    case PlatformActionLogResponseDtoType.USER_UNSUSPENDED:
      return {
        text: `${actorName} lifted ${targetName}'s suspension`,
        href: targetHref
      }
    case PlatformActionLogResponseDtoType.THREAD_REMOVED:
      return {
        text: `${actorName} removed the thread "${data.threadTitle}" in ${data.nestName}`,
        href: `/n/${data.nestSlug}/t/${data.threadSlug}`
      }
    case PlatformActionLogResponseDtoType.COMMENT_REMOVED:
      return {
        text: `${actorName} removed a comment in "${data.threadTitle}" (${data.nestName})`,
        href: `/n/${data.nestSlug}/t/${data.threadSlug}/c/${data.commentId}`
      }
    case PlatformActionLogResponseDtoType.CONTENT_BULK_REMOVED:
      return {
        text: `${actorName} removed all of ${targetName}'s content (${data.threadsRemoved} threads, ${data.commentsRemoved} comments)`,
        href: targetHref
      }
    case PlatformActionLogResponseDtoType.REPORT_REVIEWED:
      return {
        text: `${actorName} ${data.status === 'RESOLVED' ? 'resolved' : 'dismissed'} a platform report`,
        href: '/admin'
      }
  }
}
