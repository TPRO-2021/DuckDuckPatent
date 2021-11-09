import { BadRequestException, Controller, Get, Param, Query, Response, Headers } from '@nestjs/common';
import { Response as Res } from 'express';
import { PatentsService } from './patents.service';
import { DocumentInformation, Patent, PatentSearchQuery } from './models';

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
        let { keywords, date = '' } = query;
        const { page = '0', language = 'en', country = '' } = query;

        if (!keywords) {
            throw new BadRequestException('At least one keyword needs to be specified');
        }

        if (date.length > 0) {
            date = date.slice(0, 4) + ' ' + date.slice(5, 9);
        }

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        const { patents, total } = await this.patentService.query(
            keywords,
            parseInt(page),
            language,
            country.toUpperCase(),
            date,
        );

        // set the X-Total-Count header on the response
        return res.set({ 'X-Total-Count': total }).json(patents);
    }

    @Get('/:patentId/documents')
    async queryDocuments(@Param('patentId') patentId): Promise<DocumentInformation[]> {
        return this.patentService.queryDocuments(patentId);
    }

    @Get('/:patentId/documents/:docUrl')
    async getDocument(@Param('docUrl') docUrl: string, @Headers() headers, @Response() res: Res, @Query() query) {
        const contentType = headers.accept;

        if (!contentType) {
            throw new BadRequestException('Please specify a content type');
        }

        const decodedUrl = Buffer.from(docUrl, 'base64').toString('ascii');
        const data = await this.patentService.getDocument(decodedUrl, contentType, Number(query.range || 0));

        let response: Res;
        for (const headersKey in data.headers) {
            response = res.setHeader(headersKey, data.headers[headersKey]);
        }

        return response.send(data.data);
    }

    @Get('/:patentId/family')
    async queryFamily(@Param('patentId') patentId) {
        return this.patentService.queryFamily(patentId);
    }
}
