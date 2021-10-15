import { PatentAPIResponse } from '../models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PatentsService {
    constructor(private readonly httpService: HttpService) {}

    async query(terms: string[] = []): Promise<AxiosResponse<PatentAPIResponse>> {
        const abstracts = [];
        const titles = [];

        terms.forEach((term) => {
            abstracts.push({ _text_any: { patent_abstract: term } });
            titles.push({ _text_any: { patent_title: term } });
        });

        const config = {
            params: {
                q: JSON.stringify({
                    _or: [{ _and: titles }, { _and: abstracts }],
                }),
                f: JSON.stringify([
                    'patent_number',
                    'patent_title',
                    'patent_date',
                    'patent_abstract',
                    'cited_patent_number',
                ]),
                o: JSON.stringify({ page: 1, per_page: 100 }), //set back to 1000
            },
        };

        return lastValueFrom(
            this.httpService.get<PatentAPIResponse>(`${process.env.PATENT_API_URL}/patents/query`, config),
        );
    }

    // to query for a single patent
    async getSingle(patentNum: string): Promise<AxiosResponse<PatentAPIResponse>> {
        const patentID = patentNum;

        const config = {
            params: {
                q: JSON.stringify({ _eq: { patent_number: patentID } }),
                f: JSON.stringify([
                    'patent_number',
                    'patent_title',
                    'patent_date',
                    'patent_abstract',
                    'cited_patent_number',
                ]),
                o: JSON.stringify({ page: 1, per_page: 1 }),
            },
        };

        return lastValueFrom(
            this.httpService.get<PatentAPIResponse>(`${process.env.PATENT_API_URL}/patents/query`, config),
        );
    }

    // to query for cited patents for provided source
    async getCitedPatents(patentNum: string): Promise<AxiosResponse<PatentAPIResponse>> {
        const patentID = patentNum;

        const config = {
            params: {
                q: JSON.stringify({ _eq: { patent_number: patentID } }),
                f: JSON.stringify(['cited_patent_number']),
                o: JSON.stringify({ page: 1, per_page: 100 }),
            },
        };
        //returns a patent with citations only, e.g patent->citations->cit_num:0, cit_num:1
        return lastValueFrom(
            this.httpService.get<PatentAPIResponse>(`${process.env.PATENT_API_URL}/patents/query`, config),
        );
    }
}
