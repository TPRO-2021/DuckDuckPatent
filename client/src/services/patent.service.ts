import HttpService from '@/services/http.service';
import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import FilterHelperService from '@/services/filter-helper.service';

export default class PatentService extends HttpService {
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

        const response = await this.makeRequest(`/api/patents?${queryString}`);

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
}
