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
                f: JSON.stringify(['patent_number', 'patent_title', 'patent_date', 'patent_abstract']),
                o: JSON.stringify({ page: 1, per_page: 1000 }),
            },
        };

        return lastValueFrom(
            this.httpService.get<PatentAPIResponse>(`${process.env.PATENT_API_URL}/patents/query`, config),
        );
    }
}
