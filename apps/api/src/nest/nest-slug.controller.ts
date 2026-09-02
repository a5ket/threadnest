import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { NestSlugAvailabilityResponseDto } from './dto/nest.slug-availability-response.dto'
import { NestService } from './nest.service'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'

/** Checks slug availability while a user is choosing a nest name, before actual creation. */
@ApiTags('Nests')
@Controller('nest-slugs')
export class NestSlugController {
  constructor(
    private readonly nest: NestService
  ) { }

  @Get(':nestSlug/availability')
  @Authenticated()
  @ApiOperation({ operationId: 'nestSlugCheckAvailability', summary: 'Check whether a nest slug is available' })
  @ApiDataResponse({ status: 200, description: 'Slug availability', type: NestSlugAvailabilityResponseDto })
  check(
    @Param('nestSlug') nestSlug: string
  ) {
    return this.nest.checkSlugAvailability(nestSlug)
  }
}
