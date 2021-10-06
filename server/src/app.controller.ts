import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { MockPatentsService } from './mock-patents.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly patentsService: MockPatentsService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Post('/search')
    search(@Body() body: any): any[] {
        return this.patentsService.search(body.terms);
    }
}
