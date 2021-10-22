import { AuthResponse, PatentAPIResponse } from './models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class PatentsService {
    private authData: AuthResponse;
    private data: PatentAPIResponse;

    constructor(private readonly httpService: HttpService) {}

    /**
     * Attempts to create a new access token for further usage. The credentials for the
     * token are send via the Authorization header.
     *
     * For this to work consumer key and secret must be specified in the .env file!
     */
    private async getAccessToken(): Promise<AuthResponse | null> {
        // creating the base64 encoded authentication string
        const authString = Buffer.from(`${process.env.OPS_CONSUMER_KEY}:${process.env.OPS_CONSUMER_SECRET}`).toString(
            'base64',
        );

        // creating the headers for axios
        const headers = {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        try {
            const response = await lastValueFrom(
                this.httpService.post<AuthResponse>(
                    `${process.env.PATENT_API_URL}/auth/accesstoken`,
                    'grant_type=client_credentials',
                    {
                        headers: headers,
                    },
                ),
            );
            return response.data as AuthResponse;
        } catch (error) {
            console.error(`Error while authenticating with ${process.env.PATENT_API_URL}`);
            throw new UnauthorizedException(error);
        }
    }

    // to query for a single patent
    async get(patentNum: string): Promise<AxiosResponse<PatentAPIResponse>> {
        const config = {
            params: {
                q: JSON.stringify({ _eq: { patent_number: patentNum } }),
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

    /**
     * Queries the patent API with the provided search terms
     * @param terms
     * @param isSecondAttempt
     */
    public async query(terms: string[], isSecondAttempt = false): Promise<AxiosResponse<PatentAPIResponse>> {
        // if no auth data is present we need to generate an access token
        if (!this.authData) {
            this.authData = await this.getAccessToken();
        }

        const abstracts = [];
        const titles = [];

        terms.forEach((term) => {
            abstracts.push({ _text_any: { patent_abstract: term } });
            titles.push({ _text_any: { patent_title: term } });
        });

        try {
            return await lastValueFrom(
                this.httpService.get<PatentAPIResponse>(
                    `${process.env.PATENT_API_URL}/rest-services/published-data/search/biblio?q=ti%3D ${terms} or ab%3D ${terms}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.authData.access_token}`,
                            Accept: 'application/json',
                        },
                    },
                ),
            );
        } catch (error) {
            // if access token is expired we will attempt to renew it and send the request again
            if ((error?.response?.data as string).toLowerCase().includes('access token has expired')) {
                // after a second attempt there should be no access expired error therefore we can stop here to prevent a stackoverflow
                if (isSecondAttempt) {
                    throw error;
                }

                this.authData = await this.getAccessToken();
                return this.query(terms, true);
            }
            throw error;
        }
    }
}
