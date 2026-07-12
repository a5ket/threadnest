import { Controller, Get, Param } from '@nestjs/common'
import { NestService } from './nest.service'

@Controller('nest-slugs')
export class NestSlugController {
  constructor(
    private readonly nest: NestService
  ) { }

  @Get(':nestSlug/availability')
  check(
    @Param('nestSlug') nestSlug: string
  ) {
    return this.nest.checkSlugAvailability(nestSlug)
  }
}