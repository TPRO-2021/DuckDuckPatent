import { BadRequestException, Controller, Get, Query, Response } from '@nestjs/common';
import { Response as Res } from 'express';
import { PatentsService } from './patents.service';
import { Patent, PatentSearchQuery } from './models';

@Controller('patents')
export class PatentsController {
    constructor(private readonly patentService: PatentsService) {}

    /**
     * Query function which expects the query parameter keywords.
     *
     * @param query
     * @param res
     */
    @Get('')
    async query(@Query() query: PatentSearchQuery, @Response() res: Res): Promise<Res<any, Record<string, Patent>>> {
        let { keywords, page = null } = query;

        if (!keywords) {
            throw new BadRequestException('At least one keyword needs to be specified');
        }

        if (!page) {
            page = '0';
        }

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        const { patents, total } = await this.patentService.query(keywords, parseInt(page));

        // set the X-Total-Count header on the response
        return res.set({ 'X-Total-Count': total }).json(patents);
    }
}
