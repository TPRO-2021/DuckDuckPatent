import HttpService from '@/services/http.service';
import { DocumentInformation } from '@/models/DocumentInformation';

export default class DocumentService extends HttpService {
    /**
     * Queries the backend for images belonging to a patent
     * @param patentId
     */
    async query(patentId: string): Promise<DocumentInformation[] | null> {
        // if request pending, abort it.
        if (this.requestPending && this.controller) {
            DocumentService.abortRequest(this.controller);
        }

        //generate signal for new request
        this.controller = new AbortController();
        this.requestPending = true;

        const response = await this.makeRequest(`/api/patents/${patentId}/images`);
        const json = (await response.json()) as DocumentInformation[];

        this.requestPending = false;
        return json;
    }
}
