import { ApiProperty } from '@nestjs/swagger'

export class NotificationUnseenCountResponseDto {
  @ApiProperty({ description: 'Number of notifications the user has not seen yet (i.e. not yet viewed in the notification list/dropdown)' })
  count!: number
}
