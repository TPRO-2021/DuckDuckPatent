import { Controller, Get, Query } from '@nestjs/common';
import { MockPatentsService } from './patents.service.mock';

@Controller('patents')
export class PatentsController {
    constructor(private readonly patentService: MockPatentsService) {}

    @Get('')
    query(@Query() query): string[] {
        let { keywords } = query;

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        return this.patentService.query(keywords);
    }
}
