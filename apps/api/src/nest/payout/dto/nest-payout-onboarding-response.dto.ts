import { ApiProperty } from '@nestjs/swagger'

export class NestPayoutOnboardingResponseDto {
  @ApiProperty({ description: 'Stripe-hosted onboarding URL to redirect the owner to' })
  url!: string
}
