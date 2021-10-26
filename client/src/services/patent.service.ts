import { Patent } from '@/models/Patent';

export default class PatentService {
    requestPending = false;
    controller?: AbortController;

    public async get(searchTerms: string[]): Promise<Patent[]> {
        const queryString = searchTerms.map((term) => `keywords=${term}`).join('&');

        // if request pending, abort it.
        if (this.requestPending && this.controller) {
            PatentService.abortRequest(this.controller);
        }
        //generate signal for new request
        this.controller = new AbortController();
        this.requestPending = true;
        let json;

        const response = await fetch(`http://localhost:3000/patents?${queryString}`, {
            signal: this.controller.signal,
        });
        if (!response.ok) {
            json = [];
            //   console.log('My error occurred. status: ', response.status); // TODO: Remove this after review approved
            // console.log('My error occurred. message: ', response.statusText);
            PatentService.throwError(response.status);
        }
        json = (await response.json()) as Promise<Patent[]>;
        this.requestPending = false;
        return json;
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
