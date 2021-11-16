import HttpService from '@/services/http.service';
import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import FilterHelperService from '@/services/filter-helper.service';

/**
 * Service which provides functions to access patent resources. It extends the HTTPService
 */
export default class PatentService extends HttpService {
    constructor() {
        super('/api/patents');
    }

    /**
     * Queries the backend for patents matching the search terms and filters
     * @param searchTerms   The search terms array used for filtering
     * @param filters   The filters which should be used
     * @param page  The patent page which should be used (default: 0)
     * @param abortPrevious Whether the previous request should be aborted or not
     * @param contentType   The content type which should be requested
     */
    public async query(
        searchTerms: string[],
        filters: Filter[],
        page = 0,
        abortPrevious = true,
        contentType = 'application/json',
    ): Promise<{ patents: Patent[]; totalCount: number }> {
        const filterParams = FilterHelperService.getParameterList(filters);

        let queryString: string | string[] = [];

        if (searchTerms.length > 0) {
            queryString = searchTerms.map((term) => `keywords=${term}`);
        }

        queryString = queryString.concat(filterParams).concat(`page=${page}`).join('&');

        // make request
        const response = await this.makeRequest(`${this.baseUrl}?${queryString}`, contentType, abortPrevious);

        // accessing x-total-count header which indicates how many results are available
        const totalCount = parseInt(response.headers.get('x-total-count') || '99');
        const json = (await response.json()) as Patent[];

        // reset requestPending variable
        this.requestPending = false;

        //temporary approach to handle no results meeting filters
        if (json.length === 0) {
            PatentService.throwError(404);
        }

        // return patents and total count
        return { patents: json, totalCount };
    }

    /**
     * Queries the backend for patents belonging to the same patent family
     *
     * @param patentId  The id of the patent for which to get the family
     */
    public async queryFamily(patentId: string): Promise<Patent[]> {
        const queryUrl = this.baseUrl.concat('/').concat(patentId).concat('/family');

        const response = await this.makeRequest(queryUrl);
        const json = (await response.json()) as { patents: Patent[]; total: number };

        return json.patents;
    }

    /**
     * Loads a single patent from the backend
     *
     * @param patentId  The id of the patent for which to get the patent
     */
    public async get(patentId: string): Promise<Patent> {
        const queryUrl = this.baseUrl.concat(`/${patentId}`);

        const response = await this.makeRequest(queryUrl, 'application/json', false);
        return (await response.json()) as Patent;
    }
}
