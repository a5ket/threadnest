import { Controller, Get } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'

/** Root route: liveness/identity probe, not part of the public API surface. */
@Controller()
export class AppController {
    @Get('/')
    @ApiExcludeEndpoint()
    getRoot() {
        return {
            name: 'ThreadNest API',
            version: '1.0.0',
            status: 'ok'
        }
    }
}