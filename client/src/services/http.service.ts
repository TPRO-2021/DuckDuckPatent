export default class HttpService {
    protected requestPending: boolean;
    protected controller?: AbortController;
    protected baseUrl: string;

    constructor(baseUrl = '') {
        this.requestPending = false;
        this.baseUrl = baseUrl;
    }

    /**
     * Makes a request and also aborts previous pending requests
     * @param url   The target url for the request
     * @param accept    The content type which should be used as the Accept header
     * @param abortRequest  Specifies weather the request should be aborted if another one is pending
     * @protected
     */
    protected async makeRequest(url: string, accept = 'application/json', abortRequest = true): Promise<Response> {
        // if request pending, abort it.
        if (this.requestPending && this.controller && abortRequest) {
            HttpService.abortRequest(this.controller);
        }
        //generate signal for new request
        this.controller = new AbortController();
        this.requestPending = true;

        const response = await fetch(url, {
            signal: this.controller.signal,
            headers: {
                Accept: accept,
            },
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
