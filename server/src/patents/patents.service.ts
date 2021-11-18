import {
    AuthResponse,
    DocumentInformation,
    OpsImageQueryResponse,
    OpsPatent,
    Patent,
    PatentFamilyResponse,
    PatentQueryResponse,
    QueryResult,
} from './models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ResponseType } from 'axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PatentsServiceHelper } from './patents.service.helper';

/**
 * Contains the business logic for patent retrieval
 */
@Injectable()
export class PatentsService {
    private authData: AuthResponse;
    private data: PatentQueryResponse;

    // endpoints
    private static patentEndpoint = '/rest-services/published-data/search/biblio';
    private static epoDocEndpoint = '/rest-services/published-data/publication/epodoc/';
    private static familyEndpoint = '/rest-services/family/publication/docdb/';

    constructor(private readonly httpService: HttpService) {}

    /**
     * Queries the patent API for the patent belonging to the patentId
     *
     * @param patentId  The id of the patent
     */
    async get(patentId: string): Promise<Patent> {
        // compile the url for retrieving the patent
        const url = process.env.PATENT_API_URL.concat(PatentsService.epoDocEndpoint).concat(patentId).concat('/biblio');

        const patentResponse = await this.sendOpsRequest<OpsPatent>(url, {}, 'get');

        // return the processed version of the patent
        return PatentsServiceHelper.processPatent(
            patentResponse.data['ops:world-patent-data']['exchange-documents']['exchange-document'],
        );
    }

    /**
     * Queries the patent API with the provided search terms
     *
     * @param terms The terms which will be used for querying
     * @param page  The page that should be queried
     * @param languages The preferred language(s)
     * @param country   The country filter
     * @param date      The date filter
     * @param inventor  The inventor filter
     * @param applicant The applicant filter
     */
    public async query(
        terms: string[],
        page: number,
        languages = '',
        country = '',
        date = '',
        inventor?: string,
        applicant?: string,
    ): Promise<QueryResult> {
        // compile query string
        const queryString = PatentsServiceHelper.getQueryString(
            terms,
            PatentsService.patentEndpoint,
            page,
            country,
            date,
            inventor,
            applicant,
            inventor || applicant ? 5 : 100,
        );

        const response = await this.sendOpsRequest<PatentQueryResponse>(queryString, {}, 'get');

        // return processed patent
        return PatentsServiceHelper.processQuery(response.data, languages);
    }

    /**
     * Queries the patent family of a patent
     *
     * @param patentId  The patentId for which to query the family
     */
    public async queryFamily(patentId: string) {
        // compile the query string
        const queryString = process.env.PATENT_API_URL.concat(PatentsService.familyEndpoint)
            .concat(patentId)
            .concat('/biblio');

        const opsResponse = await this.sendOpsRequest<PatentFamilyResponse>(queryString, {}, 'get');

        // convert family response to patent response to simplify processing
        const converted = {
            'ops:world-patent-data': {
                'ops:biblio-search': {
                    '@total-result-count':
                        opsResponse.data['ops:world-patent-data']['ops:patent-family']['@total-result-count'],
                    'ops:search-result': {
                        'exchange-documents':
                            opsResponse.data['ops:world-patent-data']['ops:patent-family']['ops:family-member'],
                    },
                },
            },
        } as PatentQueryResponse;

        // return processed patents
        return PatentsServiceHelper.processQuery(converted);
    }

    /**
     * Returns document information for a patent
     *
     * @param patentId  The patent id
     */
    public async queryDocuments(patentId: string): Promise<DocumentInformation[]> {
        // compile query string for the request
        const queryUrl = `${process.env.PATENT_API_URL}${PatentsService.epoDocEndpoint}${patentId}/images`;

        const opsResponse = await this.sendOpsRequest<OpsImageQueryResponse>(queryUrl, {}, 'get');

        // return processed response
        return PatentsServiceHelper.processImageQuery(opsResponse.data);
    }

    /**
     * Retrieves a document from the OPS rest services
     *
     * @param url   The target-url of the document
     * @param contentType   The content type which should be requested
     * @param range The page which should be retrieved (only 1 page possible)
     */
    public async getDocument(url: string, contentType: string, range: number) {
        // compile query url
        const queryUrl = `${process.env.PATENT_API_URL}/rest-services/${url}`;

        // return the binary document response
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
     * Sends an ops request. It will also attempt to renew the access token once expired
     *
     * @param endpoint  The endpoint for the request
     * @param config    The config for the fetch request
     * @param requestType   The request type (get, post, ...)
     * @param isSecondAttempt   Optional parameter for secondary requests (if auth has to be renewed)
     * @param accept    The accept header (defaults to 'application/json')
     * @param acceptEncoding    The accept-encoding (defaults to 'gzip, deflate, br')
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

            const response = await lastValueFrom(this.httpService[requestType]<T>(endpoint, config));

            // return response data and headers
            return { data: response.data as T, headers: response.headers };
        } catch (error) {
            // if access token is expired we will attempt to renew it and send the request again
            if ((error?.response?.data as string)?.toLowerCase().includes('access token has expired')) {
                // after a second attempt there should be no access expired error therefore we can stop here to prevent a stackoverflow
                if (isSecondAttempt) {
                    throw error;
                }

                console.log('Authentication error. Attempting to refresh the token');

                // renew access token
                this.authData = await this.getAccessToken();

                // try request again
                return this.sendOpsRequest<T>(endpoint, config, requestType, true, accept, acceptEncoding);
            }
            throw error;
        }
    }

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
            // sending auth-request
            const response = await lastValueFrom(
                this.httpService.post<AuthResponse>(
                    `${process.env.PATENT_API_URL}/auth/accesstoken`,
                    'grant_type=client_credentials',
                    {
                        headers: headers,
                    },
                ),
            );

            // returning the auth-response
            return response.data as AuthResponse;
        } catch (error) {
            console.error(`Error while authenticating with ${process.env.PATENT_API_URL}`);
            throw new UnauthorizedException(error);
        }
    }
}
