export default class HttpService {
    requestPending: boolean;
    controller?: AbortController;

    constructor() {
        this.requestPending = false;
    }

    /**
     * Makes a request and also aborts previous pending requests
     * @param url
     * @protected
     */
    protected async makeRequest(url: string): Promise<Response> {
        // if request pending, abort it.
        if (this.requestPending && this.controller) {
            HttpService.abortRequest(this.controller);
        }
        //generate signal for new request
        this.controller = new AbortController();
        this.requestPending = true;

        const response = await fetch(url, {
            signal: this.controller.signal,
        });

        if (!response.ok) {
            HttpService.throwError(response.status);
        }

        return response;
    }

    /**
     * Distinguishes between general and patent not found error and rethrows that error
     * @param status
     * @private
     */
    protected static throwError(status: number): void {
        if (status === 500 || status === 404) {
            throw new Error('Not Found.');
        } else {
            throw new Error('General error.');
        }
    }

    /**
     * Attempts to abort a already dispatched request
     * @param reqController
     * @private
     */
    protected static abortRequest(reqController: AbortController): void {
        reqController.abort();
    }
}
