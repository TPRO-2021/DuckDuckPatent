import { AuthResponse, ExtendedPatent, PatentAPIResponse } from './models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map, tap } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PatentsService {
    private authData: AuthResponse;
    private data: PatentAPIResponse;

    constructor(private readonly httpService: HttpService) {}

    public async getAccessToken(): Promise<any> {
        const authString = Buffer.from(`${process.env.OPS_CONSUMER_KEY}:${process.env.OPS_CONSUMER_SECRET}`).toString(
            'base64',
        );
        const headers = {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        const response = await lastValueFrom(
            this.httpService.post<AuthResponse>(
                `${process.env.PATENT_API_URL}/3.2/auth/accesstoken`,
                'grant_type=client_credentials',
                {
                    headers: headers,
                },
            ),
        );
        return response.data as AuthResponse;
    }

    // to query for a single patent
    async get(patentNum: string): Promise<AxiosResponse<PatentAPIResponse>> {
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
        if (!this.authData) {
            this.authData = await this.getAccessToken();
        }
        const headers = {
            Authorization: `Bearer ${this.authData.access_token}`,
            Accept: 'application/json',
        };
        return await lastValueFrom(
            this.httpService.get<PatentAPIResponse>(
                `${process.env.PATENT_API_URL}rest-services/published-data/publication/epodoc/${patentID}/biblio`,
                { headers: headers },
            ),
        );
    }
    public async getPatentData(terms: string[] = []): Promise<AxiosResponse<PatentAPIResponse>> {
        if (!this.authData) {
            this.authData = await this.getAccessToken();
        }
        const headers = {
            Authorization: `Bearer ${this.authData.access_token}`,
            Accept: 'application/json',
        };
        terms = ['cat'];
        const abstracts = [];
        const titles = [];

        terms.forEach((term) => {
            abstracts.push({ _text_any: { patent_abstract: term } });
            titles.push({ _text_any: { patent_title: term } });
        });
        return await lastValueFrom(
            this.httpService.get<PatentAPIResponse>(
                `${process.env.PATENT_API_URL}/rest-services/published-data/search/biblio?q=ti%3D ${terms} or ab%3D ${terms}`,
                { headers: headers },
            ),
        );
    }
}
