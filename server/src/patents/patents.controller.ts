import { Body, Controller, Get } from '@nestjs/common';
import { MockPatentsService } from './patents.service.mock';

@Controller()
export class PatentsController {
    constructor(private readonly patentService: MockPatentsService) {}

    @Get('search')
    query(@Body() body: any): any[] {
        return this.patentService.query(body.terms);
    }
}
