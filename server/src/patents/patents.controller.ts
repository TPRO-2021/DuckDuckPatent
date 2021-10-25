import { BadRequestException, Controller, Get, Query, Response } from '@nestjs/common';
import { Response as Res } from 'express';
import { PatentsService } from './patents.service';
import { Patent } from './models';

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
    async query(@Query() query, @Response() res: Res): Promise<Res<any, Record<string, Patent>>> {
        let { keywords } = query;

        if (!keywords) {
            throw new BadRequestException('At least one keyword needs to be specified');
        }

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        const { patents, total } = await this.patentService.query(keywords);

        // set the X-Total-Count header on the response
        return res.set({ 'X-Total-Count': total }).json(patents);
    }
}
