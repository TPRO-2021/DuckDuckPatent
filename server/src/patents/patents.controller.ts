import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PatentsService } from './patents.service';
import { PatentAPIResponse, ExtendedPatent, PatentApiAbstract, Patent, Inventor } from './models';
import { PatentsModule } from './patents.module';

@Controller('patents')
export class PatentsController {
    constructor(private readonly patentService: PatentsService) {}

    // /**
    //  * Function which retrieves a specific patent
    //  * @param id accepts the id of the patent
    //  * */
    // @Get('/:id')
    // async getPatent(@Param('id') id: string): Promise<Patent> {
    //     //patent can be retrieved using: patent number, title
    //     const response = await this.patentService.get(id);
    //     return (response.data as PatentAPIResponse).patents[0];
    // }
    //
    // /**
    //  * Function which retrieves full data on citing patents for a given one
    //  * @param id the id of the source patent
    //  * */
    // @Get('/:id/similar')
    // async querySimilarPatents(@Param('id') id: string): Promise<any> {
    //     // retrieve only objects with cited_patent_numbers
    //     const citationsSourcePatent = await this.patentService.getCitedPatents(id);
    //     const citationsUnfiltered = citationsSourcePatent.data.patents[0];
    //
    //     //export cited_patent_numbers as strings for easier operation later on
    //     const filteredPatentIDs = [];
    //     citationsUnfiltered['cited_patents'].forEach((item, index) => {
    //         filteredPatentIDs.push(citationsUnfiltered['cited_patents'][index]['cited_patent_number']);
    //     });
    //
    //     // return full information on cited patents
    //     return await Promise.all(
    //         filteredPatentIDs.map(async (patent_number) => {
    //             const patentCited = await this.patentService.get(patent_number);
    //             return (patentCited.data as PatentAPIResponse).patents[0];
    //         }),
    //     );
    // }

    @Get('')
    async checkToken(@Query() query): Promise<Patent[]> {
        const response = await this.patentService.getPatentData();
        let inventor: string[];
        const allData =
            response.data['ops:world-patent-data']['ops:biblio-search']['ops:search-result']['exchange-documents'];
        const patents = allData.map((value) => {
            let inventor_name = value['exchange-document']['bibliographic-data'].parties.inventors.inventor;
            if (!(inventor_name instanceof Array)) {
                inventor_name = [inventor_name];
                inventor[0] = inventor_name['inventor-name'].name.$;
            } else {
                inventor_name.forEach((element) => inventor.push(element['inventor-name'].name.$));
            }
            let applicant_name = value['exchange-document']['bibliographic-data'].parties.applicants.applicant;
            if (!(applicant_name instanceof Array)) {
                applicant_name = [applicant_name];
            }
            let abstract = value['exchange-document'].abstract;
            if (abstract instanceof Array) {
                abstract = abstract.find((a: PatentApiAbstract) => a['@lang'] === 'en');
            }
            let title = value['exchange-document']['bibliographic-data']['invention-title'];
            if (title instanceof Array) title = title.find((a) => a['@lang'] === 'en');
            return {
                '@country': value['exchange-document']['@country'],
                '@doc-number': value['exchange-document']['@doc-number'],
                '@kind': value['exchange-document']['@kind'],
                abstract: abstract.p.$,
                'invention-title': title.$,
                'inventor-name': inventor,
                'applicant-name': applicant_name[0]['applicant-name'].name.$,
                // 'doc-number':
                //     value['exchange-document']['bibliographic-data']['references-cited'].citation[0].patcit[
                //         'document-id'
                //     ][0]['doc-number'].$,
                // kind: value['exchange-document']['bibliographic-data']['references-cited'].citation[0].patcit[
                //     'document-id'
                // ][0].kind.$,
                // country:
                //     value['exchange-document']['bibliographic-data']['references-cited'].citation[0].patcit[
                //         'document-id'
                //     ][0].country.$,
            } as Patent;
        });

        console.log(patents);
        return patents;
    }
}
