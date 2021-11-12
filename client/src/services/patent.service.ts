import HttpService from '@/services/http.service';
import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import FilterHelperService from '@/services/filter-helper.service';

export default class PatentService extends HttpService {
    constructor() {
        super('/api/patents');
    }

    /**
     * Queries the backend for patents matching the search terms and filters
     * @param searchTerms
     * @param filters
     * @param page
     */
    public async query(
        searchTerms: string[],
        filters: Filter[],
        page = 0,
    ): Promise<{ patents: Patent[]; totalCount: number }> {
        const filterParams = FilterHelperService.getParameterList(filters);

        const queryString = searchTerms
            .map((term) => `keywords=${term}`)
            .concat(filterParams)
            .concat(`page=${page}`)
            .join('&');

        const response = await this.makeRequest(`${this.baseUrl}?${queryString}`);

        // accessing x-total-count header which indicates how many results are available
        const totalCount = parseInt(response.headers.get('x-total-count') || '99');
        const json = (await response.json()) as Patent[];

        // reset requestPending variable
        this.requestPending = false;

        //temporary approach to handle no results meeting filters
        if (json.length === 0) {
            PatentService.throwError(404);
        }

        return { patents: json, totalCount };
    }

    /**
     * Queries the backend for patents belonging to the same patent family
     * @param patentId
     */
    public async queryFamily(patentId: string): Promise<Patent[]> {
        const queryUrl = this.baseUrl.concat('/').concat(patentId).concat('/family');

        const response = await this.makeRequest(queryUrl);
        const json = (await response.json()) as { patents: Patent[]; total: number };

        return json.patents;
    }

    /**
     * Loads a single patent from the backend
     * @param patentId
     */
    public async get(patentId: string): Promise<Patent> {
        const queryUrl = this.baseUrl.concat(`/${patentId}`);

        const response = await this.makeRequest(queryUrl, 'application/json', false);
        return (await response.json()) as Patent;
    }
}
