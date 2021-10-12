import { Controller, Get, Query } from '@nestjs/common';
import { PatentsService } from './patents.service';
import { PatentAPIResponse } from '../models';

@Controller('patents')
export class PatentsController {
    constructor(private readonly patentService: PatentsService) {}

    @Get('')
    async query(@Query() query): Promise<any[]> {
        let { keywords } = query;

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        const response = await this.patentService.query(keywords);
        return (response.data as PatentAPIResponse).patents;
    }
}
