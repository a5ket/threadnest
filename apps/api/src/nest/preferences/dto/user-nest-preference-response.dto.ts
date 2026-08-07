import { ApiProperty } from '@nestjs/swagger'

export class UserNestPreferenceResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string

  @ApiProperty({ description: 'Nest ID' })
  nestId!: string

  @ApiProperty({ description: 'Whether other members can send this user invites to the nest' })
  allowInvites!: boolean

  @ApiProperty({ description: 'Whether this user has muted notifications for the nest' })
  muted!: boolean
}
