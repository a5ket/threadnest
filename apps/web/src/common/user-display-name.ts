import { UserReferenceDto } from '@/generated/api/models'

export function getUserDisplayName(user: UserReferenceDto): string {
  return user.profile?.displayName ?? user.profile?.username ?? 'Deleted user'
}
