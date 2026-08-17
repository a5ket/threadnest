import { getUserDisplayName } from '@/common/user-display-name'
import { NestActionLogResponseDtoType } from '@/generated/api/models'
import type { NestActionLogEntry } from './nest-action-log.types'

export interface NestActionLogContent {
  text: string
  href: string
}

export function getNestActionLogContent(log: NestActionLogEntry, nestSlug: string): NestActionLogContent {
  const actorName = getUserDisplayName(log.actor)
  const targetName = log.target ? getUserDisplayName(log.target) : 'a user'
  const data = log.data

  switch (data.type) {
    case NestActionLogResponseDtoType.MEMBER_ROLE_CHANGED:
      return {
        text: `${actorName} changed ${targetName}'s role to ${data.newRole}`,
        href: `/n/${nestSlug}/members`
      }
    case NestActionLogResponseDtoType.MEMBER_BANNED:
      return {
        text: data.reason ? `${actorName} banned ${targetName} — ${data.reason}` : `${actorName} banned ${targetName}`,
        href: `/n/${nestSlug}/bans`
      }
    case NestActionLogResponseDtoType.MEMBER_UNBANNED:
      return {
        text: `${actorName} unbanned ${targetName}`,
        href: `/n/${nestSlug}/bans`
      }
    case NestActionLogResponseDtoType.MEMBER_REMOVED:
      return {
        text: `${actorName} removed ${targetName} from the nest`,
        href: `/n/${nestSlug}/members`
      }
    case NestActionLogResponseDtoType.JOIN_REQUEST_APPROVED:
      return {
        text: `${actorName} approved ${targetName}'s request to join`,
        href: `/n/${nestSlug}/join-requests`
      }
    case NestActionLogResponseDtoType.JOIN_REQUEST_REJECTED:
      return {
        text: `${actorName} rejected ${targetName}'s request to join`,
        href: `/n/${nestSlug}/join-requests`
      }
    case NestActionLogResponseDtoType.THREAD_REMOVED:
      return {
        text: `${actorName} removed the thread "${data.threadTitle}"`,
        href: `/n/${nestSlug}/t/${data.threadSlug}`
      }
    case NestActionLogResponseDtoType.COMMENT_REMOVED:
      return {
        text: `${actorName} removed a comment in "${data.threadTitle}"`,
        href: `/n/${nestSlug}/t/${data.threadSlug}/c/${data.commentId}`
      }
    case NestActionLogResponseDtoType.REPORT_RESOLVED:
      return {
        text: `${actorName} ${data.status === 'RESOLVED' ? 'resolved' : 'dismissed'} a report on "${data.threadTitle}"`,
        href: `/n/${nestSlug}/t/${data.threadSlug}`
      }
    case NestActionLogResponseDtoType.SETTINGS_UPDATED:
      return {
        text: `${actorName} updated the nest settings`,
        href: `/n/${nestSlug}/settings`
      }
    case NestActionLogResponseDtoType.OWNERSHIP_TRANSFERRED:
      return {
        text: `${actorName} transferred ownership to ${targetName}`,
        href: `/n/${nestSlug}`
      }
  }
}
