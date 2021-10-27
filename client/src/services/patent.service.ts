import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';

export default class PatentService {
    requestPending = false;
    controller?: AbortController;

    public async get(searchTerms: string[], filters: Filter[], page = 0): Promise<{ patents: Patent[]; totalCount: number }> {
        // Prep the filter get parameters
        const filterParams = filters
            .filter((filter) => filter.type !== 'empty' && filter.value) // Remove unfinished or mal-formed filters
            .map((filter) => `${filter.type}=${filter.value}`); // Convert to key=value strings

        const queryString = searchTerms
            .map((term) => `keywords=${term}`)
            .concat(filterParams)
            .join('&');

        // if request pending, abort it.
        if (this.requestPending && this.controller) {
            PatentService.abortRequest(this.controller);
        }
        //generate signal for new request
        this.controller = new AbortController();
        this.requestPending = true;

        const response = await fetch(`http://localhost:3000/patents?${queryString}`, {
            signal: this.controller.signal,
        });

        let json: Patent[];
        if (!response.ok) {
            json = [];
            PatentService.throwError(response.status);
        }
        // accessing x-total-count header which indicates how many results are available
        const totalCount = parseInt(response.headers.get('x-total-count') || '99');
        json = (await response.json()) as Patent[];
        this.requestPending = false;
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
