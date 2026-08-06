import { ApiProperty } from '@nestjs/swagger'
import { NestAccessContextDto } from './nest.access-context.dto'
import { RoleInfoDto } from './role-info.dto'

export class NestDetailResponseDto {
  @ApiProperty({ description: 'Nest display name' })
  name!: string

  @ApiProperty({ description: 'Unique nest slug' })
  slug!: string

  @ApiProperty({ type: NestAccessContextDto, description: 'The current user\'s access and permissions for this nest' })
  access!: NestAccessContextDto

  @ApiProperty({ description: 'Nest description. Only present when the current user can view the nest', required: false })
  description?: string

  @ApiProperty({ description: 'Number of members in the nest. Only present when the current user can view the nest', required: false })
  memberCount?: number

  @ApiProperty({ description: 'Number of threads in the nest. Only present when the current user can view the nest', required: false })
  threadCount?: number

  @ApiProperty({ description: 'Creation timestamp. Only present when the current user can view the nest', required: false })
  createdAt?: Date

  @ApiProperty({ description: 'Last update timestamp. Only present when the current user can view the nest', required: false })
  updatedAt?: Date

  @ApiProperty({ type: [RoleInfoDto], required: false, description: 'This nest\'s role hierarchy, ordered from highest to lowest privilege. Only present for moderators and above' })
  roles?: RoleInfoDto[]
}
