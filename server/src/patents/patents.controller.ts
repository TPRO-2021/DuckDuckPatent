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
     * @function to retrieve a specific patent
     * @param accepts the id of the patent
     * @return a single patent
     * */
    @Get('/id=:id')
    async querySinglePatent(@Param('id') id: string): Promise<Patent> {
        //getSinglePatent
        //patent can be retrieved using: patent number, title
        const patentID = id;

        const response = await this.patentService.getSingle(patentID);
        return (response.data as PatentAPIResponse).patents[0];
    }

    /**
     * @function to retrieve full data on citing patents for a given one
     * @param accepts the id of the source patent
     * @return complete data on citing patents
     * */
    @Get('/id=:id/similar')
    async querySimilarPatents(@Param('id') id: string): Promise<any> {
        // retrieve only objects with cited_patent_numbers
        const citationsSourcePatent = await this.patentService.getCitedPatents(id);
        const citationsUnfiltered = citationsSourcePatent.data.patents[0]; //is a nested object of cited_patent_numbers

        //export cited_patent_numbers as strings for easier operation later on
        const filteredPatentIDs = [];
        for (let i = 0; i < citationsUnfiltered['cited_patents'].length; i++) {
            filteredPatentIDs.push(citationsUnfiltered['cited_patents'][i]['cited_patent_number']);
        }

        // retrieve full information on cited patents
        const response = Promise.all(
            filteredPatentIDs.map(async (patent_number) => {
                const patentCited = await this.patentService.getSingle(patent_number);
                return (patentCited.data as PatentAPIResponse).patents[0];
            }),
        );

        return response;
    }
}
