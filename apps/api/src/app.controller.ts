import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
    @Get('/')
    getRoot() {
        return {
            name: 'ThreadNest API',
            version: '1.0.0',
            status: 'ok'
        }
    }
}