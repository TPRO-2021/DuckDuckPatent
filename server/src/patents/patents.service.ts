import {
    AuthResponse,
    DocumentInformation,
    OpsImageQueryResponse,
    OpsPatent,
    PatentFamilyResponse,
    PatentQueryResponse,
    QueryResult,
} from './models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ResponseType } from 'axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PatentsServiceHelper } from './patents.service.helper';

@Injectable()
export class PatentsService {
    private authData: AuthResponse;
    private data: PatentQueryResponse;

    private static patentEndpoint = '/rest-services/published-data/search/biblio';
    private static imageEndpoint = '/rest-services/published-data/publication/epodoc/';
    private static familyEndpoint = '/rest-services/family/publication/docdb/';

    constructor(private readonly httpService: HttpService) {}

    /**
     * Queries the patent API for the patent belonging to the patentId
     * @param patentId
     */
    async get(patentId: string): Promise<any> {
        const url = process.env.PATENT_API_URL.concat(PatentsService.imageEndpoint).concat(patentId).concat('/biblio');

        const patentResponse = await this.sendOpsRequest<OpsPatent>(url, {}, 'get');
        return PatentsServiceHelper.processPatent(
            patentResponse.data['ops:world-patent-data']['exchange-documents']['exchange-document'],
        );
    }

    /**
     * Queries the patent API with the provided search terms
     * @param terms The terms which will be used for querying
     * @param page The page that should be queried
     * @param languages
     * @param country
     * @param date
     * @param inventor
     * @param applicant
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
        return PatentsServiceHelper.processQuery(response.data, languages);
    }

    /**
     * Queries the patent family of a patent
     * @param patentId
     */
    public async queryFamily(patentId: string) {
        const queryString = process.env.PATENT_API_URL.concat(PatentsService.familyEndpoint)
            .concat(patentId)
            .concat('/biblio');

        const opsResponse = await this.sendOpsRequest<PatentFamilyResponse>(queryString, {}, 'get');

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

        return PatentsServiceHelper.processQuery(converted);
    }

    /**
     * Returns available images for a patent
     * @param patentId
     */
    public async queryDocuments(patentId: string): Promise<DocumentInformation[]> {
        const queryUrl = `${process.env.PATENT_API_URL}${PatentsService.imageEndpoint}${patentId}/images`;

        const opsResponse = await this.sendOpsRequest<OpsImageQueryResponse>(queryUrl, {}, 'get');

        return PatentsServiceHelper.processImageQuery(opsResponse.data);
    }

    /**
     * Gets a document from the OPS rest services
     * @param url
     * @param contentType
     * @param range
     */
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
}
