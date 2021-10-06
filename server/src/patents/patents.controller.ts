import { Controller, Get, Query } from '@nestjs/common';
import { MockPatentsService } from './patents.service.mock';

@Controller('patents')
export class PatentsController {
    constructor(private readonly patentService: MockPatentsService) {}

    @Get('')
    query(@Query() query): any[] {
        return this.patentService.query(query.keywords);
    }
}
