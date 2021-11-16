import { BadRequestException, Controller, Get, Param, Query, Response, Headers } from '@nestjs/common';
import { Response as Res } from 'express';
import { PatentsService } from './patents.service';
import { DocumentInformation, Patent, PatentSearchQuery } from './models';

/**
 * This controller registers the '/patents' route and delegates the requests to the patents service
 */
@Controller('patents')
export class PatentsController {
    constructor(private readonly patentService: PatentsService) {}

    /**
     * Route handler for querying patents based on the provided query. Returns an array of Patents
     * and the count of all available patents inside of the X-Total-Count header
     *
     * @param query     The query containing search & filtering parameters
     * @param res       The expressJS response object which is used to set a custom header
     */
    @Get('')
    async query(@Query() query: PatentSearchQuery, @Response() res: Res): Promise<Res<any, Record<string, Patent>>> {
        // destructuring all possible parameters from the query
        let { keywords, date = '' } = query;
        const { page = '0', language = 'en', country = '', inventor, applicant } = query;

        // checking if at least one of the required query parameters is specified
        if (!keywords && !applicant && !inventor) {
            throw new BadRequestException('At least one keyword, applicant or inventor needs to be specified');
        }

        // if a date is specified it needs to be correctly formatted
        if (date.length > 0) {
            date = date.slice(0, 4) + ' ' + date.slice(5, 9);
        }

        // If only one query parameter is sent it's treated as a string, not an array
        if (typeof keywords === 'string') {
            keywords = [].concat(keywords);
        }

        // retrieving patents and total count from the patents service
        const { patents, total } = await this.patentService.query(
            keywords,
            parseInt(page),
            language,
            country.toUpperCase(),
            date,
            inventor,
            applicant,
        );

        // set the X-Total-Count header on the response and return the patents
        return res.set({ 'X-Total-Count': total }).json(patents);
    }

    /**
     * Route handler for retrieving a patent based on the provided ID
     *
     * @param patentId  The id of the patent
     */
    @Get('/:patentId')
    async get(@Param('patentId') patentId): Promise<Patent> {
        return this.patentService.get(patentId);
    }

    /**
     * Route handler for retrieving document information for a patent
     *
     * @param patentId The id of the patent
     */
    @Get('/:patentId/documents')
    async queryDocuments(@Param('patentId') patentId): Promise<DocumentInformation[]> {
        return this.patentService.queryDocuments(patentId);
    }

    /**
     * Route handler for retrieving a specific document for a patent
     *
     * @param docUrl    The url of the document (base64 encoded)
     * @param headers   The headers of the clients request
     * @param res       The expressJS response object
     * @param query     The query object of the request
     */
    @Get('/:patentId/documents/:docUrl')
    async getDocument(@Param('docUrl') docUrl: string, @Headers() headers, @Response() res: Res, @Query() query) {
        // since a content-type is required by OPS it needs to be specified by the client
        const contentType = headers.accept;
        if (!contentType) {
            throw new BadRequestException('Please specify a content type!');
        }

        // Decode the URL. (it is send as a base64 string to prevent URL collisions)
        const decodedUrl = Buffer.from(docUrl, 'base64').toString('ascii');

        // retrieve the document from the patent service
        const data = await this.patentService.getDocument(decodedUrl, contentType, Number(query.range || 0));

        // apply the OPS-response headers to the response object
        let response: Res;
        for (const headersKey in data.headers) {
            response = res.setHeader(headersKey, data.headers[headersKey]);
        }

        // return the data;
        return response.send(data.data);
    }

    /**
     * Route handler for retrieving the patent family of a patent
     *
     * @param patentId The patent id
     */
    @Get('/:patentId/family')
    async queryFamily(@Param('patentId') patentId) {
        return this.patentService.queryFamily(patentId);
    }
}
