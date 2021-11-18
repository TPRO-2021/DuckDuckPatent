import HttpService from '@/services/http.service';
import { DocumentInformation } from '@/models/DocumentInformation';

/**
 * Service which provides functions to access document resources. It extends the HTTPService
 */
export default class DocumentService extends HttpService {
    /**
     * Queries the backend for documents belonging to a patent
     *
     * @param patentId  The id of the patent for which to query the documents
     */
    async query(patentId: string): Promise<DocumentInformation[] | null> {
        const response = await this.makeRequest(`/api/patents/${patentId}/documents`);
        const json = (await response.json()) as DocumentInformation[];

        this.requestPending = false;
        return json;
    }

    /**
     * Retrieves a page of the document
     * @param patentId The id of the patent
     * @param document  The document information object
     * @param page  The page that should be retrieved
     */
    async get(patentId: string, document: DocumentInformation, page = 1): Promise<Blob> {
        // compile the url string;
        const url = `/api/patents/${patentId}/documents/${btoa(document.url)}?range=${page}`;

        // preferable we want to get a pdf document back
        const type = DocumentService.getFormat(document);

        const response = await this.makeRequest(url, type);

        // return the data as a blob
        return response.blob();
    }

    /**
     * Attempts to get the format of a document information object
     * @param document  The document information from which to derive the desired format
     */
    public static getFormat(document: DocumentInformation): string {
        // preferable we want to get a pdf document back
        let type = document.formats.filter((format) => format === 'application/json')[0];
        if (!type) {
            type = document.formats[0];
        }

        return type;
    }
}
