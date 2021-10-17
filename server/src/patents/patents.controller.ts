import { Controller, Get, Param, Query } from '@nestjs/common';
import { PatentsService } from './patents.service';
import { PatentAPIResponse, Patent } from '../models';

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

    /**
     * Function which retrieves a specific patent
     * @param id accepts the id of the patent
     * */
    @Get('/:id')
    async getPatent(@Param('id') id: string): Promise<Patent> {
        //patent can be retrieved using: patent number, title
        const response = await this.patentService.get(id);
        return (response.data as PatentAPIResponse).patents[0];
    }

    /**
     * Function which retrieves full data on citing patents for a given one
     * @param id the id of the source patent
     * */
    @Get('/:id/similar')
    async querySimilarPatents(@Param('id') id: string): Promise<any> {
        // retrieve only objects with cited_patent_numbers
        const citationsSourcePatent = await this.patentService.getCitedPatents(id);
        const citationsUnfiltered = citationsSourcePatent.data.patents[0];

        //export cited_patent_numbers as strings for easier operation later on
        const filteredPatentIDs = [];
        citationsUnfiltered['cited_patents'].forEach((item, index) => {
            filteredPatentIDs.push(citationsUnfiltered['cited_patents'][index]['cited_patent_number']);
        });

        // return full information on cited patents
        return await Promise.all(
            filteredPatentIDs.map(async (patent_number) => {
                const patentCited = await this.patentService.get(patent_number);
                return (patentCited.data as PatentAPIResponse).patents[0];
            }),
        );
    }
}
