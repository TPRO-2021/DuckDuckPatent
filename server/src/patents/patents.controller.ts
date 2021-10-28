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
        //let { keywords, page = null } = query;
        let { keywords, page, language, country, date = null } = query;
        if (!keywords) {
            throw new BadRequestException('At least one keyword needs to be specified');
        }
        console.log('Query', query);
        if (!page) {
            page = '0';
        }
        if (!language) {
            language = 'en';
        }
        if (!country) {
            country = '';
        }
        if (!date) {
            date = '';
        } else {
            date = date.slice(0, 4) + ' ' + date.slice(5, 9);
        }
        country = country.toUpperCase();
        console.log(country);

        console.log(date);
        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }
        const { patents, total } = await this.patentService.query(
            keywords,
            parseInt(page),
            false,
            language,
            country,
            date,
        );

        // set the X-Total-Count header on the response
        return res.set({ 'X-Total-Count': total }).json(patents);
    }
}
