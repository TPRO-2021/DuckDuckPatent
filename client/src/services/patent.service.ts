import { Patent } from '@/models/Patent';

export default class PatentService {
    requestPending = false;
    controller?: AbortController;

    public async get(searchTerms: string[], page = 0): Promise<{ patents: Patent[]; totalCount: number }> {
        const queryString = searchTerms
            .map((term) => `keywords=${term}`)
            .join('&')
            .concat(`&page=${page}`);

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

        // accessing x-total-count header which indicates how many results are available
        const totalCount = parseInt(response.headers.get('x-total-count') || '99');

        let json: Patent[];

        try {
            json = (await response.json()) as Patent[];
        } catch (e) {
            // TODO: Throw a meaningful error and display the message in the corresponding view
            console.error(e);
            json = [];
        }
        this.requestPending = false;
        return { patents: json, totalCount };
    }

    private static abortRequest(reqController: AbortController): void {
        reqController.abort();
    }

    // TODO: check with Samu if it does what's expected
    public async getSinglePatent(searchedID: string[]): Promise<Patent> {
        const queryString = searchedID.map((term) => `id=${term}`).join('&');
        const response = await fetch(`http://localhost:3000/patents?${queryString}`);
        return response.json() as Promise<Patent>;
    }
}
