import { AuthResponse, OpsExchangeDocument, Patent, PatentAPIResponse, QueryResult } from './models';
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
    public async query(terms: string[], isSecondAttempt = false): Promise<QueryResult> {
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
            const response = await lastValueFrom(
                this.httpService.get<PatentAPIResponse>(
                    `${process.env.PATENT_API_URL}/rest-services/published-data/search/biblio?q=ti%3D ${terms} or ab%3D ${terms}&Range=1-100`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.authData.access_token}`,
                            Accept: 'application/json',
                        },
                    },
                ),
            );

            return this.processQuery(response.data);
        } catch (error) {
            // if access token is expired we will attempt to renew it and send the request again
            if ((error?.response?.data as string)?.toLowerCase().includes('access token has expired')) {
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

    /**
     * Processes an OPS query and returns a much cleaner structure with the needed data
     * @param data
     */
    private processQuery(data: PatentAPIResponse): QueryResult {
        const searchResult = data['ops:world-patent-data']['ops:biblio-search'];

        const totalResults = Number(searchResult['@total-result-count']);
        const queryData = searchResult['ops:search-result']['exchange-documents'];

        const processed = queryData
            .map((item) => ({
                ...item['exchange-document'],
            }))
            .map((item) => ({
                id: `${item['@country']}${item['@doc-number']}.${item['@kind']}`,
                title: PatentsService.getTitle(item),
                citations: PatentsService.getCitations(item),
                abstract: PatentsService.getAbstract(item),
            }));

        return {
            patents: processed,
            total: totalResults,
        };
    }

    /**
     * Attempts to get the title of a patent from the provided data
     * @param doc
     * @private
     */
    private static getTitle(doc: OpsExchangeDocument): string {
        let titles = doc['bibliographic-data']['invention-title'];

        // In some edge cases it can happen that the title is an object
        if (!(titles instanceof Array)) {
            titles = [titles];
        }

        // filtering for the english title
        const titleEn = titles.filter((title) => title['@lang'] === 'en');

        // if an english title is available we should use that
        if (titleEn.length === 1) {
            titles = titleEn;
        }

        return titles[0].$;
    }

    /**
     * Gets citations from a provided OpsExchangeDocument
     * @param doc
     * @private
     */
    private static getCitations(doc: OpsExchangeDocument): Patent[] {
        let citations = doc['bibliographic-data']['references-cited']?.citation;

        if (!citations || citations.length === 0) {
            return [] as Patent[];
        }

        if (!(citations instanceof Array)) {
            citations = [citations];
        }

        return (
            citations
                // some patents have citations to non-patent sources. we have to filter those out
                .filter((citation) => citation.patcit)
                .map((citation) => {
                    const docDbId = citation.patcit['document-id'].filter(
                        (docId) => docId['@document-id-type'] === 'docdb',
                    )[0];

                    return {
                        id: `${docDbId.country.$}${docDbId['doc-number'].$}.${docDbId.kind.$}`,
                    };
                }) as Patent[]
        );
    }

    /**
     * Gets the abstract from a provided OpsExchangeDocument
     * @param doc
     * @private
     */
    private static getAbstract(doc: OpsExchangeDocument): string {
        let abstracts = doc.abstract;

        // if no abstract exists we can return an empty string
        if (!abstracts) {
            return '';
        }

        // In some edge cases it can happen that the abstract is an object
        if (!(abstracts instanceof Array)) {
            abstracts = [abstracts];
        }

        // filtering for the english abstract
        const abstractEn = abstracts.filter((abstract) => abstract['@lang'] === 'en');

        // if an english abstract is available we should use that
        if (abstractEn.length === 1) {
            abstracts = abstractEn;
        }

        return abstracts[0].p.$;
    }
}
