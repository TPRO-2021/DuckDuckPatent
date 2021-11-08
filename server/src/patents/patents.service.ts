import {
    AuthResponse,
    DocumentInformation,
    OpsDocumentInstance,
    OpsExchangeDocument,
    OpsImageQueryResponse,
    OpsStringData,
    Patent,
    PatentQueryResponse,
    QueryResult,
} from './models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse, ResponseType } from 'axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import * as _ from 'lodash';

@Injectable()
export class PatentsService {
    private authData: AuthResponse;
    private data: PatentQueryResponse;

    private static patentQueryEndpoint = '/rest-services/published-data/search/biblio';
    private static imageQueryEndpoint = '/rest-services/published-data/publication/epodoc/';

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
    async get(patentNum: string): Promise<AxiosResponse<PatentQueryResponse>> {
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
            this.httpService.get<PatentQueryResponse>(`${process.env.PATENT_API_URL}/patents/query`, config),
        );
    }

    // to query for cited patents for provided source
    async getCitedPatents(patentNum: string): Promise<AxiosResponse<PatentQueryResponse>> {
        const patentID = patentNum;
        if (!this.authData) {
            this.authData = await this.getAccessToken();
        }
        const headers = {
            Authorization: `Bearer ${this.authData.access_token}`,
            Accept: 'application/json',
        };
        return await lastValueFrom(
            this.httpService.get<PatentQueryResponse>(
                `${process.env.PATENT_API_URL}rest-services/published-data/publication/epodoc/${patentID}/biblio`,
                { headers: headers },
            ),
        );
    }

    /**
     * Queries the patent API with the provided search terms
     * @param terms The terms which will be used for querying
     * @param page The page that should be queried
     * @param languages
     * @param country
     * @param date
     */
    public async query(terms: string[], page: number, languages = '', country = '', date = ''): Promise<QueryResult> {
        const queryString = PatentsService.getQueryString(
            terms,
            PatentsService.patentQueryEndpoint,
            page,
            country,
            date,
        );
        console.log(queryString);

        const response = await this.sendOpsRequest<PatentQueryResponse>(queryString, {}, 'get');
        return this.processQuery(response.data, languages);
    }

    /**
     * Returns available images for a patent
     * @param patentId
     */
    public async queryDocuments(patentId: string): Promise<DocumentInformation[]> {
        const queryUrl = `${process.env.PATENT_API_URL}${PatentsService.imageQueryEndpoint}${patentId}/images`;

        const opsResponse = await this.sendOpsRequest<OpsImageQueryResponse>(queryUrl, {}, 'get');

        return this.processImageQuery(opsResponse.data);
    }

    public async getDocument(url: string, contentType: string, range: number) {
        const queryUrl = `${process.env.PATENT_API_URL}/rest-services/${url}`;

        return this.sendOpsRequest(
            queryUrl,
            {
                headers: {
                    'X-OPS-Range': range,
                },
                responseType: 'arraybuffer',
                responseEncoding: 'binary',
            },
            'get',
            false,
            contentType,
        );
    }

    /**
     * Processes an OPS query and returns a much cleaner structure with the needed data
     * @param data
     * @param languages
     */
    private processQuery(data: PatentQueryResponse, languages?: string): QueryResult {
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
            // filter for only the existing languages for the title and by default if no filter applied it is English
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
                familyId: item['@family-id'] || null,
                inventors: PatentsService.getNestedArray<string[]>(
                    item,
                    'bibliographic-data.parties.inventors.inventor',
                    (inventors) => {
                        const inventorMap = inventors.reduce((map, inventor) => {
                            const item = map[inventor['@sequence']];

                            if (!item) {
                                map[inventor['@sequence']] = [inventor];
                                return map;
                            }

                            item.push(inventor);
                            return map;
                        }, {});

                        return Object.keys(inventorMap).map(
                            (sequence) => inventorMap[sequence][0]['inventor-name'].name.$,
                        );
                    },
                    [] as string[],
                ),
                applicants: PatentsService.getNestedArray<string[]>(
                    item,
                    'bibliographic-data.parties.applicants.applicant',
                    (applicants) => {
                        const applicantMap = applicants.reduce((map, applicant) => {
                            const item = map[applicant['@sequence']];

                            if (!item) {
                                map[applicant['@sequence']] = [applicant];
                                return map;
                            }

                            item.push(applicant);
                            return map;
                        }, {});

                        return Object.keys(applicantMap).map(
                            (sequence) => applicantMap[sequence][0]['applicant-name'].name.$,
                        );
                    },
                    [] as string[],
                ),
            }));

        return {
            patents: processed,
            total: totalResults,
        };
    }

    /**
     * Attempts to get the title of a patent from the provided data
     * @param doc
     * @param languages
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
        if (!titleSupported) {
            return titles[0].$;
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
     *
     * @param doc
     * @param languages
     * @private
     */
    private static getAbstract(doc: OpsExchangeDocument, languages: string): string {
        let abstracts = doc.abstract;

        // if no abstract exists we can return unknown abstract
        if (!abstracts) {
            return 'No abstract available';
        }

        // In some edge cases it can happen that the abstract is an object
        if (!(abstracts instanceof Array)) {
            abstracts = [abstracts];
        }

        // filtering for the provided languages
        const abstractSupported = abstracts.find((abstract) => languages.includes(abstract['@lang']));
        //if the abstract is not existing by default in english or one of the filtered languages return this message
        if (!abstractSupported) {
            return abstracts[0].p.$;
        }

        return abstractSupported.p.$;
    }

    /**
     * Attempts to process the passed document according to the passed parameters
     * @param doc   The document
     * @param path  The path where the array data is found
     * @param processingFn  The function which should process the data
     * @param defaultValue  The default value which should be applied when no data was found
     * @private
     */
    private static getNestedArray<T>(doc: any, path: string, processingFn, defaultValue: T): T {
        let instanceArr = _.get(doc, path);

        if (!instanceArr) {
            return defaultValue;
        }

        if (!(instanceArr instanceof Array)) {
            instanceArr = [instanceArr];
        }

        return processingFn(instanceArr);
    }

    /**
     * Compiles an OPS query string based on the provided data
     * @param searchTerms   The search terms which need to be added to the URL
     * @param endpoint      The target endpoint
     * @param page          The page which should be retrieved
     * @param country          The page which should be retrieved
     * @param date          The page which should be retrieved
     * @private
     */
    private static getQueryString(searchTerms: string[], endpoint: string, page = 0, country = '', date = ''): string {
        let queryString = `${process.env.PATENT_API_URL}`
            .concat(endpoint)
            .concat(`?q=ti%3D ${searchTerms} or ab%3D ${searchTerms}`);

        if (country.trim().length > 0) {
            queryString = queryString.concat(` and pn any "${country}"`);
        }

        if (date.trim().length > 0) {
            queryString = queryString.concat(` and pd within "${date}"`);
        }

        return queryString.concat(`&Range=${page * 100 + 1}-${(page + 1) * 100}`);
    }

    /**
     * Restructures an image query to the desired format
     * @param data
     * @private
     */
    private async processImageQuery(data: OpsImageQueryResponse): Promise<DocumentInformation[]> {
        return PatentsService.getNestedArray<OpsDocumentInstance[]>(
            data,
            'ops:world-patent-data.ops:document-inquiry.ops:inquiry-result.ops:document-instance',
            (imageInformation) => imageInformation,
            [],
        ).map((document) => ({
            formats: PatentsService.getNestedArray(
                document,
                'ops:document-format-options.ops:document-format',
                (format: OpsStringData[]) => format.map((format) => format.$),
                [],
            ),
            type: (document['@desc'] || 'unknown').toLowerCase(),
            url: document['@link'],
            sections: PatentsService.getNestedArray(
                document,
                'ops:document-section',
                (sections: { '@name': string; '@start-page': string }[]) =>
                    sections.map((section) => ({ name: section['@name'], startPage: section['@start-page'] })),
                [],
            ),
            pages: Number(document['@number-of-pages'] || 0),
        }));
    }

    /**
     * Sends an ops request. It will also attempt to renew the access token once expired
     * @param endpoint
     * @param config
     * @param requestType
     * @param isSecondAttempt
     * @param accept
     * @param acceptEncoding
     * @private
     */
    private async sendOpsRequest<T>(
        endpoint: string,
        config: { headers?; responseType?: ResponseType; responseEncoding?: string },
        requestType: 'get',
        isSecondAttempt = false,
        accept = 'application/json',
        acceptEncoding = 'gzip, deflate, br',
    ): Promise<{ data: T; headers: Record<string, string> }> {
        try {
            // if no auth data is present we need to generate an access token
            if (!this.authData) {
                this.authData = await this.getAccessToken();
            }

            // extend the provided config object with the auth info
            config.headers = {
                ...(config.headers || {}),
                Authorization: `Bearer ${this.authData.access_token}`,
                Accept: accept,
                'Accept-Encoding': acceptEncoding,
            };

            console.log('endpoint', endpoint);

            const response = await lastValueFrom(this.httpService[requestType]<T>(endpoint, config));
            return { data: response.data as T, headers: response.headers };
        } catch (error) {
            // if access token is expired we will attempt to renew it and send the request again
            if ((error?.response?.data as string)?.toLowerCase().includes('access token has expired')) {
                // after a second attempt there should be no access expired error therefore we can stop here to prevent a stackoverflow
                if (isSecondAttempt) {
                    throw error;
                }

                console.log('Authentication error. Attempting to refresh the token');
                this.authData = await this.getAccessToken();
                return this.sendOpsRequest<T>(endpoint, config, requestType, true);
            }
            throw error;
        }
    }
}
