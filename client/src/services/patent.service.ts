import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import FilterHelperService from '@/services/filter-helper.service';

export default class PatentService {
    requestPending = false;
    controller?: AbortController;

    public async get(
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

        // if request pending, abort it.
        if (this.requestPending && this.controller) {
            PatentService.abortRequest(this.controller);
        }
        //generate signal for new request
        this.controller = new AbortController();
        this.requestPending = true;

        const response = await fetch(`/api/patents?${queryString}`, {
            signal: this.controller.signal,
        });

        if (!response.ok) {
            PatentService.throwError(response.status);
        }

        // accessing x-total-count header which indicates how many results are available
        const totalCount = parseInt(response.headers.get('x-total-count') || '99');
        const json = (await response.json()) as Patent[];
        this.requestPending = false;

        //temporary approach to handle no results meeting filters
        if (json.length === 0) {
            PatentService.throwError(404);
        }
        return { patents: json, totalCount };
    }

    // distinguishes between general and patent not found error
    private static throwError(status: number): void {
        if (status === 500 || status === 404) {
            throw new Error('Not Found.');
        } else {
            throw new Error('General error.');
        }
    }

    private static abortRequest(reqController: AbortController): void {
        reqController.abort();
    }

    // TODO: check with Samu if it does what's expected
    // public async getSinglePatent(searchedID: string[]): Promise<Patent> {
    //     const queryString = searchedID.map((term) => `id=${term}`).join('&');
    //     const response = await fetch(`http://localhost:3000/patents?${queryString}`);
    //     return response.json() as Promise<Patent>;
    // }
}
