import { AuthResponse, OpsAbstract, OpsExchangeDocument, Patent, PatentAPIResponse, QueryResult } from './models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class PatentsService {
    private authData: AuthResponse;
    private data: PatentAPIResponse;

    private static queryEndpoint = '/rest-services/published-data/search/biblio';

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
     * @param terms The terms which will be used for querying
     * @param page The page that should be queried
     * @param isSecondAttempt Specifies if this is the second attempt (auth)
     */
    public async query(
        terms: string[],
        page: number,
        isSecondAttempt = false,
        languages?: string,
        country?: string,
        date?: string,
    ): Promise<QueryResult> {
        // if no auth data is present we need to generate an access token
        if (!this.authData) {
            this.authData = await this.getAccessToken();
        }

        const queryString = PatentsService.getQueryString(terms, PatentsService.queryEndpoint, page, country, date);
        console.log(queryString);

        try {
            const response = await lastValueFrom(
                this.httpService.get<PatentAPIResponse>(queryString, {
                    headers: {
                        Authorization: `Bearer ${this.authData.access_token}`,
                        Accept: 'application/json',
                    },
                }),
            );

            return this.processQuery(response.data, languages);
        } catch (error) {
            // if access token is expired we will attempt to renew it and send the request again
            if ((error?.response?.data as string)?.toLowerCase().includes('access token has expired')) {
                // after a second attempt there should be no access expired error therefore we can stop here to prevent a stackoverflow
                if (isSecondAttempt) {
                    throw error;
                }

                this.authData = await this.getAccessToken();
                return this.query(terms, page, true);
            }
            throw error;
        }
    }

    /**
     * Processes an OPS query and returns a much cleaner structure with the needed data
     * @param data
     */
    private processQuery(data: PatentAPIResponse, languages?: string): QueryResult {
        const searchResult = data['ops:world-patent-data']['ops:biblio-search'];

        const totalResults = Number(searchResult['@total-result-count']);
        let queryData = searchResult['ops:search-result']['exchange-documents'];
        if (!(queryData instanceof Array)) {
            queryData = [queryData];
        }

        const processed = queryData
            .map((item) => ({
                ...item['exchange-document'],
            }))
            /**
             * filter for only the existing languages for the title and by default if no filter applied it is English
             */
            .filter((item) => {
                let title = item['bibliographic-data']['invention-title'];
                if (!(title instanceof Array)) {
                    title = [title];
                }
                const patentLanguages = title.filter((t) => t).map((translation) => translation['@lang']);
                return patentLanguages.some((lang) => languages.includes(lang));
            })
            .map((item) => ({
                id: `${item['@country']}${item['@doc-number']}.${item['@kind']}`,
                title: PatentsService.getTitle(item, languages),
                citations: PatentsService.getCitations(item),
                abstract: PatentsService.getAbstract(item, languages),
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
    private static getTitle(doc: OpsExchangeDocument, languages: string): string {
        let titles = doc['bibliographic-data']['invention-title'];

        if (!titles) {
            return 'Unknown Title';
        }

        // In some edge cases it can happen that the title is an object
        if (!(titles instanceof Array)) {
            titles = [titles];
        }
        // filtering for the provided languages
        const titleSupported = titles.find((title) => languages.includes(title['@lang']));
        //if the Title is not existing by default in english or one of the filtered languages return this message
        if (titleSupported == null) {
            return 'Title available in a different languages';
        }

        return titleSupported.$;
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
    private static getAbstract(doc: OpsExchangeDocument, languages: string): string {
        let abstracts = doc.abstract;

        // if no abstract exists we can return unknown abstract
        if (!abstracts) {
            return 'Unknown Abstract';
        }

        // In some edge cases it can happen that the abstract is an object
        if (!(abstracts instanceof Array)) {
            abstracts = [abstracts];
        }

        // filtering for the provided languages
        const abstractSupported = abstracts.find((abstract) => languages.includes(abstract['@lang']));
        //if the abstract is not existing by default in english or one of the filtered languages return this message
        if (abstractSupported == null) {
            return 'Abstract available in a different languages';
        }

        return abstractSupported.p.$;
    }

    /**
     * Compiles an OPS query string based on the provided data
     * @param searchTerms   The search terms which need to be added to the URL
     * @param endpoint      The target endpoint
     * @param page          The page which should be retrieved
     * @private
     */
    private static getQueryString(
        searchTerms: string[],
        endpoint: string,
        page = 0,
        country?: string,
        date?: string,
    ): string {
        //if to check if no filter applied
        if (country.length <= 0 && date.length <= 0) {
            return `${process.env.PATENT_API_URL}`
                .concat(endpoint)
                .concat(`?q=ti%3D ${searchTerms} or ab%3D ${searchTerms}`)
                .concat(`&Range=${page * 100 + 1}-${(page + 1) * 100}`);
            //check if both country and date applied
        } else if (country.length > 0 && date.length > 0) {
            return `${process.env.PATENT_API_URL}`
                .concat(endpoint)
                .concat(`?q=ti%3D ${searchTerms} or ab%3D ${searchTerms} and`)
                .concat(` pn any "${country}" and`)
                .concat(` pd within "${date}"`)
                .concat(`&Range=${page * 100 + 1}-${(page + 1) * 100}`);
            //check if only the country filter applied
        } else if (country.length > 0 && date.length <= 0) {
            return `${process.env.PATENT_API_URL}`
                .concat(endpoint)
                .concat(`?q=ti%3D ${searchTerms} or ab%3D ${searchTerms} and`)
                .concat(` pn any "${country}"`)
                .concat(`&Range=${page * 100 + 1}-${(page + 1) * 100}`);
            //check if only the date filter applied
        } else if (date.length > 0 && country.length <= 0) {
            return `${process.env.PATENT_API_URL}`
                .concat(endpoint)
                .concat(`?q=ti%3D ${searchTerms} or ab%3D ${searchTerms} and`)
                .concat(` pd within "${date}"`)
                .concat(`&Range=${page * 100 + 1}-${(page + 1) * 100}`);
        }
    }
}
